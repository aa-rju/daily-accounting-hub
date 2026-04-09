/**
 * server/routes/parties.ts
 * Every query scoped to req.user.orgId.
 * Cross-org access returns 404 (not 403) to not leak existence.
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

export const getParties: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 50, type } = req.query;
    const orgId = req.user.orgId;
    const where: any = { orgId };
    if (type && type !== "all") where.type = String(type);

    const [data, total] = await Promise.all([
      (prisma as any).party.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { name: "asc" },
      }),
      (prisma as any).party.count({ where }),
    ]);

    res.json({ success: true, message: "Parties retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getParty: RequestHandler = async (req: any, res) => {
  try {
    // findFirst with orgId check prevents cross-org access
    const party = await (prisma as any).party.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }
    res.json({ success: true, message: "Party retrieved", data: party });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createParty: RequestHandler = async (req: any, res) => {
  try {
    const { name, phone, address, type, openingBalance } = req.body;
    if (!name || !type) { res.status(400).json({ success: false, message: "name and type required" }); return; }

    const party = await (prisma as any).party.create({
      data: {
        orgId: req.user.orgId, // ← always set orgId from token
        name,
        phone: phone || "",
        address: address || "",
        type,
        openingBalance: Number(openingBalance) || 0,
      },
    });
    res.status(201).json({ success: true, message: "Party created", data: party });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateParty: RequestHandler = async (req: any, res) => {
  try {
    // Verify ownership before updating
    const existing = await (prisma as any).party.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!existing) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const { name, phone, address, type, openingBalance } = req.body;
    const party = await (prisma as any).party.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(type !== undefined && { type }),
        ...(openingBalance !== undefined && { openingBalance: Number(openingBalance) }),
      },
    });
    res.json({ success: true, message: "Party updated", data: party });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteParty: RequestHandler = async (req: any, res) => {
  try {
    const existing = await (prisma as any).party.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!existing) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    await (prisma as any).party.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Party deleted", data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPartyLedger: RequestHandler = async (req: any, res) => {
  try {
    const party = await (prisma as any).party.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!party) { res.status(404).json({ success: false, message: "Party not found" }); return; }

    const { startDate, endDate } = req.query;
    const where: any = { orgId: req.user.orgId, partyId: req.params.id };
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };

    const entries = await (prisma as any).ledgerEntry.findMany({ where, orderBy: { date: "asc" } });
    const totalDebit  = entries.reduce((s: number, e: any) => s + e.debit, 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + e.credit, 0);

    res.json({ success: true, message: "Ledger retrieved", data: {
      partyId: party.id, partyName: party.name,
      openingBalance: party.openingBalance,
      entries, totalDebit, totalCredit,
      closingBalance: party.openingBalance + totalDebit - totalCredit,
    }});
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};