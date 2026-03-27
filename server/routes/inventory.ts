/**
 * server/routes/inventory.ts
 * Daily production/sales inventory log (InventoryItem model).
 * Separate from StockMovement — this is the daily count sheet.
 */
import { RequestHandler } from "express";
import { prisma, getOrgId, listResponse, okResponse } from "../db";

export const getInventory: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50, date, productId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { orgId };
    if (date) where.date = String(date);
    if (productId) where.productId = String(productId);
    const [data, total] = await Promise.all([
      prisma.inventoryItem.findMany({ where, skip, take: Number(pageSize), orderBy: { createdAt: "desc" } }),
      prisma.inventoryItem.count({ where }),
    ]);
    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const item = await prisma.inventoryItem.findFirst({ where: { id: req.params.id, orgId } });
    if (!item) { res.status(404).json({ success: false, message: "Item not found" }); return; }
    res.json(okResponse(item));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { productId, productName, openingStock = 0, production = 0, sales = 0, date } = req.body;
    if (!productId || !productName) { res.status(400).json({ success: false, message: "productId and productName required" }); return; }
    const closingStock = Number(openingStock) + Number(production) - Number(sales);
    const item = await prisma.inventoryItem.create({
      data: {
        orgId, productId, productName,
        openingStock: Number(openingStock),
        production: Number(production),
        sales: Number(sales),
        closingStock,
        date: date || new Date().toISOString().split("T")[0],
      },
    });
    res.status(201).json(okResponse(item, "Inventory item created"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.inventoryItem.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Item not found" }); return; }
    const { openingStock, production, sales } = req.body;
    const os = openingStock !== undefined ? Number(openingStock) : (existing as any).openingStock;
    const pr = production  !== undefined ? Number(production)  : (existing as any).production;
    const sl = sales       !== undefined ? Number(sales)       : (existing as any).sales;
    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: { openingStock: os, production: pr, sales: sl, closingStock: os + pr - sl },
    });
    res.json(okResponse(item, "Inventory item updated"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.inventoryItem.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Item not found" }); return; }
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Item deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};