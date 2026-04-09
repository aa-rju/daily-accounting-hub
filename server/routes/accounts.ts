/**
 * server/routes/accounts.ts — org-scoped
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

export const getAccounts: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const where = { orgId: req.user.orgId };
    const [data, total] = await Promise.all([
      (prisma as any).account.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { name: "asc" } }),
      (prisma as any).account.count({ where }),
    ]);
    const totalBalance = data.reduce((s: number, a: any) => s + a.balance, 0);
    res.json({ success: true, message: "Accounts retrieved", data, total, page: Number(page), pageSize: Number(pageSize), totalBalance });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getAccount: RequestHandler = async (req: any, res) => {
  try {
    const account = await (prisma as any).account.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!account) { res.status(404).json({ success: false, message: "Account not found" }); return; }
    res.json({ success: true, message: "Account retrieved", data: account });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createAccount: RequestHandler = async (req: any, res) => {
  try {
    const { name, type, openingBalance = 0, currency = "NPR" } = req.body;
    if (!name || !type) { res.status(400).json({ success: false, message: "name and type required" }); return; }
    const account = await (prisma as any).account.create({
      data: { orgId: req.user.orgId, name, type, balance: Number(openingBalance), currency },
    });
    res.status(201).json({ success: true, message: "Account created", data: account });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateAccount: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).account.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Account not found" }); return; }
    const { name, type, balance, currency } = req.body;
    const account = await (prisma as any).account.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(balance !== undefined && { balance: Number(balance) }),
        ...(currency !== undefined && { currency }),
      },
    });
    res.json({ success: true, message: "Account updated", data: account });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteAccount: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).account.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Account not found" }); return; }
    await (prisma as any).account.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Account deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};