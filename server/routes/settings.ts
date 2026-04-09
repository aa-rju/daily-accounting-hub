/**
 * server/routes/settings.ts
 *
 * Settings are stored in the Settings table in Supabase, one row per org.
 * Every field is tenant-scoped via orgId from the JWT.
 *
 * GET /api/settings   — returns this org's settings (creates defaults if first time)
 * PUT /api/settings   — updates this org's settings
 */

import { RequestHandler } from "express";
import { prisma } from "../db";

const DEFAULTS = {
  invoicePrefix:     "INV",
  purchasePrefix:    "PUR",
  defaultTaxRate:    13,       // Nepal VAT
  currency:          "NPR",
  currencySymbol:    "रू",
  lowStockThreshold: 10,
  enableStock:       true,
  enableLedger:      true,
  fiscalYearStart:   "07-16", // Shrawan 1 — Nepali fiscal year
};

const SYMBOL_MAP: Record<string, string> = {
  NPR: "रू", INR: "₹", USD: "$", EUR: "€", GBP: "£", BDT: "৳",
};

// ── GET /api/settings ─────────────────────────────────────────
export const getSettings: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;

    // Get or create settings for this org
    let settings = await (prisma as any).settings.findUnique({
      where: { orgId },
    });

    if (!settings) {
      // First time for this org — seed from org name
      const org = await (prisma as any).organisation.findUnique({
        where: { id: orgId },
        select: { name: true, plan: true },
      });

      settings = await (prisma as any).settings.create({
        data: {
          orgId,
          orgName: org?.name ?? "",
          ...DEFAULTS,
        },
      });
    }

    // Always attach org plan from Organisation table
    const org = await (prisma as any).organisation.findUnique({
      where: { id: orgId },
      select: { name: true, plan: true, status: true },
    });

    res.json({
      success: true,
      message: "Settings loaded",
      data: {
        ...settings,
        plan:    org?.plan   ?? "free",
        status:  org?.status ?? "active",
        orgName: settings.orgName || org?.name || "",
      },
    });
  } catch (err: any) {
    console.error("getSettings error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/settings ─────────────────────────────────────────
export const updateSettings: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;
    const {
      invoicePrefix, purchasePrefix, defaultTaxRate,
      currency, lowStockThreshold, enableStock,
      enableLedger, fiscalYearStart,
      // org profile fields
      orgName, orgPhone, orgEmail, orgAddress,
    } = req.body;

    const currencySymbol = currency ? (SYMBOL_MAP[currency] ?? currency) : undefined;

    // Upsert — safe whether settings row exists or not
    const settings = await (prisma as any).settings.upsert({
      where: { orgId },
      create: {
        orgId,
        ...DEFAULTS,
        ...(invoicePrefix     !== undefined && { invoicePrefix }),
        ...(purchasePrefix    !== undefined && { purchasePrefix }),
        ...(defaultTaxRate    !== undefined && { defaultTaxRate: Number(defaultTaxRate) }),
        ...(currency          !== undefined && { currency, currencySymbol: currencySymbol! }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(enableStock       !== undefined && { enableStock: Boolean(enableStock) }),
        ...(enableLedger      !== undefined && { enableLedger: Boolean(enableLedger) }),
        ...(fiscalYearStart   !== undefined && { fiscalYearStart }),
        ...(orgName           !== undefined && { orgName }),
        ...(orgPhone          !== undefined && { orgPhone }),
        ...(orgEmail          !== undefined && { orgEmail }),
        ...(orgAddress        !== undefined && { orgAddress }),
      },
      update: {
        ...(invoicePrefix     !== undefined && { invoicePrefix }),
        ...(purchasePrefix    !== undefined && { purchasePrefix }),
        ...(defaultTaxRate    !== undefined && { defaultTaxRate: Number(defaultTaxRate) }),
        ...(currency          !== undefined && { currency, currencySymbol: currencySymbol! }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(enableStock       !== undefined && { enableStock: Boolean(enableStock) }),
        ...(enableLedger      !== undefined && { enableLedger: Boolean(enableLedger) }),
        ...(fiscalYearStart   !== undefined && { fiscalYearStart }),
        ...(orgName           !== undefined && { orgName }),
        ...(orgPhone          !== undefined && { orgPhone }),
        ...(orgEmail          !== undefined && { orgEmail }),
        ...(orgAddress        !== undefined && { orgAddress }),
        updatedAt: new Date(),
      },
    });

    // Also update the Organisation name in its own table
    if (orgName) {
      await (prisma as any).organisation.update({
        where: { id: orgId },
        data: { name: orgName },
      });
    }

    res.json({
      success: true,
      message: "Settings saved",
      data: settings,
    });
  } catch (err: any) {
    console.error("updateSettings error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};