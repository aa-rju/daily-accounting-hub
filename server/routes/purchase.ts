import { RequestHandler } from "express";
import { prisma } from "../db";

export const getPurchases: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10, status, supplierId } = req.query;
  const where: any = {};
  if (status) where.status = String(status);
  if (supplierId) where.supplierId = String(supplierId);

  const [data, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { items: true },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.count({ where }),
  ]);

  res.json({ success: true, message: "Purchases retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getPurchase: RequestHandler = async (req, res) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!purchase) { res.status(404).json({ success: false, message: "Purchase not found" }); return; }
  res.json({ success: true, message: "Purchase retrieved", data: purchase });
};

export const createPurchase: RequestHandler = async (req, res) => {
  const { purchaseNumber, supplierId, supplierName, date, items, paymentMethod, taxPercentage } = req.body;
  const subtotal = items.reduce((s: number, i: any) => s + i.amount, 0);
  const tax = subtotal * ((taxPercentage || 0) / 100);
  const total = subtotal + tax;

  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber, supplierId, supplierName, date, paymentMethod,
      subtotal, tax, total, status: "draft",
      items: { create: items },
    },
    include: { items: true },
  });
  res.status(201).json({ success: true, message: "Purchase created", data: purchase });
};

export const updatePurchase: RequestHandler = async (req, res) => {
  const { status } = req.body;
  const purchase = await prisma.purchase.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: true },
  });
  res.json({ success: true, message: "Purchase updated", data: purchase });
};

export const deletePurchase: RequestHandler = async (req, res) => {
  await prisma.purchase.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Purchase deleted", data: null });
};