import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Download,
  Filter,
  ChevronDown,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: number;
  date: string;
  type: "Income" | "Expense" | "Transfer";
  category: string;
  account: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  status: "completed" | "pending";
}

const mockTransactions: Transaction[] = [
  {
    id: 1,
    date: "2024-03-15",
    type: "Income",
    category: "Sales",
    account: "Bank Account",
    description: "Product Sale - Order #1234",
    amount: 2500,
    paymentMethod: "Bank Transfer",
    reference: "TXN001",
    status: "completed",
  },
  {
    id: 2,
    date: "2024-03-15",
    type: "Expense",
    category: "Office Supplies",
    account: "Cash",
    description: "Stationery Purchase",
    amount: 125,
    paymentMethod: "Cash",
    reference: "TXN002",
    status: "completed",
  },
  {
    id: 3,
    date: "2024-03-14",
    type: "Expense",
    category: "Utilities",
    account: "Bank Account",
    description: "Electricity Bill",
    amount: 450,
    paymentMethod: "Online Transfer",
    reference: "TXN003",
    status: "completed",
  },
  {
    id: 4,
    date: "2024-03-14",
    type: "Income",
    category: "Services",
    account: "Bank Account",
    description: "Consulting Services",
    amount: 1500,
    paymentMethod: "Bank Transfer",
    reference: "TXN004",
    status: "completed",
  },
  {
    id: 5,
    date: "2024-03-13",
    type: "Expense",
    category: "Travel",
    account: "Cash",
    description: "Client Meeting - Transport",
    amount: 85,
    paymentMethod: "Cash",
    reference: "TXN005",
    status: "completed",
  },
  {
    id: 6,
    date: "2024-03-13",
    type: "Transfer",
    category: "Transfer",
    account: "Cash to Bank",
    description: "Cash deposit to bank",
    amount: 1000,
    paymentMethod: "Deposit",
    reference: "TXN006",
    status: "completed",
  },
  {
    id: 7,
    date: "2024-03-12",
    type: "Income",
    category: "Investment",
    account: "Bank Account",
    description: "Investment Return",
    amount: 500,
    paymentMethod: "Bank Transfer",
    reference: "TXN007",
    status: "pending",
  },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Income" as "Income" | "Expense" | "Transfer",
    category: "",
    account: "",
    description: "",
    amount: "",
    paymentMethod: "",
    reference: "",
  });

  const categories = ["Sales", "Services", "Investment", "Office Supplies", "Utilities", "Travel", "Other"];
  const accounts = ["Cash", "Bank Account", "Mobile Wallet", "Credit Card"];
  const paymentMethods = ["Cash", "Bank Transfer", "Online Transfer", "Check", "Card", "Mobile Payment"];

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    const matchesAccount = filterAccount === "all" || t.account === filterAccount;

    return matchesSearch && matchesType && matchesCategory && matchesAccount;
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field?: string
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [field || name]: value,
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.account || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    const newTransaction: Transaction = {
      id: Math.max(...transactions.map((t) => t.id), 0) + 1,
      date: formData.date,
      type: formData.type,
      category: formData.category,
      account: formData.account,
      description: formData.description,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      status: "completed",
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "Income",
      category: "",
      account: "",
      description: "",
      amount: "",
      paymentMethod: "",
      reference: "",
    });
    setShowForm(false);
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              Manage your daily financial transactions and records
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Add Transaction Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Add New Transaction</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Type *
                  </label>
                  <Select value={formData.type} onValueChange={(v) => handleSelectChange(v, "type")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category *
                  </label>
                  <Select value={formData.category} onValueChange={(v) => handleSelectChange(v, "category")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Account *
                  </label>
                  <Select value={formData.account} onValueChange={(v) => handleSelectChange(v, "account")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc} value={acc}>
                          {acc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter transaction description"
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Payment Method
                  </label>
                  <Select value={formData.paymentMethod} onValueChange={(v) => handleSelectChange(v, "paymentMethod")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="e.g., TXN001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Save Transaction
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by description or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Filter Type */}
            <div className="w-full md:w-40">
              <label className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Category */}
            <div className="w-full md:w-40">
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Account */}
            <div className="w-full md:w-40">
              <label className="block text-sm font-medium text-foreground mb-2">
                Account
              </label>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc} value={acc}>
                      {acc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.type === "Income"
                              ? "bg-green-100 text-green-700"
                              : transaction.type === "Expense"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {transaction.account}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {transaction.reference}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-semibold text-right ${
                          transaction.type === "Income"
                            ? "text-green-600"
                            : transaction.type === "Expense"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {transaction.type === "Expense" || transaction.type === "Income"
                          ? transaction.type === "Income"
                            ? "+"
                            : "-"
                          : ""}
                        ৳{transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 hover:bg-muted rounded transition-colors">
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">No transactions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 bg-muted/20 border-t border-border">
              <div className="flex justify-end gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">Total Income</p>
                  <p className="text-lg font-bold text-green-600">
                    ৳
                    {filteredTransactions
                      .filter((t) => t.type === "Income")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Expense</p>
                  <p className="text-lg font-bold text-red-600">
                    ৳
                    {filteredTransactions
                      .filter((t) => t.type === "Expense")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net</p>
                  <p className="text-lg font-bold text-primary">
                    ৳
                    {(
                      filteredTransactions
                        .filter((t) => t.type === "Income")
                        .reduce((sum, t) => sum + t.amount, 0) -
                      filteredTransactions
                        .filter((t) => t.type === "Expense")
                        .reduce((sum, t) => sum + t.amount, 0)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
