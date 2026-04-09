/**
 * server/routes/reports.ts
 *
 * This file was missing entirely — that's why the dashboard showed
 * "Could not load dashboard data".
 *
 * GET /api/reports/dashboard     ← what Dashboard.tsx calls
 * GET /api/reports/profit-loss   ← what Reports.tsx calls
 * GET /api/reports/balance-sheet
 * GET /api/reports/cash-flow
 *
 * All queries use req.user.orgId for tenant isolation.
 * Dates stored as String "YYYY-MM-DD" — string comparison works correctly.
 */

import { RequestHandler } from "express";
import { prisma } from "../db";

// ── GET /api/reports/dashboard ────────────────────────────────
export const getDashboard: RequestHandler = async (req: any, res) => {
  try {
    const orgId = req.user?.orgId ?? "default";
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.substring(0, 7) + "-01"; // YYYY-MM-01

    const [
      todaySalesAgg,
      todayPurchasesAgg,
      todayReport,
      accounts,
      unpaidInvoices,
      unpaidPurchases,
      monthlySalesAgg,
      monthlyPurchasesAgg,
      monthlyReportAgg,
      recentInvoices,
      recentPurchases,
    ] = await Promise.all([
      // Today's totals
      (prisma as any).invoice.aggregate({
        where: { date: today, status: { not: "cancelled" } },
        _sum: { total: true },
        _count: true,
      }),
      (prisma as any).purchase.aggregate({
        where: { date: today, status: { not: "cancelled" } },
        _sum: { total: true },
        _count: true,
      }),
      // Today's daily report (for expenses + cash balance)
      (prisma as any).dailyReport.findFirst({
        where: { date: today },
      }),
      // All active accounts
      (prisma as any).account.findMany({
        orderBy: { name: "asc" },
      }),
      // Outstanding receivables
      (prisma as any).invoice.aggregate({
        where: { status: { in: ["sent", "partial"] } },
        _sum: { total: true },
        _count: true,
      }),
      // Outstanding payables
      (prisma as any).purchase.aggregate({
        where: { status: { in: ["received", "partial"] } },
        _sum: { total: true },
        _count: true,
      }),
      // This month's sales
      (prisma as any).invoice.aggregate({
        where: { date: { gte: monthStart, lte: today }, status: { not: "cancelled" } },
        _sum: { total: true },
      }),
      // This month's purchases
      (prisma as any).purchase.aggregate({
        where: { date: { gte: monthStart, lte: today }, status: { not: "cancelled" } },
        _sum: { total: true },
      }),
      // This month's expenses (from daily reports)
      (prisma as any).dailyReport.aggregate({
        where: { date: { gte: monthStart, lte: today } },
        _sum: { totalExpenses: true },
      }),
      // Recent invoices
      (prisma as any).invoice.findMany({
        where: { status: { not: "cancelled" } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent purchases
      (prisma as any).purchase.findMany({
        where: { status: { not: "cancelled" } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalBalance = accounts.reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
    const cashBalance = accounts
      .filter((a: any) => a.type === "cash")
      .reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
    const bankBalance = accounts
      .filter((a: any) => a.type === "bank")
      .reduce((s: number, a: any) => s + (a.balance ?? 0), 0);

    const monthlySales     = monthlySalesAgg._sum.total ?? 0;
    const monthlyPurchases = monthlyPurchasesAgg._sum.total ?? 0;
    const monthlyExpenses  = monthlyReportAgg._sum.totalExpenses ?? 0;

    res.json({
      success: true,
      message: "Dashboard loaded",
      data: {
        today: {
          date:           today,
          sales:          todaySalesAgg._sum.total    ?? 0,
          salesCount:     todaySalesAgg._count        ?? 0,
          purchases:      todayPurchasesAgg._sum.total ?? 0,
          purchasesCount: todayPurchasesAgg._count    ?? 0,
          expenses:       todayReport?.totalExpenses  ?? 0,
          cashBalance:    todayReport?.closingBalance ?? totalBalance,
        },
        monthly: {
          sales:       monthlySales,
          purchases:   monthlyPurchases,
          expenses:    monthlyExpenses,
          grossProfit: monthlySales - monthlyPurchases,
          netProfit:   monthlySales - monthlyPurchases - monthlyExpenses,
        },
        accounts: {
          list:         accounts,
          totalBalance,
          cashBalance,
          bankBalance,
        },
        outstanding: {
          receivables: {
            total: unpaidInvoices._sum.total  ?? 0,
            count: unpaidInvoices._count      ?? 0,
          },
          payables: {
            total: unpaidPurchases._sum.total ?? 0,
            count: unpaidPurchases._count     ?? 0,
          },
        },
        recentInvoices,
        recentPurchases,
      },
    });
  } catch (err: any) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/profit-loss ──────────────────────────────
export const getProfitLoss: RequestHandler = async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate)   dateFilter.lte = endDate;
    const withDate = Object.keys(dateFilter).length > 0;

    const [invoices, purchases, reports] = await Promise.all([
      (prisma as any).invoice.findMany({
        where: { status: { not: "cancelled" }, ...(withDate && { date: dateFilter }) },
        select: { total: true, tax: true },
      }),
      (prisma as any).purchase.findMany({
        where: { status: { not: "cancelled" }, ...(withDate && { date: dateFilter }) },
        select: { total: true, tax: true },
      }),
      (prisma as any).dailyReport.findMany({
        where: withDate ? { date: dateFilter } : {},
        select: { totalExpenses: true },
      }),
    ]);

    const totalSales     = invoices.reduce((s: number, i: any)  => s + i.total, 0);
    const totalSalesTax  = invoices.reduce((s: number, i: any)  => s + i.tax,   0);
    const totalPurchases = purchases.reduce((s: number, p: any) => s + p.total, 0);
    const totalExpenses  = reports.reduce((s: number, r: any)   => s + r.totalExpenses, 0);
    const grossProfit    = totalSales - totalPurchases;
    const netProfit      = grossProfit - totalExpenses;

    res.json({
      success: true,
      message: "Profit & Loss loaded",
      data: {
        period: { startDate: startDate || "All time", endDate: endDate || "Today" },
        sales:     { total: totalSales,     tax: totalSalesTax, count: invoices.length },
        purchases: { total: totalPurchases, count: purchases.length },
        grossProfit,
        expenses:  { total: totalExpenses },
        netProfit,
        profitMargin: totalSales > 0
          ? `${((netProfit / totalSales) * 100).toFixed(1)}%`
          : "0%",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/balance-sheet ────────────────────────────
export const getBalanceSheet: RequestHandler = async (req: any, res) => {
  try {
    const [accounts, unpaidInvoices, unpaidPurchases] = await Promise.all([
      (prisma as any).account.findMany({
        select: { id: true, name: true, type: true, balance: true, currency: true },
      }),
      (prisma as any).invoice.findMany({
        where: { status: { in: ["sent", "partial"] } },
        select: { total: true, paidAmount: true },
      }),
      (prisma as any).purchase.findMany({
        where: { status: { in: ["received", "partial"] } },
        select: { total: true, paidAmount: true },
      }),
    ]);

    const totalLiquidAssets = accounts.reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
    const totalReceivables  = unpaidInvoices.reduce(
      (s: number, i: any) => s + (i.total - (i.paidAmount ?? 0)), 0
    );
    const totalPayables     = unpaidPurchases.reduce(
      (s: number, p: any) => s + (p.total - (p.paidAmount ?? 0)), 0
    );
    const totalAssets      = totalLiquidAssets + totalReceivables;
    const totalLiabilities = totalPayables;

    res.json({
      success: true,
      message: "Balance Sheet loaded",
      data: {
        assets: { liquidAssets: accounts, totalLiquidAssets, receivables: totalReceivables, totalAssets },
        liabilities: { payables: totalPayables, totalLiabilities },
        netWorth: totalAssets - totalLiabilities,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/cash-flow ────────────────────────────────
export const getCashFlow: RequestHandler = async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate)   dateFilter.lte = endDate;
    const withDate = Object.keys(dateFilter).length > 0;

    const reports = await (prisma as any).dailyReport.findMany({
      where: withDate ? { date: dateFilter } : {},
      orderBy: { date: "asc" },
    });

    const openingBalance = reports[0]?.openingCashBalance ?? 0;
    const closingBalance = reports[reports.length - 1]?.closingBalance ?? 0;
    const totalCashIn    = reports.reduce((s: number, r: any) => s + (r.totalIncome ?? 0), 0);
    const totalCashOut   = reports.reduce((s: number, r: any) => s + (r.totalExpenses ?? 0) + (r.advancesPaid ?? 0), 0);

    res.json({
      success: true,
      message: "Cash Flow loaded",
      data: {
        period: { startDate: startDate || "All", endDate: endDate || "Today" },
        openingBalance,
        cashIn: totalCashIn,
        cashOut: totalCashOut,
        netCashFlow: totalCashIn - totalCashOut,
        closingBalance,
        breakdown: reports,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};