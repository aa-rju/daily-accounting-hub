import { RequestHandler } from "express";
import { prisma } from "../db";

export const getParties: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10, type } = req.query;
  const where = type && type !== "all" ? { type: String(type) } : {};

  const [data, total] = await Promise.all([
    prisma.party.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.party.count({ where }),
  ]);

  res.json({ success: true, message: "Parties retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getParty: RequestHandler = async (req, res) => {
  const party = await prisma.party.findUnique({ where: { id: req.params.id } });
  if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }
  res.json({ success: true, message: "Party retrieved", data: party });
};

export const createParty: RequestHandler = async (req, res) => {
  const { name, phone, address, type, openingBalance } = req.body;
  const party = await prisma.party.create({
    data: { name, phone, address, type, openingBalance: Number(openingBalance) || 0 },
  });
  res.status(201).json({ success: true, message: "Party created", data: party });
};

export const updateParty: RequestHandler = async (req, res) => {
  const { name, phone, address, type, openingBalance } = req.body;
  const party = await prisma.party.update({
    where: { id: req.params.id },
    data: { name, phone, address, type, openingBalance: Number(openingBalance) || 0 },
  });
  res.json({ success: true, message: "Party updated", data: party });
};

export const deleteParty: RequestHandler = async (req, res) => {
  await prisma.party.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Party deleted", data: null });
};