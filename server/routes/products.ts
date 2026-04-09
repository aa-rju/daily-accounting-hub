/**
 * server/routes/products.ts — org-scoped
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

export const getProducts: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50, category } = req.query;
    const where: any = { orgId: req.user.orgId };
    if (category) where.category = String(category);

    const [data, total] = await Promise.all([
      (prisma as any).product.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { name: "asc" } }),
      (prisma as any).product.count({ where }),
    ]);
    res.json({ success: true, message: "Products retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getProduct: RequestHandler = async (req: any, res) => {
  try {
    const product = await (prisma as any).product.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }
    res.json({ success: true, message: "Product retrieved", data: product });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createProduct: RequestHandler = async (req: any, res) => {
  try {
    const { name, category, unit, price, trackStock } = req.body;
    if (!name || !category || !unit || price === undefined) {
      res.status(400).json({ success: false, message: "name, category, unit, price required" }); return;
    }
    const product = await (prisma as any).product.create({
      data: { orgId: req.user.orgId, name, category, unit, price: Number(price), trackStock: Boolean(trackStock) },
    });
    res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateProduct: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).product.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Product not found" }); return; }
    const { name, category, unit, price, trackStock } = req.body;
    const product = await (prisma as any).product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(unit !== undefined && { unit }),
        ...(price !== undefined && { price: Number(price) }),
        ...(trackStock !== undefined && { trackStock: Boolean(trackStock) }),
      },
    });
    res.json({ success: true, message: "Product updated", data: product });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteProduct: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).product.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Product not found" }); return; }
    await (prisma as any).product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Product deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};