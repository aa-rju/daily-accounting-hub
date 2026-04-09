/**
 * server/routes/dailyReport.ts — org-scoped
 * date is unique per org (@@unique([orgId, date]) in schema)
 */
import { RequestHandler } from "express";
import { prisma } from "../db";

function calcTotals(body: any) {
  const openingCashBalance  = Number(body.openingCashBalance  ?? 0);
  const cashReceived        = Number(body.cashReceived        ?? 0);
  const bankDeposits        = Number(body.bankDeposits        ?? 0);
  const onlineBankTransfer  = Number(body.onlineBankTransfer  ?? 0);
  const creditSales         = Number(body.creditSales         ?? 0);
  const advancesPaid        = Number(body.advancesPaid        ?? 0);
  const expenses = Array.isArray(body.expenses) ? body.expenses : [];
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  const totalIncome   = cashReceived + bankDeposits + onlineBankTransfer + creditSales;
  const closingBalance = openingCashBalance + totalIncome - totalExpenses - advancesPaid;
  return { openingCashBalance, cashReceived, bankDeposits, onlineBankTransfer, creditSales, advancesPaid, expenses, totalExpenses, totalIncome, closingBalance };
}

export const getDailyReports: RequestHandler = async (req: any, res) => {
  try {
    const { page = 1, pageSize = 31, startDate, endDate } = req.query;
    const where: any = { orgId: req.user.orgId };
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };

    const [data, total] = await Promise.all([
      (prisma as any).dailyReport.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), orderBy: { date: "desc" } }),
      (prisma as any).dailyReport.count({ where }),
    ]);
    res.json({ success: true, message: "Reports retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getDailyReport: RequestHandler = async (req: any, res) => {
  try {
    // Find by orgId + date (not global date)
    const report = await (prisma as any).dailyReport.findFirst({
      where: { date: req.params.date, orgId: req.user.orgId },
    });
    if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
    res.json({ success: true, message: "Report retrieved", data: report });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user.orgId;
    const { date } = req.body;
    if (!date) { res.status(400).json({ success: false, message: "date required" }); return; }

    const totals = calcTotals(req.body);
    const existing = await (prisma as any).dailyReport.findFirst({ where: { date: String(date), orgId } });

    const report = existing
      ? await (prisma as any).dailyReport.update({ where: { id: existing.id }, data: totals })
      : await (prisma as any).dailyReport.create({ data: { orgId, date: String(date), ...totals } });

    res.status(201).json({ success: true, message: existing ? "Report updated" : "Report created", data: report });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const report = await (prisma as any).dailyReport.findFirst({ where: { date: req.params.date, orgId: req.user.orgId } });
    if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
    const totals = calcTotals({ ...report, ...req.body });
    const updated = await (prisma as any).dailyReport.update({ where: { id: report.id }, data: totals });
    res.json({ success: true, message: "Report updated", data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const report = await (prisma as any).dailyReport.findFirst({ where: { date: req.params.date, orgId: req.user.orgId } });
    if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
    await (prisma as any).dailyReport.delete({ where: { id: report.id } });
    res.json({ success: true, message: "Report deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};