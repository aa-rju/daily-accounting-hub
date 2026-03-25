import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Download, Printer, Calendar } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for different reports
const monthlyData = [
  { month: "Jan", income: 45000, expense: 28000 },
  { month: "Feb", income: 52000, expense: 31000 },
  { month: "Mar", income: 48000, expense: 29500 },
  { month: "Apr", income: 61000, expense: 35000 },
  { month: "May", income: 55000, expense: 32000 },
  { month: "Jun", income: 67000, expense: 38000 },
];

const incomeCategories = [
  { name: "Sales", value: 180000 },
  { name: "Services", value: 95000 },
  { name: "Investment", value: 45000 },
  { name: "Other", value: 15000 },
];

const expenseCategories = [
  { name: "Salary", value: 85000 },
  { name: "Utilities", value: 28000 },
  { name: "Office Supplies", value: 15000 },
  { name: "Travel", value: 22000 },
  { name: "Other", value: 20000 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const reportTypes = [
  { id: "overview", label: "Cash Flow Overview" },
  { id: "income", label: "Income Report" },
  { id: "expense", label: "Expense Report" },
  { id: "profitloss", label: "Profit & Loss" },
  { id: "transactions", label: "Transaction History" },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-06-30");

  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = monthlyData.reduce((sum, d) => sum + d.expense, 0);
  const netProfit = totalIncome - totalExpense;

  const renderReport = () => {
    switch (selectedReport) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                <p className="text-sm text-muted-foreground font-medium">Total Income</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  ৳{totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                <p className="text-sm text-muted-foreground font-medium">Total Expense</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  ৳{totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <p className="text-sm text-muted-foreground font-medium">Net Profit</p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    netProfit >= 0 ? "text-blue-700" : "text-red-700"
                  }`}
                >
                  {netProfit >= 0 ? "+" : "-"}৳{Math.abs(netProfit).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Monthly Cash Flow
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "income":
        return (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-6">
              <p className="text-sm text-muted-foreground font-medium">Total Income</p>
              <p className="text-3xl font-bold text-green-700 mt-2">
                ৳{totalIncome.toLocaleString()}
              </p>
            </div>

            {/* Income by Category */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Income by Category
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `৳${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category Breakdown Table */}
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">
                          Category
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeCategories.map((category, index) => (
                        <tr key={index} className="border-b border-border">
                          <td className="px-4 py-3 text-foreground font-medium">
                            {category.name}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-semibold">
                            ৳{category.value.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {(
                              (category.value / totalIncome) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case "expense":
        return (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-6">
              <p className="text-sm text-muted-foreground font-medium">Total Expense</p>
              <p className="text-3xl font-bold text-red-700 mt-2">
                ৳{totalExpense.toLocaleString()}
              </p>
            </div>

            {/* Expense by Category */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Expense by Category
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `৳${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category Breakdown Table */}
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">
                          Category
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-muted-foreground">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseCategories.map((category, index) => (
                        <tr key={index} className="border-b border-border">
                          <td className="px-4 py-3 text-foreground font-medium">
                            {category.name}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-semibold">
                            ৳{category.value.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {(
                              (category.value / totalExpense) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case "profitloss":
        return (
          <div className="space-y-6">
            {/* P&L Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                <p className="text-sm text-muted-foreground font-medium">Gross Income</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  ৳{totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                <p className="text-sm text-muted-foreground font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  ৳{totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <p className="text-sm text-muted-foreground font-medium">Net Profit</p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    netProfit >= 0 ? "text-blue-700" : "text-red-700"
                  }`}
                >
                  ৳{netProfit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* P&L Statement */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Profit & Loss Statement
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border bg-green-50">
                    <td className="px-6 py-3 font-semibold text-foreground">
                      INCOME
                    </td>
                    <td className="px-6 py-3 text-right"></td>
                  </tr>
                  {incomeCategories.map((category, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="px-6 py-3 pl-12 text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-3 text-right text-green-600 font-semibold">
                        ৳{category.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b-2 border-border bg-green-100">
                    <td className="px-6 py-3 font-bold text-foreground">
                      Total Income
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-green-700">
                      ৳{totalIncome.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="border-b border-border bg-red-50 mt-4">
                    <td className="px-6 py-3 font-semibold text-foreground">
                      EXPENSES
                    </td>
                    <td className="px-6 py-3 text-right"></td>
                  </tr>
                  {expenseCategories.map((category, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="px-6 py-3 pl-12 text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-3 text-right text-red-600 font-semibold">
                        ৳{category.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b-2 border-border bg-red-100">
                    <td className="px-6 py-3 font-bold text-foreground">
                      Total Expenses
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-red-700">
                      ৳{totalExpense.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="bg-blue-50">
                    <td className="px-6 py-3 font-bold text-lg text-foreground">
                      NET PROFIT/LOSS
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-bold text-lg ${
                        netProfit >= 0 ? "text-blue-700" : "text-red-700"
                      }`}
                    >
                      ৳{netProfit.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "transactions":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Transaction History
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: "2024-06-30", type: "Income", category: "Sales", desc: "Product Sale", amount: 2500 },
                    { date: "2024-06-29", type: "Expense", category: "Office Supplies", desc: "Stationery", amount: 125 },
                    { date: "2024-06-29", type: "Income", category: "Services", desc: "Consulting", amount: 1500 },
                    { date: "2024-06-28", type: "Expense", category: "Utilities", desc: "Electricity Bill", amount: 450 },
                    { date: "2024-06-28", type: "Income", category: "Sales", desc: "Product Sale", amount: 3200 },
                  ].map((tx, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/20">
                      <td className="px-6 py-4 text-muted-foreground">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tx.type === "Income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground">{tx.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">{tx.desc}</td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          tx.type === "Income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "Income" ? "+" : "-"}৳{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Financial reports and analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Report Type
              </label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Period
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            {dateRange === "custom" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-input text-sm"
                />
              </div>
            )}

            {/* End Date */}
            {dateRange === "custom" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-input text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Report Content */}
        {renderReport()}
      </div>
    </MainLayout>
  );
}
