import { RequestHandler } from "express";
import { prisma } from "../db";

export const getInvoices: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10, status, partyId } = req.query;
  const where: any = {};
  if (status) where.status = String(status);
  if (partyId) where.partyId = String(partyId);

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { items: true },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({ success: true, message: "Invoices retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getInvoice: RequestHandler = async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!invoice) { res.status(404).json({ success: false, message: "Invoice not found" }); return; }
  res.json({ success: true, message: "Invoice retrieved", data: invoice });
};

export const createInvoice: RequestHandler = async (req, res) => {
  const { billNumber, partyId, partyName, date, items, paymentMethod, taxPercentage } = req.body;
  const subtotal = items.reduce((s: number, i: any) => s + i.amount, 0);
  const tax = subtotal * ((taxPercentage || 0) / 100);
  const total = subtotal + tax;

  const invoice = await prisma.invoice.create({
    data: {
      billNumber, partyId, partyName, date, paymentMethod,
      subtotal, tax, total, status: "draft",
      items: { create: items },
    },
    include: { items: true },
  });
  res.status(201).json({ success: true, message: "Invoice created", data: invoice });
};

export const updateInvoice: RequestHandler = async (req, res) => {
  const { status } = req.body;
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: true },
  });
  res.json({ success: true, message: "Invoice updated", data: invoice });
};

export const deleteInvoice: RequestHandler = async (req, res) => {
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Invoice deleted", data: null });
};