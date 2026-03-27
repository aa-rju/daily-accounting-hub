/**
 * server/routes/parties.ts
 * Full CRUD + ledger statement for customers & suppliers.
 * Every party has a live currentBalance maintained by writeLedger().
 */

import { RequestHandler } from "express";
import { prisma, getOrgId, listResponse, okResponse, writeLedger } from "../db";

// ── GET /api/parties ──────────────────────────────────────────
export const getParties: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 50, type, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = { orgId };
    if (type && type !== "all") where.type = String(type);
    if (status) where.status = String(status);
    if (search) where.name = { contains: String(search), mode: "insensitive" };

    const [data, total] = await Promise.all([
      prisma.party.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      prisma.party.count({ where }),
    ]);

    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/parties/:id ──────────────────────────────────────
export const getParty: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const party = await prisma.party.findFirst({
      where: { id: req.params.id, orgId },
    });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }
    res.json(okResponse(party));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/parties ─────────────────────────────────────────
export const createParty: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, phone, email, address, type, openingBalance = 0, creditLimit, notes } = req.body;

    if (!name || !type) {
      res.status(400).json({ success: false, message: "name and type are required" });
      return;
    }

    const party = await prisma.$transaction(async (tx: any) => {
      const p = await tx.party.create({
        data: {
          orgId, name,
          phone: phone || "",
          email: email || null,
          address: address || "",
          type,
          openingBalance: Number(openingBalance),
          currentBalance: Number(openingBalance), // seed live balance
          creditLimit: creditLimit ? Number(creditLimit) : null,
          notes: notes || null,
        },
      });

      // Seed ledger for opening balance (so statement starts correctly)
      if (Number(openingBalance) !== 0) {
        await writeLedger(tx, {
          orgId,
          partyId: p.id,
          partyName: p.name,
          date: new Date().toISOString().split("T")[0],
          description: "Opening Balance",
          debit: Number(openingBalance) > 0 ? Number(openingBalance) : 0,
          credit: Number(openingBalance) < 0 ? Math.abs(Number(openingBalance)) : 0,
          type: "manual",
          referenceId: p.id,
        });
      }
      return p;
    });

    res.status(201).json(okResponse(party, "Party created"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/parties/:id ──────────────────────────────────────
export const updateParty: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.party.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const { name, phone, email, address, type, openingBalance, creditLimit, notes, status } = req.body;

    const party = await prisma.party.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(type !== undefined && { type }),
        ...(openingBalance !== undefined && { openingBalance: Number(openingBalance) }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(okResponse(party, "Party updated"));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/parties/:id ───────────────────────────────────
// Soft delete — marks inactive, preserves history
export const deleteParty: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const existing = await prisma.party.findFirst({ where: { id: req.params.id, orgId } });
    if (!existing) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    await prisma.party.update({
      where: { id: req.params.id },
      data: { status: "inactive" },
    });

    res.json({ success: true, message: "Party deactivated", data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/parties/:id/ledger?startDate&endDate ─────────────
export const getPartyLedger: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const party = await prisma.party.findFirst({ where: { id: req.params.id, orgId } });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const { startDate, endDate } = req.query;
    const where: any = { orgId, partyId: req.params.id };
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { date: "asc" },
    });

    const totalDebit = entries.reduce((s: number, e: any) => s + e.debit, 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + e.credit, 0);
    const closingBalance = party.openingBalance + totalDebit - totalCredit;

    res.json(okResponse({
      partyId: party.id,
      partyName: party.name,
      openingBalance: party.openingBalance,
      entries,
      totalDebit,
      totalCredit,
      closingBalance,
    }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};