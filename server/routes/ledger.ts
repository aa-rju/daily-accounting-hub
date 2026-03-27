/**
 * server/routes/ledger.ts
 * Ledger entries — auto-written by sales/purchase/payment flows.
 * Manual entries also supported.
 */
import { RequestHandler } from "express";
import { prisma, getOrgId, listResponse, okResponse } from "../db";

export const getAllLedgers: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50, type, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { orgId };
    if (type) where.type = String(type);
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };
    const [data, total] = await Promise.all([
      prisma.ledgerEntry.findMany({ where, skip, take: Number(pageSize), orderBy: { date: "desc" } }),
      prisma.ledgerEntry.count({ where }),
    ]);
    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPartyLedger: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const party = await prisma.party.findFirst({ where: { id: req.params.partyId, orgId } });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const { startDate, endDate } = req.query;
    const where: any = { orgId, partyId: req.params.partyId };
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };

    const entries = await prisma.ledgerEntry.findMany({ where, orderBy: { date: "asc" } });
    const totalDebit  = entries.reduce((s: number, e: any) => s + e.debit, 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + e.credit, 0);

    res.json(okResponse({
      partyId: (party as any).id,
      partyName: (party as any).name,
      openingBalance: (party as any).openingBalance,
      entries,
      totalDebit,
      totalCredit,
      closingBalance: (party as any).openingBalance + totalDebit - totalCredit,
    }));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createLedgerEntry: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { partyId, partyName, date, description, debit = 0, credit = 0, type = "manual", notes } = req.body;
    if (!partyId || !date || !description) {
      res.status(400).json({ success: false, message: "partyId, date, description required" }); return;
    }

    // Get running balance
    const last = await prisma.ledgerEntry.findFirst({
      where: { orgId, partyId }, orderBy: { createdAt: "desc" }, select: { balance: true },
    });
    const balance = (last?.balance ?? 0) + Number(debit) - Number(credit);

    await prisma.party.update({ where: { id: partyId }, data: { currentBalance: balance } });

    const entry = await prisma.ledgerEntry.create({
      data: { orgId, partyId, partyName, date: String(date), description, debit: Number(debit), credit: Number(credit), balance, type, notes: notes || null },
    });
    res.status(201).json(okResponse(entry, "Entry created"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteLedgerEntry: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.ledgerEntry.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Entry not found" }); return; }
    await prisma.ledgerEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Entry deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};