import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Wallet,
  AlertCircle,
  Loader2,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { reportsAPI, dailyReportAPI } from "@/lib/api";
import { fmt, fmtShort } from "@/lib/currency";

// ─── Card component ───────────────────────────────────────────
function OverviewCard({
  title,
  value,
  subtext,
  icon: Icon,
  color,
  iconColor,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
  iconColor: string;
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${color} backdrop-blur-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-lg border p-5 bg-muted/20 animate-pulse">
      <div className="h-4 bg-muted rounded w-24 mb-3" />
      <div className="h-8 bg-muted rounded w-32 mb-2" />
      <div className="h-3 bg-muted rounded w-20" />
    </div>
  );
}

export default function Dashboard() {
  const {
    data: dashData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsAPI.getDashboard,
    refetchInterval: 60000, // refresh every minute
  });

  // Last 7 daily reports for chart
  const { data: reportHistory } = useQuery({
    queryKey: ["daily-reports-chart"],
    queryFn: () => dailyReportAPI.getAll(1, 7),
  });

  const d = dashData?.data;

  // Build chart data from daily reports (most recent 7 days)
  const chartData = (reportHistory?.data ?? [])
    .slice()
    .reverse()
    .map((r: any) => ({
      date: r.date?.slice(5) ?? "", // show MM-DD
      Income: r.totalIncome ?? 0,
      Expense: r.totalExpenses ?? 0,
    }));

  // Fallback chart if no daily reports yet
  const hasChartData = chartData.length > 0;

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your financial overview — NPR (रू)
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/reports">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Full Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Could not load dashboard data. Make sure the server is running.
          </div>
        )}

        {/* Overview Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <OverviewCard
              title="Today's Sales"
              value={fmtShort(d?.today?.sales)}
              subtext={`${d?.today?.salesCount ?? 0} invoices`}
              icon={TrendingUp}
              color="bg-green-50 border-green-100"
              iconColor="bg-green-100 text-green-600"
            />
            <OverviewCard
              title="Today's Purchases"
              value={fmtShort(d?.today?.purchases)}
              subtext={`${d?.today?.purchasesCount ?? 0} orders`}
              icon={TrendingDown}
              color="bg-orange-50 border-orange-100"
              iconColor="bg-orange-100 text-orange-600"
            />
            <OverviewCard
              title="Cash Balance"
              value={fmtShort(d?.accounts?.cashBalance)}
              subtext="All cash accounts"
              icon={Wallet}
              color="bg-blue-50 border-blue-100"
              iconColor="bg-blue-100 text-blue-600"
            />
            <OverviewCard
              title="Receivables"
              value={fmtShort(d?.outstanding?.receivables?.total)}
              subtext={`${d?.outstanding?.receivables?.count ?? 0} unpaid invoices`}
              icon={ArrowDownRight}
              color="bg-purple-50 border-purple-100"
              iconColor="bg-purple-100 text-purple-600"
            />
            <OverviewCard
              title="Payables"
              value={fmtShort(d?.outstanding?.payables?.total)}
              subtext={`${d?.outstanding?.payables?.count ?? 0} unpaid purchases`}
              icon={ArrowUpRight}
              color="bg-red-50 border-red-100"
              iconColor="bg-red-100 text-red-600"
            />
          </div>
        )}

        {/* Monthly Summary Row */}
        {d && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Monthly Sales",
                value: fmtShort(d.monthly?.sales),
                cls: "text-green-600",
              },
              {
                label: "Monthly Purchases",
                value: fmtShort(d.monthly?.purchases),
                cls: "text-orange-600",
              },
              {
                label: "Monthly Expenses",
                value: fmtShort(d.monthly?.expenses),
                cls: "text-red-600",
              },
              {
                label: "Gross Profit",
                value: fmtShort(d.monthly?.grossProfit),
                cls:
                  (d.monthly?.grossProfit ?? 0) >= 0
                    ? "text-emerald-600"
                    : "text-red-600",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-lg border border-border p-4"
              >
                <p className="text-xs text-muted-foreground font-medium">
                  {item.label}
                </p>
                <p className={`text-xl font-bold mt-1 ${item.cls}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charts + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Income vs Expense
                </h3>
                <p className="text-sm text-muted-foreground">
                  Last 7 daily reports
                </p>
              </div>
              {!hasChartData && (
                <p className="text-xs text-muted-foreground">
                  Add daily reports to see trends
                </p>
              )}
            </div>
            {hasChartData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: any) => [fmt(v), ""]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Income"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <DollarSign className="w-10 h-10 opacity-30" />
                <p className="text-sm">
                  No daily reports yet. Start adding them!
                </p>
                <Link to="/daily-report">
                  <Button size="sm" variant="outline" className="mt-2">
                    Add Daily Report
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link to="/sales">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Invoice
                </Button>
              </Link>
              <Link to="/purchase">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Purchase
                </Button>
              </Link>
              <Link to="/daily-report">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Daily Report
                </Button>
              </Link>
              <Link to="/parties">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Party
                </Button>
              </Link>
              <Link to="/reports">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  View All Reports
                </Button>
              </Link>
            </div>

            {/* Account balances sidebar */}
            {d?.accounts?.list?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Accounts
                </p>
                <div className="space-y-2">
                  {d.accounts.list.slice(0, 4).map((acc: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm items-center"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            acc.type === "cash"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="text-muted-foreground truncate max-w-[90px]">
                          {acc.name}
                        </span>
                      </div>
                      <span className="font-semibold text-xs">
                        {fmt(acc.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        {d?.recentInvoices?.length > 0 && (
          <div className="bg-white rounded-lg border border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Recent Invoices
                </h3>
                <p className="text-sm text-muted-foreground">
                  Latest sales activity
                </p>
              </div>
              <Link to="/sales">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      "Date",
                      "Bill No.",
                      "Party",
                      "Amount",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(d.recentInvoices ?? []).map((inv: any) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {inv.date}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-foreground">
                        {inv.billNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {inv.partyName}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {fmt(inv.total)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : inv.status === "partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : inv.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state when no data at all */}
        {!isLoading && !error && !d?.recentInvoices?.length && (
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to go!
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start by adding parties, products, and your first invoice.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/parties">
                <Button>Add Party</Button>
              </Link>
              <Link to="/sales">
                <Button variant="outline">New Invoice</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}