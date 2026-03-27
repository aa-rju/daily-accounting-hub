import { RequestHandler } from "express";
import { prisma, getOrgId, listResponse, okResponse } from "../db";

function calcReport(body: any) {
  const cashReceived  = Number(body.cashReceived  || 0);
  const bankDeposits  = Number(body.bankDeposits  || 0);
  const onlineTransfer= Number(body.onlineBankTransfer || 0);
  const creditSales   = Number(body.creditSales   || 0);
  const cashSales     = Number(body.cashSales     || 0);
  const bankSales     = Number(body.bankSales     || 0);
  const totalExpenses = Number(body.totalExpenses ||
    (body.expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0));
  const advancesPaid  = Number(body.advancesPaid  || 0);
  const opening       = Number(body.openingCashBalance || 0);

  const totalIncome   = cashReceived + bankDeposits + onlineTransfer + creditSales + cashSales + bankSales;
  const totalSales    = cashSales + bankSales + creditSales + cashReceived;
  const totalPurchases= Number(body.totalPurchases || 0);
  const closingBalance= opening + totalIncome - totalExpenses - advancesPaid;
  const netProfit     = totalSales - totalPurchases - totalExpenses;

  return {
    openingCashBalance: opening,
    cashReceived, bankDeposits,
    onlineBankTransfer: onlineTransfer,
    creditSales, cashSales, bankSales,
    advancesPaid, totalExpenses, totalIncome,
    totalSales, totalPurchases,
    closingBalance, netProfit,
    expenses: body.expenses || [],
    notes: body.notes || null,
  };
}

export const getDailyReports: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { page = 1, pageSize = 31, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { orgId };
    if (startDate) where.date = { gte: String(startDate) };
    if (endDate) where.date = { ...where.date, lte: String(endDate) };
    const [data, total] = await Promise.all([
      prisma.dailyReport.findMany({ where, skip, take: Number(pageSize), orderBy: { date: "desc" } }),
      prisma.dailyReport.count({ where }),
    ]);
    res.json(listResponse(data, total, Number(page), Number(pageSize)));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const report = await prisma.dailyReport.findFirst({ where: { date: req.params.date, orgId } });
    if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
    res.json(okResponse(report));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const { date } = req.body;
    if (!date) { res.status(400).json({ success: false, message: "date required" }); return; }

    // Upsert by date (one report per day per org)
    const existing = await prisma.dailyReport.findFirst({ where: { date: String(date), orgId } });
    const payload = calcReport(req.body);

    const report = existing
      ? await prisma.dailyReport.update({ where: { id: existing.id }, data: payload })
      : await prisma.dailyReport.create({ data: { orgId, date: String(date), ...payload } });

    res.status(201).json(okResponse(report, existing ? "Report updated" : "Report created"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const report = await prisma.dailyReport.findFirst({ where: { date: req.params.date, orgId } });
    if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
    const updated = await prisma.dailyReport.update({
      where: { id: report.id },
      data: calcReport({ ...report, ...req.body }),
    });
    res.json(okResponse(updated, "Report updated"));
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteDailyReport: RequestHandler = async (req: any, res) => {
  try {
    const orgId = getOrgId(req);
    const report = await prisma.dailyReport.findFirst({ where: { date: req.params.date, orgId } });
    if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
    await prisma.dailyReport.delete({ where: { id: report.id } });
    res.json({ success: true, message: "Report deleted", data: null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};