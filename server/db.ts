/**
 * server/db.ts
 * Single Prisma client instance shared across the entire server.
 * Uses @prisma/adapter-pg for Supabase/Postgres connection pooling.
 */

import "dotenv/config";
import { createRequire } from "module";
import { PrismaPg } from "@prisma/adapter-pg";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
//  HELPERS used across all route files
// ─────────────────────────────────────────────

/** Extract orgId from the JWT payload on req.user */
export function getOrgId(req: any): string {
  return req.user?.orgId ?? "default";
}

/** Standard list response */
export function listResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return { success: true, message: "Success", data, total, page, pageSize };
}

/** Standard single-item response */
export function okResponse<T>(data: T, message = "Success") {
  return { success: true, message, data };
}

/** Derive invoice/purchase payment status */
export function deriveStatus(total: number, paid: number): string {
  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
}

/** Auto-generate next sequential bill number */
export async function nextBillNumber(
  orgId: string,
  prefix: string
): Promise<string> {
  const latest = await prisma.invoice.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { billNumber: true },
  });
  const num = latest
    ? parseInt(latest.billNumber.replace(/\D/g, "") || "0", 10) + 1
    : 1;
  return `${prefix}${String(num).padStart(5, "0")}`;
}

/** Auto-generate next sequential purchase number */
export async function nextPurchaseNumber(
  orgId: string,
  prefix: string
): Promise<string> {
  const latest = await prisma.purchase.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { purchaseNumber: true },
  });
  const num = latest
    ? parseInt(latest.purchaseNumber.replace(/\D/g, "") || "0", 10) + 1
    : 1;
  return `${prefix}${String(num).padStart(5, "0")}`;
}

/**
 * Write a LedgerEntry and update Party.currentBalance atomically.
 *
 * Convention (from the party's perspective):
 *   debit  = we are owed more (customer invoice, supplier payment made)
 *   credit = we owe less (customer payment received, supplier invoice)
 */
export async function writeLedger(
  tx: any,
  data: {
    orgId: string;
    partyId: string;
    partyName: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    type: string;
    referenceId?: string;
    notes?: string;
  }
) {
  // Get last running balance for this party
  const last = await tx.ledgerEntry.findFirst({
    where: { orgId: data.orgId, partyId: data.partyId },
    orderBy: { createdAt: "desc" },
    select: { balance: true },
  });

  const balance = (last?.balance ?? 0) + data.debit - data.credit;

  // Keep Party.currentBalance live
  await tx.party.update({
    where: { id: data.partyId },
    data: { currentBalance: balance },
  });

  return tx.ledgerEntry.create({ data: { ...data, balance } });
}

/** Adjust an account's running balance */
export async function adjustAccount(
  tx: any,
  accountId: string,
  delta: number
) {
  return tx.account.update({
    where: { id: accountId },
    data: { balance: { increment: delta } },
  });
}