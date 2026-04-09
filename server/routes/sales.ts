/**
 * server/routes/sales.ts — org-scoped
 * billNumber is unique per org, not globally.
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

async function nextBillNumber(orgId: string): Promise<string> {
  const settings = await (prisma as any).organisation.findUnique({ where: { id: orgId }, select: { name: true } });
  const last = await (prisma as any).invoice.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { billNumber: true },
  });
  const num = last ? parseInt(last.billNumber.replace(/\D/g, "") || "0", 10) + 1 : 1;
  return `INV-${String(num).padStart(5, "0")}`;
}

export const getInvoices: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50, status, partyId } = req.query;
    const where: any = { orgId: req.user.orgId };
    if (status && status !== "all") where.status = String(status);
    if (partyId) where.partyId = String(partyId);

    const [data, total] = await Promise.all([
      (prisma as any).invoice.findMany({ where, include: { items: true }, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } }),
      (prisma as any).invoice.count({ where }),
    ]);
    res.json({ success: true, message: "Invoices retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getInvoice: RequestHandler = async (req: any, res) => {
  try {
    const invoice = await (prisma as any).invoice.findFirst({ where: { id: req.params.id, orgId: req.user.orgId }, include: { items: true } });
    if (!invoice) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
    res.json({ success: true, message: "Invoice retrieved", data: invoice });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createInvoice: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;
    const { billNumber, partyId, partyName, date, items = [], paymentMethod = "cash", taxPercentage = 0, notes } = req.body;
    if (!partyId || !date || !items.length) {
      res.status(400).json({ success: false, message: "partyId, date, items required" }); return;
    }
    // Confirm party belongs to this org
    const party = await (prisma as any).party.findFirst({ where: { id: partyId, orgId } });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const subtotal = items.reduce((s: number, i: any) => s + Number(i.rate) * Number(i.quantity), 0);
    const tax = subtotal * (Number(taxPercentage) / 100);
    const total = subtotal + tax;
    const resolvedBillNumber = billNumber || (await nextBillNumber(orgId));

    const invoice = await (prisma as any).invoice.create({
      data: {
        orgId,
        billNumber: resolvedBillNumber,
        partyId, partyName: party.name,
        date: String(date),
        subtotal, tax, total,
        paidAmount: 0, dueAmount: total,
        paymentMethod, status: "sent",
        notes: notes || null,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: Number(i.quantity),
            rate: Number(i.rate),
            amount: Number(i.rate) * Number(i.quantity),
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json({ success: true, message: "Invoice created", data: invoice });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateInvoice: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).invoice.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
    const { status, notes } = req.body;
    const invoice = await (prisma as any).invoice.update({
      where: { id: req.params.id },
      data: { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
      include: { items: true },
    });
    res.json({ success: true, message: "Invoice updated", data: invoice });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteInvoice: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).invoice.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
    await (prisma as any).invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Invoice deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};