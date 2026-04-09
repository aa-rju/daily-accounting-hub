import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Plus,
  Trash2,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { dailyReportAPI } from "@/lib/api";
import { fmt, fmtShort } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────
interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface FormData {
  date: string;
  openingCashBalance: number;
  bankDeposits: number;
  expenses: ExpenseRow[];
  advancesPaid: number;
  cashReceived: number;
  onlineBankTransfer: number;
  creditSales: number;
}

const EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Utilities",
  "Travel",
  "Salaries",
  "Rent",
  "Maintenance",
  "Marketing",
  "Purchase Payment",
  "Other",
];

const empty = (date: string): FormData => ({
  date,
  openingCashBalance: 0,
  bankDeposits: 0,
  expenses: [],
  advancesPaid: 0,
  cashReceived: 0,
  onlineBankTransfer: 0,
  creditSales: 0,
});

// ─── Number input ─────────────────────────────────────────────
function NumInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={0}
        step="0.01"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────
function SummaryRow({
  label,
  value,
  cls = "",
  bold = false,
}: {
  label: string;
  value: number;
  cls?: string;
  bold?: boolean;
}) {
  return (
    <tr className="border-b border-border">
      <td className={`px-6 py-3 text-sm ${bold ? "font-bold text-base" : "font-medium"} text-foreground`}>
        {label}
      </td>
      <td className={`px-6 py-3 text-sm text-right ${bold ? "font-bold text-base" : "font-semibold"} ${cls}`}>
        {fmt(value)}
      </td>
    </tr>
  );
}

export default function DailyReport() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FormData>(empty(today));
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // ── Load existing report for selected date ────────────────
  const { data: existing, isLoading: loadingReport } = useQuery({
    queryKey: ["daily-report", selectedDate],
    queryFn: () => dailyReportAPI.getByDate(selectedDate),
    retry: false,
  });

  // Populate form when existing report loads
  useEffect(() => {
    if (existing?.data) {
      const r = existing.data;
      setForm({
        date: r.date,
        openingCashBalance: r.openingCashBalance ?? 0,
        bankDeposits: r.bankDeposits ?? 0,
        expenses: Array.isArray(r.expenses) ? r.expenses : [],
        advancesPaid: r.advancesPaid ?? 0,
        cashReceived: r.cashReceived ?? 0,
        onlineBankTransfer: r.onlineBankTransfer ?? 0,
        creditSales: r.creditSales ?? 0,
      });
    } else {
      setForm(empty(selectedDate));
    }
  }, [existing, selectedDate]);

  // ── Save mutation ─────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data: FormData) => dailyReportAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-report", selectedDate] });
      qc.invalidateQueries({ queryKey: ["daily-reports-chart"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("success", "Daily report saved successfully!");
    },
    onError: (e: any) => showToast("error", e.message ?? "Failed to save"),
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Date navigation ───────────────────────────────────────
  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  // ── Field helpers ─────────────────────────────────────────
  function setField(field: keyof Omit<FormData, "expenses" | "date">, value: number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addExpense() {
    setForm((f) => ({
      ...f,
      expenses: [
        ...f.expenses,
        { id: Date.now().toString(), description: "", amount: 0, category: "Other" },
      ],
    }));
  }

  function removeExpense(id: string) {
    setForm((f) => ({ ...f, expenses: f.expenses.filter((e) => e.id !== id) }));
  }

  function updateExpense(id: string, field: keyof ExpenseRow, value: any) {
    setForm((f) => ({
      ...f,
      expenses: f.expenses.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }

  // ── Derived totals (computed client-side for live preview) ─
  const totalExpenses = form.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalIncome =
    form.cashReceived + form.bankDeposits + form.onlineBankTransfer + form.creditSales;
  const closingBalance =
    form.openingCashBalance + totalIncome - totalExpenses - form.advancesPaid;

  const isExistingReport = !!existing?.data;

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Daily Business Report
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Record daily operations — Currency: NPR (रू)
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border text-sm ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.msg}
          </div>
        )}

        {/* Date picker with navigation */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-lg border border-border hover:bg-muted/30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Report Date
              </label>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= today}
              className="p-2 rounded-lg border border-border hover:bg-muted/30 transition disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {loadingReport && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}

            {isExistingReport && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                ✓ Report exists — editing
              </span>
            )}
            {!isExistingReport && !loadingReport && (
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                New report
              </span>
            )}
          </div>
        </div>

        {/* Opening Balance */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">
            Opening Balance
          </h2>
          <div className="max-w-xs">
            <NumInput
              label="Opening Cash Balance"
              value={form.openingCashBalance}
              onChange={(v) => setField("openingCashBalance", v)}
              hint={`= ${fmtShort(form.openingCashBalance)}`}
            />
          </div>
        </div>

        {/* Income Section */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Income</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumInput
              label="Cash Received (from customers)"
              value={form.cashReceived}
              onChange={(v) => setField("cashReceived", v)}
            />
            <NumInput
              label="Bank Deposits"
              value={form.bankDeposits}
              onChange={(v) => setField("bankDeposits", v)}
            />
            <NumInput
              label="Online / Bank Transfer"
              value={form.onlineBankTransfer}
              onChange={(v) => setField("onlineBankTransfer", v)}
            />
            <NumInput
              label="Credit Sales (not yet collected)"
              value={form.creditSales}
              onChange={(v) => setField("creditSales", v)}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-sm font-semibold text-green-700">
              Total Income: {fmtShort(totalIncome)}
            </p>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Expenses</h2>
            <Button
              onClick={addExpense}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>

          {form.expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No expenses added yet. Click "Add Expense" to record one.
            </p>
          ) : (
            <div className="space-y-3">
              {form.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex gap-2 items-start bg-white p-3 rounded-lg border border-border"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={exp.description}
                        onChange={(e) =>
                          updateExpense(exp.id, "description", e.target.value)
                        }
                        placeholder="e.g. Electricity bill"
                        className="w-full px-2 py-1.5 border border-border rounded text-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Category
                      </label>
                      <Select
                        value={exp.category}
                        onValueChange={(v) =>
                          updateExpense(exp.id, "category", v)
                        }
                      >
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Amount (रू)
                      </label>
                      <input
                        type="number"
                        value={exp.amount}
                        min={0}
                        step="0.01"
                        onChange={(e) =>
                          updateExpense(
                            exp.id,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 border border-border rounded text-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeExpense(exp.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition mt-5"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.expenses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-sm font-semibold text-red-700">
                Total Expenses: {fmtShort(totalExpenses)}
              </p>
            </div>
          )}
        </div>

        {/* Other */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">
            Other Outflows
          </h2>
          <div className="max-w-xs">
            <NumInput
              label="Advances Paid"
              value={form.advancesPaid}
              onChange={(v) => setField("advancesPaid", v)}
              hint="Staff advances, petty cash, etc."
            />
          </div>
        </div>

        {/* Live Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Income",
              value: totalIncome,
              cls: "text-green-600",
              bg: "bg-green-50 border-green-100",
            },
            {
              label: "Total Expenses",
              value: totalExpenses,
              cls: "text-red-600",
              bg: "bg-red-50 border-red-100",
            },
            {
              label: "Advances Paid",
              value: form.advancesPaid,
              cls: "text-yellow-600",
              bg: "bg-yellow-50 border-yellow-100",
            },
            {
              label: "Closing Balance",
              value: closingBalance,
              cls: closingBalance >= 0 ? "text-primary" : "text-red-600",
              bg:
                closingBalance >= 0
                  ? "bg-primary/10 border-primary/30"
                  : "bg-red-50 border-red-100",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl p-4 border ${item.bg}`}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className={`text-xl font-bold mt-1 ${item.cls}`}>
                {fmtShort(item.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex gap-3">
          <Button
            onClick={() => saveMutation.mutate({ ...form, date: selectedDate })}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-8"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isExistingReport ? "Update Report" : "Save Report"}
          </Button>
        </div>

        {/* Formal summary table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-base font-bold text-foreground">
              Daily Report Summary — {selectedDate}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <SummaryRow
                  label="Opening Cash Balance"
                  value={form.openingCashBalance}
                />
                <tr className="border-b border-border bg-green-50">
                  <td
                    className="px-6 py-2 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    colSpan={2}
                  >
                    INCOME
                  </td>
                </tr>
                <SummaryRow
                  label="  Cash Received"
                  value={form.cashReceived}
                  cls="text-green-600"
                />
                <SummaryRow
                  label="  Bank Deposits"
                  value={form.bankDeposits}
                  cls="text-green-600"
                />
                <SummaryRow
                  label="  Online Transfer"
                  value={form.onlineBankTransfer}
                  cls="text-green-600"
                />
                <SummaryRow
                  label="  Credit Sales"
                  value={form.creditSales}
                  cls="text-green-600"
                />
                <SummaryRow
                  label="Total Income"
                  value={totalIncome}
                  cls="text-green-700"
                  bold
                />
                <tr className="border-b border-border bg-red-50">
                  <td
                    className="px-6 py-2 text-xs font-semibold text-red-800 uppercase tracking-wider"
                    colSpan={2}
                  >
                    EXPENSES
                  </td>
                </tr>
                {form.expenses.map((exp, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-3 text-sm text-muted-foreground pl-10">
                      {exp.description || `Expense ${i + 1}`} ({exp.category})
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-right text-red-600">
                      ({fmt(exp.amount)})
                    </td>
                  </tr>
                ))}
                <SummaryRow
                  label="Total Expenses"
                  value={totalExpenses}
                  cls="text-red-700"
                  bold
                />
                <SummaryRow
                  label="Advances Paid"
                  value={form.advancesPaid}
                  cls="text-yellow-700"
                />
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 text-lg font-bold text-foreground">
                    CLOSING BALANCE
                  </td>
                  <td
                    className={`px-6 py-4 text-lg font-bold text-right ${
                      closingBalance >= 0 ? "text-primary" : "text-red-700"
                    }`}
                  >
                    {fmt(closingBalance)}
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