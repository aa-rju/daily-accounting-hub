/**
 * server/routes/inventory.ts — org-scoped
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

export const getInventory: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50, date, productId } = req.query;
    const where: any = { orgId: req.user.orgId };
    if (date) where.date = String(date);
    if (productId) where.productId = String(productId);

    const [data, total] = await Promise.all([
      (prisma as any).inventoryItem.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } }),
      (prisma as any).inventoryItem.count({ where }),
    ]);
    res.json({ success: true, message: "Inventory retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const item = await (prisma as any).inventoryItem.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!item) { res.status(404).json({ success: false, message: "Item not found" }); return; }
    res.json({ success: true, message: "Item retrieved", data: item });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const { productId, productName, openingStock = 0, production = 0, sales = 0, date } = req.body;
    if (!productId || !productName) { res.status(400).json({ success: false, message: "productId and productName required" }); return; }
    const closingStock = Number(openingStock) + Number(production) - Number(sales);
    const item = await (prisma as any).inventoryItem.create({
      data: { orgId: req.user.orgId, productId, productName, openingStock: Number(openingStock), production: Number(production), sales: Number(sales), closingStock, date: date || new Date().toISOString().split("T")[0] },
    });
    res.status(201).json({ success: true, message: "Item created", data: item });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).inventoryItem.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Item not found" }); return; }
    const os = req.body.openingStock !== undefined ? Number(req.body.openingStock) : existing.openingStock;
    const pr = req.body.production   !== undefined ? Number(req.body.production)   : existing.production;
    const sl = req.body.sales        !== undefined ? Number(req.body.sales)        : existing.sales;
    const item = await (prisma as any).inventoryItem.update({ where: { id: req.params.id }, data: { openingStock: os, production: pr, sales: sl, closingStock: os + pr - sl } });
    res.json({ success: true, message: "Item updated", data: item });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteInventoryItem: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).inventoryItem.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Item not found" }); return; }
    await (prisma as any).inventoryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Item deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};