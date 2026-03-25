import { RequestHandler } from "express";
import { prisma } from "../db";

export const getDailyReports: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const [data, total] = await Promise.all([
    prisma.dailyReport.findMany({
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { date: "desc" },
    }),
    prisma.dailyReport.count(),
  ]);
  res.json({ success: true, message: "Reports retrieved", data, total, page: Number(page), pageSize: Number(pageSize) });
};

export const getDailyReport: RequestHandler = async (req, res) => {
  const report = await prisma.dailyReport.findUnique({ where: { date: req.params.date } });
  if (!report) { res.status(404).json({ success: false, message: "Report not found" }); return; }
  res.json({ success: true, message: "Report retrieved", data: report });
};

export const createDailyReport: RequestHandler = async (req, res) => {
  const { date, openingCashBalance, bankDeposits, expenses, advancesPaid, cashReceived, onlineBankTransfer, creditSales } = req.body;
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalIncome = Number(cashReceived) + Number(onlineBankTransfer) + Number(creditSales);
  const closingBalance = Number(openingCashBalance) + totalIncome - totalExpenses - Number(advancesPaid);

  const report = await prisma.dailyReport.create({
    data: {
      date, expenses,
      openingCashBalance: Number(openingCashBalance),
      bankDeposits: Number(bankDeposits),
      advancesPaid: Number(advancesPaid),
      cashReceived: Number(cashReceived),
      onlineBankTransfer: Number(onlineBankTransfer),
      creditSales: Number(creditSales),
      totalExpenses, totalIncome, closingBalance,
    },
  });
  res.status(201).json({ success: true, message: "Report created", data: report });
};

export const updateDailyReport: RequestHandler = async (req, res) => {
  const { openingCashBalance, bankDeposits, expenses, advancesPaid, cashReceived, onlineBankTransfer, creditSales } = req.body;
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalIncome = Number(cashReceived) + Number(onlineBankTransfer) + Number(creditSales);
  const closingBalance = Number(openingCashBalance) + totalIncome - totalExpenses - Number(advancesPaid);

  const report = await prisma.dailyReport.update({
    where: { date: req.params.date },
    data: {
      expenses, openingCashBalance: Number(openingCashBalance),
      bankDeposits: Number(bankDeposits), advancesPaid: Number(advancesPaid),
      cashReceived: Number(cashReceived), onlineBankTransfer: Number(onlineBankTransfer),
      creditSales: Number(creditSales), totalExpenses, totalIncome, closingBalance,
    },
  });
  res.json({ success: true, message: "Report updated", data: report });
};

export const deleteDailyReport: RequestHandler = async (req, res) => {
  await prisma.dailyReport.delete({ where: { date: req.params.date } });
  res.json({ success: true, message: "Report deleted", data: null });
};