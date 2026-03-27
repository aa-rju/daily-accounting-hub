
import { RequestHandler } from "express";
import {
  prisma, getOrgId, listResponse, okResponse,
  nextPurchaseNumber, writeLedger, adjustAccount, deriveStatus,
} from "../db";

export const getPurchases: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50, status, supplierId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { orgId };
    if (status && status !== "all") where.status = String(status);
    if (supplierId) where.supplierId = String(supplierId);
    const [data, total] = await Promise.all([
      prisma.purchase.findMany({ where, skip, take: Number(pageSize), orderBy: { createdAt: "desc" }, include: { items: true } }),
      prisma.purchase.count({ where }),
    ]);
    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPurchase: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const purchase = await prisma.purchase.findFirst({ where: { id: req.params.id, orgId }, include: { items: true } });
    if (!purchase) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    res.json(okResponse(purchase));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createPurchase: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { purchaseNumber, supplierId, date, dueDate, items = [], paymentMethod = "cash", discountAmt = 0, taxPercentage = 0, notes } = req.body;

    if (!supplierId || !date || !items.length) {
      res.status(400).json({ success: false, message: "supplierId, date, items are required" }); return;
    }

    const supplier = await prisma.party.findFirst({ where: { id: supplierId, orgId } });
    if (!supplier) { res.status(404).json({ success: false, message: "Supplier not found" }); return; }

    const settings = await prisma.settings.findUnique({ where: { orgId } });
    const subtotal = items.reduce((s: number, i: any) => s + Number(i.rate) * Number(i.quantity) - Number(i.discount || 0), 0);
    const taxAmt = (subtotal - Number(discountAmt)) * (Number(taxPercentage) / 100);
    const total = subtotal - Number(discountAmt) + taxAmt;
    const resolvedNumber = purchaseNumber || (await nextPurchaseNumber(orgId, settings?.purchasePrefix || "PUR"));

    const purchase = await prisma.$transaction(async (tx: any) => {
      const pur = await tx.purchase.create({
        data: {
          orgId, purchaseNumber: resolvedNumber,
          supplierId, supplierName: (supplier as any).name,
          date: String(date), dueDate: dueDate ? String(dueDate) : null,
          subtotal, discountAmt: Number(discountAmt),
          tax: taxAmt, taxAmt, total,
          paidAmount: 0, dueAmount: total,
          paymentMethod, status: "received", notes: notes || null,
          items: {
            create: items.map((i: any) => ({
              productId: i.productId, productName: i.productName,
              quantity: Number(i.quantity), rate: Number(i.rate),
              discount: Number(i.discount || 0), taxRate: Number(i.taxRate || 0),
              amount: Number(i.rate) * Number(i.quantity) - Number(i.discount || 0),
            })),
          },
        },
        include: { items: true },
      });

      // Add stock + update cost price + record movement
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if ((product as any)?.trackStock) {
          const newQty = (product as any).currentStock + Number(item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newQty, costPrice: Number(item.rate) },
          });
          await tx.stockMovement.create({
            data: {
              orgId, productId: item.productId,
              date: String(date), type: "purchase",
              quantity: Number(item.quantity), balanceQty: newQty,
              referenceId: pur.id, notes: `Purchase ${resolvedNumber}`,
            },
          });
        }
      }

      // Ledger — Credit supplier (we owe them)
      await writeLedger(tx, {
        orgId, partyId: supplierId,
        partyName: (supplier as any).name,
        date: String(date),
        description: `Purchase ${resolvedNumber}`,
        debit: 0, credit: total,
        type: "purchase", referenceId: pur.id,
      });

      return pur;
    });

    res.status(201).json(okResponse(purchase, "Purchase created"));
  } catch (err: any) {
    console.error("createPurchase error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePurchase: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.purchase.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    const { status, dueDate, notes } = req.body;
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate }),
        ...(notes !== undefined && { notes }),
      },
      include: { items: true },
    });
    res.json(okResponse(purchase, "Purchase updated"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deletePurchase: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const purchase = await prisma.purchase.findFirst({ where: { id: req.params.id, orgId }, include: { items: true } });
    if (!purchase) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    if ((purchase as any).status === "cancelled") { res.status(400).json({ success: false, message: "Already cancelled" }); return; }

    await prisma.$transaction(async (tx: any) => {
      await tx.purchase.update({ where: { id: purchase.id }, data: { status: "cancelled" } });

      for (const item of (purchase as any).items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if ((product as any)?.trackStock) {
          const newQty = Math.max(0, (product as any).currentStock - Number(item.quantity));
          await tx.product.update({ where: { id: item.productId }, data: { currentStock: newQty } });
          await tx.stockMovement.create({
            data: {
              orgId, productId: item.productId,
              date: new Date().toISOString().split("T")[0],
              type: "return", quantity: -Number(item.quantity),
              balanceQty: newQty, referenceId: purchase.id,
              notes: `Cancellation — Purchase ${(purchase as any).purchaseNumber}`,
            },
          });
        }
      }

      await writeLedger(tx, {
        orgId, partyId: (purchase as any).supplierId,
        partyName: (purchase as any).supplierName,
        date: new Date().toISOString().split("T")[0],
        description: `Cancellation — Purchase ${(purchase as any).purchaseNumber}`,
        debit: (purchase as any).dueAmount, credit: 0,
        type: "purchase", referenceId: purchase.id,
      });
    });

    res.json({ success: true, message: "Purchase cancelled", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const recordPayment: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { amount, method, date, accountId, reference } = req.body;

    const purchase = await prisma.purchase.findFirst({ where: { id: req.params.id, orgId } });
    if (!purchase) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    if ((purchase as any).status === "cancelled") { res.status(400).json({ success: false, message: "Cannot pay a cancelled purchase" }); return; }

    const payAmt = Number(amount);
    if (payAmt <= 0 || payAmt > (purchase as any).dueAmount) {
      res.status(400).json({ success: false, message: `Amount must be between 0.01 and ${(purchase as any).dueAmount}` }); return;
    }

    const newPaid = (purchase as any).paidAmount + payAmt;
    const newDue = (purchase as any).total - newPaid;

    const updated = await prisma.$transaction(async (tx: any) => {
      const pur = await tx.purchase.update({
        where: { id: purchase.id },
        data: { paidAmount: newPaid, dueAmount: newDue, status: deriveStatus((purchase as any).total, newPaid) },
        include: { items: true },
      });

      if (accountId) await adjustAccount(tx, accountId, -payAmt);

      await writeLedger(tx, {
        orgId, partyId: (purchase as any).supplierId,
        partyName: (purchase as any).supplierName,
        date: date || new Date().toISOString().split("T")[0],
        description: `Payment made — Purchase ${(purchase as any).purchaseNumber}`,
        debit: payAmt, credit: 0,
        type: "payment", referenceId: purchase.id,
        notes: reference || undefined,
      });

      return pur;
    });

    res.json(okResponse(updated, "Payment recorded"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
