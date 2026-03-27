/**
 * server/routes/products.ts
 * CRUD + stock adjustment + movement history + low-stock alerts.
 */

import { RequestHandler } from "express";
import { prisma, getOrgId, listResponse, okResponse } from "../db";

// ── GET /api/products ─────────────────────────────────────────
export const getProducts: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50, category, status, lowStock, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = { orgId };
    if (category) where.category = String(category);
    if (status) where.status = String(status);
    if (search) where.name = { contains: String(search), mode: "insensitive" };

    let products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
    });

    // Filter low-stock products if requested
    if (lowStock === "true") {
      products = products.filter((p: any) => p.trackStock && p.currentStock <= p.lowStockQty);
    }

    const total = await prisma.product.count({ where });
    res.json(listResponse(products, total, Number(page), Number(pageSize)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/products/:id ─────────────────────────────────────
export const getProduct: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const product = await prisma.product.findFirst({ where: { id: req.params.id, orgId } });
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }
    res.json(okResponse(product));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/products ────────────────────────────────────────
export const createProduct: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const {
      name, sku, category, unit,
      price, salePrice, costPrice = 0,
      trackStock = false, currentStock = 0,
      lowStockQty = 0, taxRate = 0, notes,
    } = req.body;

    if (!name || !category || !unit) {
      res.status(400).json({ success: false, message: "name, category, unit are required" });
      return;
    }

    const resolvedSalePrice = Number(salePrice || price || 0);

    const product = await prisma.$transaction(async (tx: any) => {
      const p = await tx.product.create({
        data: {
          orgId, name,
          sku: sku || null,
          category, unit,
          price: resolvedSalePrice,
          salePrice: resolvedSalePrice,
          costPrice: Number(costPrice),
          trackStock: Boolean(trackStock),
          currentStock: Number(currentStock),
          lowStockQty: Number(lowStockQty),
          taxRate: Number(taxRate),
          notes: notes || null,
        },
      });

      // Seed opening stock movement
      if (Boolean(trackStock) && Number(currentStock) > 0) {
        await tx.stockMovement.create({
          data: {
            orgId,
            productId: p.id,
            date: new Date().toISOString().split("T")[0],
            type: "adjustment",
            quantity: Number(currentStock),
            balanceQty: Number(currentStock),
            notes: "Opening stock",
          },
        });
      }

      return p;
    });

    res.status(201).json(okResponse(product, "Product created"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/products/:id ─────────────────────────────────────
export const updateProduct: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    const {
      name, sku, category, unit,
      price, salePrice, costPrice,
      trackStock, currentStock,
      lowStockQty, taxRate, notes, status,
    } = req.body;

    const resolvedSalePrice = salePrice !== undefined ? Number(salePrice)
      : price !== undefined ? Number(price) : undefined;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(category !== undefined && { category }),
        ...(unit !== undefined && { unit }),
        ...(resolvedSalePrice !== undefined && { price: resolvedSalePrice, salePrice: resolvedSalePrice }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(trackStock !== undefined && { trackStock: Boolean(trackStock) }),
        ...(currentStock !== undefined && { currentStock: Number(currentStock) }),
        ...(lowStockQty !== undefined && { lowStockQty: Number(lowStockQty) }),
        ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(okResponse(product, "Product updated"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/products/:id ──────────────────────────────────
export const deleteProduct: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { status: "inactive" },
    });

    res.json({ success: true, message: "Product deactivated", data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/products/:id/adjust-stock ───────────────────────
export const adjustStock: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { quantity, notes, date } = req.body;

    if (quantity === undefined) {
      res.status(400).json({ success: false, message: "quantity required (positive=add, negative=remove)" });
      return;
    }

    const product = await prisma.product.findFirst({ where: { id: req.params.id, orgId } });
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    const newStock = (product as any).currentStock + Number(quantity);
    if (newStock < 0) {
      res.status(400).json({ success: false, message: `Cannot remove more than current stock (${(product as any).currentStock})` });
      return;
    }

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          orgId, productId: product.id,
          date: date || new Date().toISOString().split("T")[0],
          type: "adjustment",
          quantity: Number(quantity),
          balanceQty: newStock,
          notes: notes || "Manual adjustment",
        },
      }),
      prisma.product.update({
        where: { id: product.id },
        data: { currentStock: newStock },
      }),
    ]);

    res.json(okResponse({ movement, newStock }, "Stock adjusted"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/products/:id/stock-movements ─────────────────────
export const getStockMovements: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where = { orgId, productId: req.params.id };
    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where, skip, take: Number(pageSize),
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/products/low-stock ───────────────────────────────
export const getLowStockProducts: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const products = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Product"
      WHERE "orgId" = ${orgId}
        AND "trackStock" = true
        AND "status" = 'active'
        AND "currentStock" <= "lowStockQty"
      ORDER BY "currentStock" ASC
      LIMIT 50
    `;
    res.json(okResponse(products));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};