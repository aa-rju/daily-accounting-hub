import { RequestHandler } from "express";
import { prisma } from "../db";

export const getAllLedgers: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const [data, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
    }),
    prisma.ledgerEntry.count(),
  ]);
  res.json({ success: true, message: "Ledger retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getPartyLedger: RequestHandler = async (req, res) => {
  const { startDate, endDate } = req.query;
  const where: any = { partyId: req.params.partyId };
  if (startDate) where.date = { gte: String(startDate) };
  if (endDate) where.date = { ...where.date, lte: String(endDate) };

  const entries = await prisma.ledgerEntry.findMany({ where, orderBy: { date: "asc" } });
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  res.json({
    success: true, message: "Party ledger retrieved",
    data: {
      partyId: req.params.partyId,
      entries,
      totalDebit,
      totalCredit,
      closingBalance: totalDebit - totalCredit,
    },
  });
};

export const createLedgerEntry: RequestHandler = async (req, res) => {
  const { partyId, partyName, date, description, debit, credit, type } = req.body;
  const entry = await prisma.ledgerEntry.create({
    data: {
      partyId, partyName, date, description, type,
      debit: Number(debit) || 0,
      credit: Number(credit) || 0,
      balance: Number(debit) - Number(credit),
    },
  });
  res.status(201).json({ success: true, message: "Entry created", data: entry });
};

export const deleteLedgerEntry: RequestHandler = async (req, res) => {
  await prisma.ledgerEntry.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Entry deleted", data: null });
};