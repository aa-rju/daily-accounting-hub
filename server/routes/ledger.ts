/**
 * server/routes/ledger.ts — org-scoped
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

export const getAllLedgers: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const where = { orgId: req.user.orgId };
    const [data, total] = await Promise.all([
      (prisma as any).ledgerEntry.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } }),
      (prisma as any).ledgerEntry.count({ where }),
    ]);
    res.json({ success: true, message: "Ledger retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPartyLedger: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;
    // Confirm party belongs to this org
    const party = await (prisma as any).party.findFirst({ where: { id: req.params.partyId, orgId } });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const { startDate, endDate } = req.query;
    const where: any = { orgId, partyId: req.params.partyId };
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };

    const entries = await (prisma as any).ledgerEntry.findMany({ where, orderBy: { date: "asc" } });
    const totalDebit  = entries.reduce((s: number, e: any) => s + e.debit, 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + e.credit, 0);

    res.json({ success: true, message: "Party ledger retrieved", data: {
      partyId: party.id, partyName: party.name,
      openingBalance: party.openingBalance,
      entries, totalDebit, totalCredit,
      closingBalance: party.openingBalance + totalDebit - totalCredit,
    }});
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createLedgerEntry: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;
    const { partyId, partyName, date, description, debit = 0, credit = 0, type = "manual" } = req.body;
    if (!partyId || !date || !description) {
      res.status(400).json({ success: false, message: "partyId, date, description required" }); return;
    }
    // Confirm party belongs to org
    const party = await (prisma as any).party.findFirst({ where: { id: partyId, orgId } });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const prev = await (prisma as any).ledgerEntry.findFirst({ where: { orgId, partyId }, orderBy: { createdAt: "desc" }, select: { balance: true } });
    const balance = (prev?.balance ?? 0) + Number(debit) - Number(credit);
    const entry = await (prisma as any).ledgerEntry.create({
      data: { orgId, partyId, partyName: party.name, date: String(date), description, debit: Number(debit), credit: Number(credit), balance, type },
    });
    res.status(201).json({ success: true, message: "Entry created", data: entry });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteLedgerEntry: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).ledgerEntry.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Entry not found" }); return; }
    await (prisma as any).ledgerEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Entry deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};