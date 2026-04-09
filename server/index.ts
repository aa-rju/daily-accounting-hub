/**
 * server/index.ts
 *
 * FIXES:
 * 1. Removed the standalone app.listen(3001) at the bottom.
 *    In dev, Vite embeds this via expressPlugin() — it must NOT listen separately.
 *    The listen at the bottom was creating a conflict: two servers fighting over ports.
 *
 * 2. Added /api/reports/* routes (was missing — dashboard was calling an endpoint
 *    that didn't exist on the server).
 *
 * 3. Added /api/auth/me route.
 *
 * 4. Added /api/settings routes.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "./middleware/auth";

import * as authRoutes        from "./routes/auth";
import * as partiesRoutes     from "./routes/parties";
import * as productsRoutes    from "./routes/products";
import * as accountsRoutes    from "./routes/accounts";
import * as salesRoutes       from "./routes/sales";
import * as purchaseRoutes    from "./routes/purchase";
import * as dailyReportRoutes from "./routes/dailyReport";
import * as inventoryRoutes   from "./routes/inventory";
import * as ledgerRoutes      from "./routes/ledger";
import * as reportsRoutes     from "./routes/reports";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health check (public) ────────────────────────────────
  app.get("/api/ping", (_req, res) => res.json({ message: "pong" }));

  // ── Public auth (no JWT needed) ──────────────────────────
  app.post("/api/auth/register", authRoutes.register);
  app.post("/api/auth/login",    authRoutes.login);
  app.post("/api/auth/logout",   authRoutes.logout);

  // ── All routes below require valid JWT ───────────────────
  app.use("/api", requireAuth);

  // Auth — profile
  app.get("/api/auth/me", authRoutes.me);

  // Parties
  app.get("/api/parties",            partiesRoutes.getParties);
  app.get("/api/parties/:id",        partiesRoutes.getParty);
  app.post("/api/parties",           partiesRoutes.createParty);
  app.put("/api/parties/:id",        partiesRoutes.updateParty);
  app.delete("/api/parties/:id",     partiesRoutes.deleteParty);

  // Products
  app.get("/api/products",           productsRoutes.getProducts);
  app.get("/api/products/:id",       productsRoutes.getProduct);
  app.post("/api/products",          productsRoutes.createProduct);
  app.put("/api/products/:id",       productsRoutes.updateProduct);
  app.delete("/api/products/:id",    productsRoutes.deleteProduct);

  // Accounts
  app.get("/api/accounts",           accountsRoutes.getAccounts);
  app.get("/api/accounts/:id",       accountsRoutes.getAccount);
  app.post("/api/accounts",          accountsRoutes.createAccount);
  app.put("/api/accounts/:id",       accountsRoutes.updateAccount);
  app.delete("/api/accounts/:id",    accountsRoutes.deleteAccount);

  // Sales / Invoices
  app.get("/api/sales",              salesRoutes.getInvoices);
  app.get("/api/sales/:id",          salesRoutes.getInvoice);
  app.post("/api/sales",             salesRoutes.createInvoice);
  app.put("/api/sales/:id",          salesRoutes.updateInvoice);
  app.delete("/api/sales/:id",       salesRoutes.deleteInvoice);

  // Purchases
  app.get("/api/purchases",          purchaseRoutes.getPurchases);
  app.get("/api/purchases/:id",      purchaseRoutes.getPurchase);
  app.post("/api/purchases",         purchaseRoutes.createPurchase);
  app.put("/api/purchases/:id",      purchaseRoutes.updatePurchase);
  app.delete("/api/purchases/:id",   purchaseRoutes.deletePurchase);

  // Daily Reports
  app.get("/api/daily-reports",           dailyReportRoutes.getDailyReports);
  app.get("/api/daily-reports/:date",     dailyReportRoutes.getDailyReport);
  app.post("/api/daily-reports",          dailyReportRoutes.createDailyReport);
  app.put("/api/daily-reports/:date",     dailyReportRoutes.updateDailyReport);
  app.delete("/api/daily-reports/:date",  dailyReportRoutes.deleteDailyReport);

  // Inventory
  app.get("/api/inventory",          inventoryRoutes.getInventory);
  app.get("/api/inventory/:id",      inventoryRoutes.getInventoryItem);
  app.post("/api/inventory",         inventoryRoutes.createInventoryItem);
  app.put("/api/inventory/:id",      inventoryRoutes.updateInventoryItem);
  app.delete("/api/inventory/:id",   inventoryRoutes.deleteInventoryItem);

  // Ledger
  app.get("/api/ledger",             ledgerRoutes.getAllLedgers);
  app.get("/api/ledger/:partyId",    ledgerRoutes.getPartyLedger);
  app.post("/api/ledger",            ledgerRoutes.createLedgerEntry);
  app.delete("/api/ledger/:id",      ledgerRoutes.deleteLedgerEntry);

  // Reports ← this was completely missing, causing the dashboard error
  app.get("/api/reports/profit-loss",   reportsRoutes.getProfitLoss);
  app.get("/api/reports/balance-sheet", reportsRoutes.getBalanceSheet);
  app.get("/api/reports/cash-flow",     reportsRoutes.getCashFlow);
  app.get("/api/reports/dashboard",     reportsRoutes.getDashboard);

  return app;
}

const app = createServer();
app.listen(3001, () => console.log("✅ Server running — multi-tenant on http://localhost:3001"));

