import { RequestHandler } from "express";
import { prisma } from "../db";

export const getInventory: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10, date, productId } = req.query;
  const where: any = {};
  if (date) where.date = String(date);
  if (productId) where.productId = String(productId);

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  res.json({ success: true, message: "Inventory retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getInventoryItem: RequestHandler = async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!item) { res.status(404).json({ success: false, message: "Item not found" }); return; }
  res.json({ success: true, message: "Item retrieved", data: item });
};

export const createInventoryItem: RequestHandler = async (req, res) => {
  const { productId, productName, openingStock, production, sales } = req.body;
  const closingStock = Number(openingStock) + Number(production) - Number(sales);
  const item = await prisma.inventoryItem.create({
    data: {
      productId, productName,
      openingStock: Number(openingStock),
      production: Number(production),
      sales: Number(sales),
      closingStock,
      date: new Date().toISOString().split("T")[0],
    },
  });
  res.status(201).json({ success: true, message: "Item created", data: item });
};

export const updateInventoryItem: RequestHandler = async (req, res) => {
  const { openingStock, production, sales } = req.body;
  const closingStock = Number(openingStock) + Number(production) - Number(sales);
  const item = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { openingStock: Number(openingStock), production: Number(production), sales: Number(sales), closingStock },
  });
  res.json({ success: true, message: "Item updated", data: item });
};

export const deleteInventoryItem: RequestHandler = async (req, res) => {
  await prisma.inventoryItem.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Item deleted", data: null });
};