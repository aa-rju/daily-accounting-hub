import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";

// Mock data
const chartData = [
  { date: "Mon", income: 4000, expense: 2400 },
  { date: "Tue", income: 3000, expense: 1398 },
  { date: "Wed", income: 2000, expense: 9800 },
  { date: "Thu", income: 2780, expense: 3908 },
  { date: "Fri", income: 1890, expense: 4800 },
  { date: "Sat", income: 2390, expense: 3800 },
  { date: "Sun", income: 3490, expense: 4300 },
];

const recentTransactions = [
  {
    id: 1,
    date: "2024-03-15",
    type: "Income",
    category: "Sales",
    description: "Product Sale - Order #1234",
    amount: 2500,
    account: "Bank Account",
    status: "completed",
  },
  {
    id: 2,
    date: "2024-03-15",
    type: "Expense",
    category: "Office Supplies",
    description: "Stationery Purchase",
    amount: 125,
    account: "Cash",
    status: "completed",
  },
  {
    id: 3,
    date: "2024-03-14",
    type: "Expense",
    category: "Utilities",
    description: "Electricity Bill",
    amount: 450,
    account: "Bank Account",
    status: "completed",
  },
  {
    id: 4,
    date: "2024-03-14",
    type: "Income",
    category: "Services",
    description: "Consulting Services",
    amount: 1500,
    account: "Bank Account",
    status: "completed",
  },
  {
    id: 5,
    date: "2024-03-13",
    type: "Expense",
    category: "Travel",
    description: "Client Meeting - Transport",
    amount: 85,
    account: "Cash",
    status: "completed",
  },
];

// Overview Card Component
function OverviewCard({
  title,
  value,
  subtext,
  icon: Icon,
  type,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  type: "income" | "expense" | "cash" | "receivable";
}) {
  const getColor = (t: string) => {
    switch (t) {
      case "income":
        return "bg-green-50 border-green-100";
      case "expense":
        return "bg-red-50 border-red-100";
      case "cash":
        return "bg-blue-50 border-blue-100";
      case "receivable":
        return "bg-purple-50 border-purple-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  const getIconColor = (t: string) => {
    switch (t) {
      case "income":
        return "bg-green-100 text-green-600";
      case "expense":
        return "bg-red-100 text-red-600";
      case "cash":
        return "bg-blue-100 text-blue-600";
      case "receivable":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div
      className={`rounded-lg border p-6 ${getColor(
        type
      )} backdrop-blur-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-lg ${getIconColor(type)}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your financial overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <OverviewCard
            title="Today's Income"
            value="৳45,250"
            subtext="12 transactions"
            icon={ArrowDownRight}
            type="income"
          />
          <OverviewCard
            title="Today's Expense"
            value="৳8,350"
            subtext="8 transactions"
            icon={ArrowUpRight}
            type="expense"
          />
          <OverviewCard
            title="Cash Balance"
            value="৳125,450"
            subtext="Last updated today"
            icon={TrendingUp}
            type="cash"
          />
          <OverviewCard
            title="Total Receivable"
            value="৳45,200"
            subtext="From 5 customers"
            icon={ArrowDownRight}
            type="receivable"
          />
          <OverviewCard
            title="Total Payable"
            value="৳12,500"
            subtext="Due within 30 days"
            icon={ArrowUpRight}
            type="expense"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart - Income vs Expense */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Weekly Overview
                </h3>
                <p className="text-sm text-muted-foreground">
                  Income vs Expense Trends
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link to="/transactions">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Income
                </Button>
              </Link>
              <Link to="/transactions">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Button>
              </Link>
              <Link to="/transactions">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Transfer
                </Button>
              </Link>
              <Link to="/transactions">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Recent Transactions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Latest entries from your accounts
                </p>
              </div>
              <Link to="/transactions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.type === "Income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {transaction.account}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-semibold text-right ${
                        transaction.type === "Income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "Income" ? "+" : "-"}৳
                      {transaction.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
