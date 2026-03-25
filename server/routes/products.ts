import { RequestHandler } from "express";
import { prisma } from "../db";

export const getProducts: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10, category } = req.query;
  const where = category ? { category: String(category) } : {};

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, message: "Products retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getProduct: RequestHandler = async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }
  res.json({ success: true, message: "Product retrieved", data: product });
};

export const createProduct: RequestHandler = async (req, res) => {
  const { name, category, unit, price, trackStock } = req.body;
  const product = await prisma.product.create({
    data: { name, category, unit, price: Number(price), trackStock: Boolean(trackStock) },
  });
  res.status(201).json({ success: true, message: "Product created", data: product });
};

export const updateProduct: RequestHandler = async (req, res) => {
  const { name, category, unit, price, trackStock } = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { name, category, unit, price: Number(price), trackStock: Boolean(trackStock) },
  });
  res.json({ success: true, message: "Product updated", data: product });
};

export const deleteProduct: RequestHandler = async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Product deleted", data: null });
};