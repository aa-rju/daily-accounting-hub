import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FileText,
  Wallet,
  Activity,
} from "lucide-react";
import { reportsAPI, salesAPI, purchaseAPI } from "@/lib/api";
import { fmt, fmtShort, CURRENCY_SYMBOL } from "@/lib/currency";

// ─── Colours for pie charts ───────────────────────────────────
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ─── Date helpers ─────────────────────────────────────────────
function getDateRange(period: string): { startDate: string; endDate: string } {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const end = iso(today);
  switch (period) {
    case "today":
      return { startDate: end, endDate: end };
    case "week": {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      return { startDate: iso(d), endDate: end };
    }
    case "month": {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: iso(d), endDate: end };
    }
    case "quarter": {
      const d = new Date(today);
      d.setMonth(today.getMonth() - 3);
      return { startDate: iso(d), endDate: end };
    }
    case "year": {
      const d = new Date(today.getFullYear(), 0, 1);
      return { startDate: iso(d), endDate: end };
    }
    default:
      return { startDate: "", endDate: "" };
  }
}

// ─── Shared small components ──────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <ArrowUpRight className="w-3 h-3 text-green-600" />}
          {trend === "down" && (
            <ArrowDownRight className="w-3 h-3 text-red-600" />
          )}
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading report…</span>
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: DASHBOARD
// ─────────────────────────────────────────────
function DashboardTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports-dashboard"],
    queryFn: reportsAPI.getDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) return <Loading />;
  if (error || !data?.data) return <Err msg="Could not load dashboard data. Make sure the server is running." />;

  const d = data.data;

  return (
    <div className="space-y-6">
      {/* Today */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Today — {d.today?.date}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Today's Sales"
            value={fmtShort(d.today?.sales)}
            sub={`${d.today?.salesCount ?? 0} invoices`}
            color="bg-green-50 border-green-100"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Today's Purchases"
            value={fmtShort(d.today?.purchases)}
            sub={`${d.today?.purchasesCount ?? 0} orders`}
            color="bg-orange-50 border-orange-100"
            icon={TrendingDown}
          />
          <StatCard
            label="Today's Expenses"
            value={fmtShort(d.today?.expenses)}
            color="bg-red-50 border-red-100"
            icon={DollarSign}
          />
          <StatCard
            label="Cash Balance"
            value={fmtShort(d.today?.cashBalance)}
            color="bg-blue-50 border-blue-100"
            icon={Wallet}
          />
        </div>
      </div>

      {/* Monthly */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          This Month
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Monthly Sales"
            value={fmtShort(d.monthly?.sales)}
            color="bg-green-50 border-green-100"
            icon={TrendingUp}
          />
          <StatCard
            label="Monthly Purchases"
            value={fmtShort(d.monthly?.purchases)}
            color="bg-orange-50 border-orange-100"
            icon={TrendingDown}
          />
          <StatCard
            label="Monthly Expenses"
            value={fmtShort(d.monthly?.expenses)}
            color="bg-red-50 border-red-100"
            icon={DollarSign}
          />
          <StatCard
            label="Gross Profit"
            value={fmtShort(d.monthly?.grossProfit)}
            color={
              (d.monthly?.grossProfit ?? 0) >= 0
                ? "bg-emerald-50 border-emerald-100"
                : "bg-red-50 border-red-100"
            }
            icon={Activity}
            trend={(d.monthly?.grossProfit ?? 0) >= 0 ? "up" : "down"}
          />
        </div>
      </div>

      {/* Receivables / Payables + Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-4">
            Receivables &amp; Payables
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Outstanding Receivables
                </p>
                <p className="text-lg font-bold text-green-600">
                  {fmt(d.outstanding?.receivables?.total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.outstanding?.receivables?.count} unpaid invoices
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Outstanding Payables
                </p>
                <p className="text-lg font-bold text-red-600">
                  {fmt(d.outstanding?.payables?.total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.outstanding?.payables?.count} unpaid purchases
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-4">
            Account Balances
          </p>
          {(d.accounts?.list ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No accounts yet. Add accounts from the Accounts page.
            </p>
          ) : (
            <div className="space-y-3">
              {(d.accounts?.list ?? []).map((acc: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        acc.type === "cash"
                          ? "bg-green-500"
                          : acc.type === "bank"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <span className="font-medium">{acc.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      ({acc.type})
                    </span>
                  </div>
                  <span className="font-semibold">{fmt(acc.balance)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>{fmt(d.accounts?.totalBalance)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent invoices + purchases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: "Recent Invoices",
            items: d.recentInvoices,
            numKey: "billNumber",
            partyKey: "partyName",
          },
          {
            title: "Recent Purchases",
            items: d.recentPurchases,
            numKey: "purchaseNumber",
            partyKey: "supplierName",
          },
        ].map(({ title, items, numKey, partyKey }) => (
          <div
            key={title}
            className="bg-white rounded-xl border border-border p-5"
          >
            <p className="text-sm font-semibold text-foreground mb-4">
              {title}
            </p>
            {!(items ?? []).length ? (
              <p className="text-xs text-muted-foreground">No records yet.</p>
            ) : (
              <div className="space-y-2">
                {(items ?? []).slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm border-b border-border pb-2"
                  >
                    <div>
                      <p className="font-medium">{item[numKey]}</p>
                      <p className="text-xs text-muted-foreground">
                        {item[partyKey]} · {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmt(item.total)}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : item.status === "partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: PROFIT & LOSS
// ─────────────────────────────────────────────
function ProfitLossTab({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports-pl", startDate, endDate],
    queryFn: () =>
      reportsAPI.getProfitLoss(startDate || undefined, endDate || undefined),
  });

  if (isLoading) return <Loading />;
  if (error || !data?.data)
    return <Err msg="Could not load P&L data." />;

  const d = data.data;
  const barData = [
    { name: "Sales", value: d.sales?.total ?? 0, fill: "#10b981" },
    { name: "Purchases", value: d.purchases?.total ?? 0, fill: "#f59e0b" },
    { name: "Expenses", value: d.expenses?.total ?? 0, fill: "#ef4444" },
    {
      name: "Net Profit",
      value: Math.max(0, d.netProfit ?? 0),
      fill: "#3b82f6",
    },
  ];

  const rows = [
    { label: "Total Sales Revenue", amt: d.sales?.total, cls: "text-green-700" },
    { label: "Cost of Goods (Purchases)", amt: d.purchases?.total, cls: "text-orange-700" },
    {
      label: "Gross Profit",
      amt: d.grossProfit,
      cls: (d.grossProfit ?? 0) >= 0 ? "text-green-700" : "text-red-700",
      bold: true,
    },
    { label: "Operating Expenses", amt: d.expenses?.total, cls: "text-red-700" },
    {
      label: "NET PROFIT / LOSS",
      amt: d.netProfit,
      cls: (d.netProfit ?? 0) >= 0 ? "text-blue-700" : "text-red-700",
      bold: true,
      large: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales"
          value={fmtShort(d.sales?.total)}
          sub={`${d.sales?.count ?? 0} invoices`}
          color="bg-green-50 border-green-100"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Total Purchases"
          value={fmtShort(d.purchases?.total)}
          sub={`${d.purchases?.count ?? 0} orders`}
          color="bg-orange-50 border-orange-100"
          icon={TrendingDown}
        />
        <StatCard
          label="Total Expenses"
          value={fmtShort(d.expenses?.total)}
          color="bg-red-50 border-red-100"
          icon={DollarSign}
        />
        <StatCard
          label="Net Profit"
          value={fmtShort(d.netProfit)}
          sub={d.profitMargin}
          color={
            (d.netProfit ?? 0) >= 0
              ? "bg-blue-50 border-blue-100"
              : "bg-red-50 border-red-100"
          }
          icon={Activity}
          trend={(d.netProfit ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statement table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <p className="font-semibold text-foreground">
              Profit &amp; Loss Statement
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {startDate || "All time"} → {endDate || "Today"}
            </p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-border ${
                    row.bold ? "bg-muted/20" : ""
                  }`}
                >
                  <td
                    className={`px-5 py-3 ${
                      row.bold ? "font-bold" : "pl-8 text-muted-foreground"
                    } ${row.large ? "text-base" : ""}`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-semibold ${row.cls} ${
                      row.large ? "text-base" : ""
                    }`}
                  >
                    {fmt(row.amt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="font-semibold text-foreground mb-4">Visual Summary</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1000
                    ? `${CURRENCY_SYMBOL}${(v / 1000).toFixed(0)}K`
                    : String(v)
                }
              />
              <Tooltip
                formatter={(v: any) => [fmt(v), ""]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: BALANCE SHEET
// ─────────────────────────────────────────────
function BalanceSheetTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports-bs"],
    queryFn: reportsAPI.getBalanceSheet,
  });

  if (isLoading) return <Loading />;
  if (error || !data?.data)
    return <Err msg="Could not load balance sheet." />;

  const d = data.data;
  const pieData = [
    { name: "Liquid Assets", value: d.assets?.totalLiquidAssets ?? 0 },
    { name: "Receivables", value: d.assets?.receivables ?? 0 },
    { name: "Payables", value: d.liabilities?.totalLiabilities ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Assets"
          value={fmtShort(d.assets?.totalAssets)}
          color="bg-blue-50 border-blue-100"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Total Liabilities"
          value={fmtShort(d.liabilities?.totalLiabilities)}
          color="bg-red-50 border-red-100"
          icon={TrendingDown}
        />
        <StatCard
          label="Net Worth"
          value={fmtShort(d.netWorth)}
          color={
            (d.netWorth ?? 0) >= 0
              ? "bg-green-50 border-green-100"
              : "bg-red-50 border-red-100"
          }
          icon={Activity}
          trend={(d.netWorth ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border bg-blue-50">
                <td className="px-5 py-3 font-bold text-blue-900" colSpan={2}>
                  ASSETS
                </td>
              </tr>
              {(d.assets?.liquidAssets ?? []).map((acc: any, i: number) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-5 py-3 pl-8 text-muted-foreground capitalize">
                    {acc.name} ({acc.type})
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-green-700">
                    {fmt(acc.balance)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-border">
                <td className="px-5 py-3 pl-8 text-muted-foreground">
                  Receivables (unpaid invoices)
                </td>
                <td className="px-5 py-3 text-right font-semibold text-green-700">
                  {fmt(d.assets?.receivables)}
                </td>
              </tr>
              <tr className="border-b-2 border-border font-bold bg-blue-50">
                <td className="px-5 py-3 text-blue-900">Total Assets</td>
                <td className="px-5 py-3 text-right text-blue-900">
                  {fmt(d.assets?.totalAssets)}
                </td>
              </tr>
              <tr className="border-b border-border bg-red-50">
                <td className="px-5 py-3 font-bold text-red-900" colSpan={2}>
                  LIABILITIES
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-5 py-3 pl-8 text-muted-foreground">
                  Payables (unpaid purchases)
                </td>
                <td className="px-5 py-3 text-right font-semibold text-red-700">
                  {fmt(d.liabilities?.totalLiabilities)}
                </td>
              </tr>
              <tr className="border-b-2 border-border font-bold bg-red-50">
                <td className="px-5 py-3 text-red-900">Total Liabilities</td>
                <td className="px-5 py-3 text-right text-red-900">
                  {fmt(d.liabilities?.totalLiabilities)}
                </td>
              </tr>
              <tr className="font-bold bg-emerald-50">
                <td className="px-5 py-4 text-emerald-900 text-base">
                  NET WORTH
                </td>
                <td
                  className={`px-5 py-4 text-right text-base ${
                    (d.netWorth ?? 0) >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {fmt(d.netWorth)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <p className="font-semibold text-foreground mb-4">
            Financial Composition
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any) => fmt(v)}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: CASH FLOW
// ─────────────────────────────────────────────
function CashFlowTab({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports-cf", startDate, endDate],
    queryFn: () =>
      reportsAPI.getCashFlow(startDate || undefined, endDate || undefined),
  });

  if (isLoading) return <Loading />;
  if (error || !data?.data)
    return <Err msg="Could not load cash flow data." />;

  const d = data.data;
  const lineData = (d.breakdown ?? []).map((r: any) => ({
    date: r.date,
    "Cash In": r.totalIncome,
    "Cash Out": (r.totalExpenses ?? 0) + (r.advancesPaid ?? 0),
    Balance: r.closingBalance,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Opening Balance"
          value={fmtShort(d.openingBalance)}
          color="bg-gray-50 border-gray-200"
          icon={Wallet}
        />
        <StatCard
          label="Total Cash In"
          value={fmtShort(d.cashIn)}
          color="bg-green-50 border-green-100"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Total Cash Out"
          value={fmtShort(d.cashOut)}
          color="bg-red-50 border-red-100"
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          label="Closing Balance"
          value={fmtShort(d.closingBalance)}
          color={
            (d.closingBalance ?? 0) >= 0
              ? "bg-blue-50 border-blue-100"
              : "bg-red-50 border-red-100"
          }
          icon={Activity}
          trend={(d.closingBalance ?? 0) >= 0 ? "up" : "down"}
        />
      </div>

      {lineData.length > 0 ? (
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="font-semibold text-foreground mb-4">
            Cash Flow Over Time
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  `${CURRENCY_SYMBOL}${(v / 1000).toFixed(0)}K`
                }
              />
              <Tooltip
                formatter={(v: any) => [fmt(v), ""]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Cash In"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Cash Out"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Balance"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          No daily reports found for this period. Create daily reports to see
          cash flow.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: TRANSACTIONS
// ─────────────────────────────────────────────
function TransactionsTab({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data: salesData } = useQuery({
    queryKey: ["sales-report", startDate, endDate],
    queryFn: () => salesAPI.getAll(1, 100),
  });
  const { data: purchasesData } = useQuery({
    queryKey: ["purchases-report", startDate, endDate],
    queryFn: () => purchaseAPI.getAll(1, 100),
  });

  const rows = useMemo(() => {
    const s = (salesData?.data ?? []).map((i: any) => ({
      date: i.date,
      type: "Invoice",
      ref: i.billNumber,
      party: i.partyName,
      amount: i.total,
      status: i.status,
      isIncome: true,
    }));
    const p = (purchasesData?.data ?? []).map((i: any) => ({
      date: i.date,
      type: "Purchase",
      ref: i.purchaseNumber,
      party: i.supplierName,
      amount: i.total,
      status: i.status,
      isIncome: false,
    }));
    return [...s, ...p].sort((a, b) => b.date.localeCompare(a.date));
  }, [salesData, purchasesData]);

  const totalIn = rows
    .filter((r) => r.isIncome)
    .reduce((s, r) => s + r.amount, 0);
  const totalOut = rows
    .filter((r) => !r.isIncome)
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmtShort(totalIn)}
          color="bg-green-50 border-green-100"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Total Purchases"
          value={fmtShort(totalOut)}
          color="bg-orange-50 border-orange-100"
          icon={TrendingDown}
        />
        <StatCard
          label="Net"
          value={fmtShort(totalIn - totalOut)}
          color={
            totalIn - totalOut >= 0
              ? "bg-blue-50 border-blue-100"
              : "bg-red-50 border-red-100"
          }
          icon={Activity}
          trend={totalIn - totalOut >= 0 ? "up" : "down"}
        />
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <p className="font-semibold text-foreground">
            All Transactions ({rows.length})
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  {["Date", "Type", "Reference", "Party", "Amount", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-semibold text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-border hover:bg-muted/20"
                  >
                    <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.isIncome
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{r.ref}</td>
                    <td className="px-5 py-3">{r.party}</td>
                    <td
                      className={`px-5 py-3 font-semibold ${
                        r.isIncome ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {r.isIncome ? "+" : "-"}
                      {fmt(r.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : r.status === "partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : r.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "profitloss", label: "Profit & Loss", icon: TrendingUp },
  { id: "balance", label: "Balance Sheet", icon: FileText },
  { id: "cashflow", label: "Cash Flow", icon: Activity },
  { id: "transactions", label: "Transactions", icon: Wallet },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { startDate, endDate } = useMemo(() => {
    if (period === "custom")
      return { startDate: customStart, endDate: customEnd };
    return getDateRange(period);
  }, [period, customStart, customEnd]);

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Financial analysis — Currency: NPR (रू)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date filter (not on Dashboard / Balance Sheet) */}
        {activeTab !== "dashboard" && activeTab !== "balance" && (
          <div className="flex flex-wrap gap-4 items-end bg-white rounded-xl border border-border p-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Period
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    From
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm h-9 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    To
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm h-9 bg-background"
                  />
                </div>
              </>
            )}
            {period !== "custom" && (
              <p className="text-xs text-muted-foreground self-end pb-2">
                {startDate} → {endDate}
              </p>
            )}
          </div>
        )}

        {/* Tab content */}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "profitloss" && (
          <ProfitLossTab startDate={startDate} endDate={endDate} />
        )}
        {activeTab === "balance" && <BalanceSheetTab />}
        {activeTab === "cashflow" && (
          <CashFlowTab startDate={startDate} endDate={endDate} />
        )}
        {activeTab === "transactions" && (
          <TransactionsTab startDate={startDate} endDate={endDate} />
        )}
      </div>
    </MainLayout>
  );
}