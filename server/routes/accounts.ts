import { RequestHandler } from "express";
import { prisma } from "../db";

export const getAccounts: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  const [data, total] = await Promise.all([
    prisma.account.findMany({
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.count(),
  ]);

  res.json({ success: true, message: "Accounts retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getAccount: RequestHandler = async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!account) { res.status(404).json({ success: false, message: "Account not found" }); return; }
  res.json({ success: true, message: "Account retrieved", data: account });
};

export const createAccount: RequestHandler = async (req, res) => {
  const { name, type, openingBalance, currency } = req.body;
  const account = await prisma.account.create({
    data: { name, type, balance: Number(openingBalance) || 0, currency: currency || "USD" },
  });
  res.status(201).json({ success: true, message: "Account created", data: account });
};

export const updateAccount: RequestHandler = async (req, res) => {
  const { name, type, balance, currency } = req.body;
  const account = await prisma.account.update({
    where: { id: req.params.id },
    data: { name, type, balance: Number(balance), currency },
  });
  res.json({ success: true, message: "Account updated", data: account });
};

export const deleteAccount: RequestHandler = async (req, res) => {
  await prisma.account.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Account deleted", data: null });
};