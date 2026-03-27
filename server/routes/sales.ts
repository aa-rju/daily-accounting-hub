/**
 * server/routes/sales.ts
 * Full invoice lifecycle:
 *   create  → deducts stock + writes ledger debit (customer owes us)
 *   payment → credits ledger + updates account balance
 *   cancel  → reverses stock + reverses ledger
 *
 * Auto-generates billNumber from Settings.invoicePrefix if not provided.
 */

import { RequestHandler } from "express";
import {
  prisma, getOrgId, listResponse, okResponse,
  nextBillNumber, writeLedger, adjustAccount, deriveStatus,
} from "../db";

// ── GET /api/sales ────────────────────────────────────────────
export const getInvoices: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50, status, partyId, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { orgId };
    if (status && status !== "all") where.status = String(status);
    if (partyId) where.partyId = String(partyId);
    if (search) where.billNumber = { contains: String(search), mode: "insensitive" };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip, take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sales/:id ────────────────────────────────────────
export const getInvoice: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, orgId },
      include: { items: true },
    });
    if (!invoice) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
    res.json(okResponse(invoice));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/sales ───────────────────────────────────────────
export const createInvoice: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const {
      billNumber, partyId, date, dueDate,
      items = [], paymentMethod = "cash",
      discountAmt = 0, taxPercentage = 0, notes,
    } = req.body;

    if (!partyId || !date || !items.length) {
      res.status(400).json({ success: false, message: "partyId, date, items are required" });
      return;
    }

    // Fetch party
    const party = await prisma.party.findFirst({ where: { id: partyId, orgId } });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    // Fetch settings for prefix
    const settings = await prisma.settings.findUnique({ where: { orgId } });

    // Validate stock for tracked products
    for (const item of items) {
      const product = await prisma.product.findFirst({ where: { id: item.productId, orgId } });
      if (!product) {
        res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
        return;
      }
      if ((product as any).trackStock && (product as any).currentStock < Number(item.quantity)) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${(product as any).name}. Available: ${(product as any).currentStock}`,
        });
        return;
      }
    }

    // Compute financials
    const subtotal = items.reduce((s: number, i: any) =>
      s + Number(i.rate) * Number(i.quantity) - Number(i.discount || 0), 0);
    const taxAmt = (subtotal - Number(discountAmt)) * (Number(taxPercentage) / 100);
    const total = subtotal - Number(discountAmt) + taxAmt;

    const resolvedBillNumber = billNumber ||
      (await nextBillNumber(orgId, settings?.invoicePrefix || "INV"));

    const invoice = await prisma.$transaction(async (tx: any) => {
      // 1. Create invoice + items
      const inv = await tx.invoice.create({
        data: {
          orgId, billNumber: resolvedBillNumber,
          partyId, partyName: (party as any).name,
          date: String(date),
          dueDate: dueDate ? String(dueDate) : null,
          subtotal, discountAmt: Number(discountAmt),
          tax: taxAmt, taxAmt, total,
          paidAmount: 0, dueAmount: total,
          paymentMethod, status: "sent", notes: notes || null,
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              productName: i.productName,
              quantity: Number(i.quantity),
              rate: Number(i.rate),
              costPrice: Number(i.costPrice || 0),
              discount: Number(i.discount || 0),
              taxRate: Number(i.taxRate || 0),
              amount: Number(i.rate) * Number(i.quantity) - Number(i.discount || 0),
            })),
          },
        },
        include: { items: true },
      });

      // 2. Deduct stock + record movement for tracked products
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if ((product as any)?.trackStock) {
          const newQty = (product as any).currentStock - Number(item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newQty },
          });
          await tx.stockMovement.create({
            data: {
              orgId, productId: item.productId,
              date: String(date), type: "sale",
              quantity: -Number(item.quantity),
              balanceQty: newQty,
              referenceId: inv.id,
              notes: `Invoice ${resolvedBillNumber}`,
            },
          });
        }
      }

      // 3. Double-entry ledger — Debit party (customer owes us the total)
      await writeLedger(tx, {
        orgId, partyId,
        partyName: (party as any).name,
        date: String(date),
        description: `Invoice ${resolvedBillNumber}`,
        debit: total, credit: 0,
        type: "invoice", referenceId: inv.id,
        notes: notes || undefined,
      });

      return inv;
    });

    res.status(201).json(okResponse(invoice, "Invoice created"));
  } catch (err: any) {
    console.error("createInvoice error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/sales/:id ────────────────────────────────────────
export const updateInvoice: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }

    const { status, dueDate, notes } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate }),
        ...(notes !== undefined && { notes }),
      },
      include: { items: true },
    });

    res.json(okResponse(invoice, "Invoice updated"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/sales/:id ─────────────────────────────────────
// Cancels invoice — reverses stock, reverses ledger
export const deleteInvoice: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, orgId },
      include: { items: true },
    });
    if (!invoice) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
    if ((invoice as any).status === "cancelled") {
      res.status(400).json({ success: false, message: "Invoice already cancelled" });
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      // 1. Cancel invoice
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "cancelled" },
      });

      // 2. Reverse stock
      for (const item of (invoice as any).items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if ((product as any)?.trackStock) {
          const newQty = (product as any).currentStock + Number(item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newQty },
          });
          await tx.stockMovement.create({
            data: {
              orgId, productId: item.productId,
              date: new Date().toISOString().split("T")[0],
              type: "return", quantity: Number(item.quantity),
              balanceQty: newQty,
              referenceId: invoice.id,
              notes: `Cancellation of Invoice ${(invoice as any).billNumber}`,
            },
          });
        }
      }

      // 3. Reverse ledger — credit to cancel the earlier debit
      await writeLedger(tx, {
        orgId, partyId: (invoice as any).partyId,
        partyName: (invoice as any).partyName,
        date: new Date().toISOString().split("T")[0],
        description: `Cancellation — Invoice ${(invoice as any).billNumber}`,
        debit: 0, credit: (invoice as any).dueAmount,
        type: "invoice", referenceId: invoice.id,
      });
    });

    res.json({ success: true, message: "Invoice cancelled", data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/sales/:id/payment ───────────────────────────────
export const recordPayment: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { amount, method, date, accountId, reference } = req.body;

    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, orgId } });
    if (!invoice) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
    if ((invoice as any).status === "cancelled") {
      res.status(400).json({ success: false, message: "Cannot pay a cancelled invoice" });
      return;
    }

    const payAmt = Number(amount);
    if (payAmt <= 0 || payAmt > (invoice as any).dueAmount) {
      res.status(400).json({
        success: false,
        message: `Amount must be between 0.01 and ${(invoice as any).dueAmount}`,
      });
      return;
    }

    const newPaid = (invoice as any).paidAmount + payAmt;
    const newDue = (invoice as any).total - newPaid;

    const updated = await prisma.$transaction(async (tx: any) => {
      // 1. Update invoice amounts
      const inv = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: deriveStatus((invoice as any).total, newPaid),
        },
        include: { items: true },
      });

      // 2. Credit account balance
      if (accountId) await adjustAccount(tx, accountId, payAmt);

      // 3. Ledger — Credit party (customer paid, their debt reduces)
      await writeLedger(tx, {
        orgId, partyId: (invoice as any).partyId,
        partyName: (invoice as any).partyName,
        date: date || new Date().toISOString().split("T")[0],
        description: `Payment received — Invoice ${(invoice as any).billNumber}`,
        debit: 0, credit: payAmt,
        type: "payment", referenceId: invoice.id,
        notes: reference || undefined,
      });

      return inv;
    });

    res.json(okResponse(updated, "Payment recorded"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};