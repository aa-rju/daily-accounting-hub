import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface DailyReportData {
  date: string;
  openingCashBalance: number;
  bankDeposits: number;
  expenses: ExpenseRow[];
  advancesPaid: number;
  cashReceived: number;
  onlineBankTransfer: number;
  creditSales: number;
}

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Travel",
  "Salaries",
  "Rent",
  "Maintenance",
  "Marketing",
  "Other",
];

export default function DailyReport() {
  const [formData, setFormData] = useState<DailyReportData>({
    date: new Date().toISOString().split("T")[0],
    openingCashBalance: 0,
    bankDeposits: 0,
    expenses: [],
    advancesPaid: 0,
    cashReceived: 0,
    onlineBankTransfer: 0,
    creditSales: 0,
  });

  const [saved, setSaved] = useState(false);

  // Calculate totals
  const totalExpenses = formData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome =
    formData.cashReceived +
    formData.bankDeposits +
    formData.onlineBankTransfer;
  const closingBalance =
    formData.openingCashBalance +
    totalIncome -
    totalExpenses -
    formData.advancesPaid;

  const handleInputChange = (field: keyof Omit<DailyReportData, "expenses">, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addExpenseRow = () => {
    const newExpense: ExpenseRow = {
      id: Date.now().toString(),
      description: "",
      amount: 0,
      category: "Other",
    };
    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }));
  };

  const removeExpenseRow = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((exp) => exp.id !== id),
    }));
  };

  const updateExpenseRow = (id: string, field: keyof ExpenseRow, value: any) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const handleSave = () => {
    console.log("Saving daily report:", formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Business Report</h1>
            <p className="text-muted-foreground mt-1">
              Record daily operations and financial summary
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-sm text-green-700">Daily report saved successfully!</p>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Opening Balance Section */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Opening Balance</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Opening Cash Balance
              </label>
              <input
                type="number"
                value={formData.openingCashBalance}
                onChange={(e) =>
                  handleInputChange("openingCashBalance", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                step="0.01"
                className="w-full md:w-64 px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ৳{formData.openingCashBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Income Section */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Income</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cash Received
                </label>
                <input
                  type="number"
                  value={formData.cashReceived}
                  onChange={(e) =>
                    handleInputChange("cashReceived", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bank Deposits
                </label>
                <input
                  type="number"
                  value={formData.bankDeposits}
                  onChange={(e) =>
                    handleInputChange("bankDeposits", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Online Bank Transfer
                </label>
                <input
                  type="number"
                  value={formData.onlineBankTransfer}
                  onChange={(e) =>
                    handleInputChange("onlineBankTransfer", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Credit Sales (Not Collected)
                </label>
                <input
                  type="number"
                  value={formData.creditSales}
                  onChange={(e) =>
                    handleInputChange("creditSales", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Expenses</h2>
              <Button
                onClick={addExpenseRow}
                size="sm"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>

            {formData.expenses.length > 0 ? (
              <div className="space-y-3">
                {formData.expenses.map((expense) => (
                  <div key={expense.id} className="flex gap-2 items-start bg-white p-3 rounded border border-border">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={expense.description}
                            onChange={(e) =>
                              updateExpenseRow(expense.id, "description", e.target.value)
                            }
                            placeholder="Expense description"
                            className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Category
                          </label>
                          <Select
                            value={expense.category}
                            onValueChange={(value) =>
                              updateExpenseRow(expense.id, "category", value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {expenseCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) =>
                              updateExpenseRow(expense.id, "amount", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                            step="0.01"
                            className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExpenseRow(expense.id)}
                      className="p-2 hover:bg-red-100 rounded transition-colors mt-7"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expenses added. Click "Add Expense" to add one.
              </p>
            )}
          </div>

          {/* Other Transactions */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Other Transactions</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Advances Paid
              </label>
              <input
                type="number"
                value={formData.advancesPaid}
                onChange={(e) =>
                  handleInputChange("advancesPaid", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                step="0.01"
                className="w-full md:w-64 px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ৳{totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ৳{totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground font-medium">Advances Paid</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                ৳{formData.advancesPaid.toLocaleString()}
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
              <p className="text-xs font-medium text-primary">Closing Balance</p>
              <p className={`text-2xl font-bold mt-1 ${closingBalance >= 0 ? "text-primary" : "text-red-600"}`}>
                ৳{closingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              Save Daily Report
            </Button>
          </div>
        </div>

        {/* Summary Table for Reference */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Report Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">
                    Opening Cash Balance
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-right">
                    ৳{formData.openingCashBalance.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border bg-green-50">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">
                    Total Income
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-right text-green-600">
                    ৳{totalIncome.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border bg-red-50">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">
                    Total Expenses
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-right text-red-600">
                    (৳{totalExpenses.toLocaleString()})
                  </td>
                </tr>
                <tr className="border-b border-border bg-yellow-50">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">
                    Advances Paid
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-right text-yellow-600">
                    (৳{formData.advancesPaid.toLocaleString()})
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="px-6 py-3 text-lg font-bold text-foreground">
                    Closing Balance
                  </td>
                  <td className={`px-6 py-3 text-lg font-bold text-right ${closingBalance >= 0 ? "text-primary" : "text-red-600"}`}>
                    ৳{closingBalance.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
