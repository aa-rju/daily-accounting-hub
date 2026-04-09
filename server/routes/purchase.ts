/**
 * server/routes/purchase.ts — org-scoped
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

async function nextPurchaseNumber(orgId: string): Promise<string> {
  const last = await (prisma as any).purchase.findFirst({
    where: { orgId }, orderBy: { createdAt: "desc" }, select: { purchaseNumber: true },
  });
  const num = last ? parseInt(last.purchaseNumber.replace(/\D/g, "") || "0", 10) + 1 : 1;
  return `PUR-${String(num).padStart(5, "0")}`;
}

export const getPurchases: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50, status, supplierId } = req.query;
    const where: any = { orgId: req.user.orgId };
    if (status && status !== "all") where.status = String(status);
    if (supplierId) where.supplierId = String(supplierId);

    const [data, total] = await Promise.all([
      (prisma as any).purchase.findMany({ where, include: { items: true }, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } }),
      (prisma as any).purchase.count({ where }),
    ]);
    res.json({ success: true, message: "Purchases retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPurchase: RequestHandler = async (req: any, res) => {
  try {
    const purchase = await (prisma as any).purchase.findFirst({ where: { id: req.params.id, orgId: req.user.orgId }, include: { items: true } });
    if (!purchase) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    res.json({ success: true, message: "Purchase retrieved", data: purchase });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createPurchase: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;
    const { purchaseNumber, supplierId, supplierName, date, items = [], paymentMethod = "cash", taxPercentage = 0, notes } = req.body;
    if (!supplierId || !date || !items.length) {
      res.status(400).json({ success: false, message: "supplierId, date, items required" }); return;
    }
    const supplier = await (prisma as any).party.findFirst({ where: { id: supplierId, orgId } });
    if (!supplier) { res.status(404).json({ success: false, message: "Supplier not found" }); return; }

    const subtotal = items.reduce((s: number, i: any) => s + Number(i.rate) * Number(i.quantity), 0);
    const tax = subtotal * (Number(taxPercentage) / 100);
    const total = subtotal + tax;
    const resolvedNumber = purchaseNumber || (await nextPurchaseNumber(orgId));

    const purchase = await (prisma as any).purchase.create({
      data: {
        orgId,
        purchaseNumber: resolvedNumber,
        supplierId, supplierName: supplier.name,
        date: String(date), subtotal, tax, total,
        paidAmount: 0, dueAmount: total,
        paymentMethod, status: "received",
        notes: notes || null,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId, productName: i.productName,
            quantity: Number(i.quantity), rate: Number(i.rate),
            amount: Number(i.rate) * Number(i.quantity),
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json({ success: true, message: "Purchase created", data: purchase });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updatePurchase: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).purchase.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    const { status, notes } = req.body;
    const purchase = await (prisma as any).purchase.update({
      where: { id: req.params.id },
      data: { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
      include: { items: true },
    });
    res.json({ success: true, message: "Purchase updated", data: purchase });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deletePurchase: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).purchase.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
    await (prisma as any).purchase.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Purchase deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};