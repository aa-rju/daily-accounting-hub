import { RequestHandler } from "express";
import { prisma, getOrgId, listResponse, okResponse } from "../db";

export const getAccounts: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const [data, total] = await Promise.all([
      prisma.account.findMany({ where: { orgId }, skip, take: Number(pageSize), orderBy: { name: "asc" } }),
      prisma.account.count({ where: { orgId } }),
    ]);
    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getAccount: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const account = await prisma.account.findFirst({ where: { id: req.params.id, orgId } });
    if (!account) { res.status(404).json({ success: false, message: "Account not found" }); return; }
    res.json(okResponse(account));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createAccount: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, type, openingBalance = 0, accountNumber, bankName, currency = "BDT", notes } = req.body;
    if (!name || !type) { res.status(400).json({ success: false, message: "name and type required" }); return; }
    const account = await prisma.account.create({
      data: {
        orgId, name, type,
        openingBalance: Number(openingBalance),
        balance: Number(openingBalance),
        accountNumber: accountNumber || null,
        bankName: bankName || null,
        currency, notes: notes || null,
      },
    });
    res.status(201).json(okResponse(account, "Account created"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateAccount: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.account.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Account not found" }); return; }
    const { name, type, balance, openingBalance, accountNumber, bankName, currency, notes, status } = req.body;
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(balance !== undefined && { balance: Number(balance) }),
        ...(openingBalance !== undefined && { openingBalance: Number(openingBalance) }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(bankName !== undefined && { bankName }),
        ...(currency !== undefined && { currency }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });
    res.json(okResponse(account, "Account updated"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteAccount: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.account.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Account not found" }); return; }
    await prisma.account.update({ where: { id: req.params.id }, data: { status: "inactive" } });
    res.json({ success: true, message: "Account deactivated", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
