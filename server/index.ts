import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "./middleware/auth";
import * as authRoutes from "./routes/auth";
import * as partiesRoutes from "./routes/parties";
import * as productsRoutes from "./routes/products";
import * as accountsRoutes from "./routes/accounts";
import * as salesRoutes from "./routes/sales";
import * as purchaseRoutes from "./routes/purchase";
import * as dailyReportRoutes from "./routes/dailyReport";
import * as inventoryRoutes from "./routes/inventory";
import * as ledgerRoutes from "./routes/ledger";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "pong" });
  });

  // app.get("/api/demo", handleDemo);
  app.post("/api/auth/register", authRoutes.register);
// Public routes (no auth needed)
  app.post("/api/auth/login", authRoutes.login);
  app.post("/api/auth/logout", authRoutes.logout);

  // 🔒 Everything below requires a valid JWT
  app.use("/api", requireAuth);
  
  app.get("/api/parties", partiesRoutes.getParties);
  app.get("/api/parties/:id", partiesRoutes.getParty);
  app.post("/api/parties", partiesRoutes.createParty);
  app.put("/api/parties/:id", partiesRoutes.updateParty);
  app.delete("/api/parties/:id", partiesRoutes.deleteParty);

  // Product Management Routes
  app.get("/api/products", productsRoutes.getProducts);
  app.get("/api/products/:id", productsRoutes.getProduct);
  app.post("/api/products", productsRoutes.createProduct);
  app.put("/api/products/:id", productsRoutes.updateProduct);
  app.delete("/api/products/:id", productsRoutes.deleteProduct);

  // Account Management Routes
  app.get("/api/accounts", accountsRoutes.getAccounts);
  app.get("/api/accounts/:id", accountsRoutes.getAccount);
  app.post("/api/accounts", accountsRoutes.createAccount);
  app.put("/api/accounts/:id", accountsRoutes.updateAccount);
  app.delete("/api/accounts/:id", accountsRoutes.deleteAccount);

  // Sales/Invoice Routes
  app.get("/api/sales", salesRoutes.getInvoices);
  app.get("/api/sales/:id", salesRoutes.getInvoice);
  app.post("/api/sales", salesRoutes.createInvoice);
  app.put("/api/sales/:id", salesRoutes.updateInvoice);
  app.delete("/api/sales/:id", salesRoutes.deleteInvoice);

  // Purchase Routes
  app.get("/api/purchases", purchaseRoutes.getPurchases);
  app.get("/api/purchases/:id", purchaseRoutes.getPurchase);
  app.post("/api/purchases", purchaseRoutes.createPurchase);
  app.put("/api/purchases/:id", purchaseRoutes.updatePurchase);
  app.delete("/api/purchases/:id", purchaseRoutes.deletePurchase);

  // Daily Report Routes
  app.get("/api/daily-reports", dailyReportRoutes.getDailyReports);
  app.get("/api/daily-reports/:date", dailyReportRoutes.getDailyReport);
  app.post("/api/daily-reports", dailyReportRoutes.createDailyReport);
  app.put("/api/daily-reports/:date", dailyReportRoutes.updateDailyReport);
  app.delete("/api/daily-reports/:date", dailyReportRoutes.deleteDailyReport);

  // Inventory Routes
  app.get("/api/inventory", inventoryRoutes.getInventory);
  app.get("/api/inventory/:id", inventoryRoutes.getInventoryItem);
  app.post("/api/inventory", inventoryRoutes.createInventoryItem);
  app.put("/api/inventory/:id", inventoryRoutes.updateInventoryItem);
  app.delete("/api/inventory/:id", inventoryRoutes.deleteInventoryItem);

  // Ledger Routes
  app.get("/api/ledger", ledgerRoutes.getAllLedgers);
  app.get("/api/ledger/:partyId", ledgerRoutes.getPartyLedger);
  app.post("/api/ledger", ledgerRoutes.createLedgerEntry);
  app.delete("/api/ledger/:id", ledgerRoutes.deleteLedgerEntry);

  return app;
}

// Add this at the bottom of server/index.ts
// Add at the very bottom
const app = createServer();
app.listen(3001, () => console.log("✅ Server running on http://localhost:3001"));
