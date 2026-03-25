import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Eye,
  X,
  Download,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  billNumber: string;
  partyName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: "draft" | "sent" | "paid";
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    billNumber: "INV-001",
    partyName: "ABC Corporation",
    date: "2024-03-15",
    items: [
      {
        id: "1",
        productName: "Cement Bag 50kg",
        quantity: 100,
        rate: 450,
        amount: 45000,
      },
    ],
    subtotal: 45000,
    tax: 6750,
    total: 51750,
    paymentMethod: "Bank Transfer",
    status: "paid",
  },
];

const paymentMethods = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Card",
  "Mobile Payment",
];
const products = [
  { id: "1", name: "Cement Bag 50kg", price: 450 },
  { id: "2", name: "Steel Rod 12mm", price: 75 },
  { id: "3", name: "Bricks", price: 8 },
  { id: "4", name: "Sand (Ton)", price: 2000 },
];
const parties = [
  { id: "1", name: "ABC Corporation" },
  { id: "2", name: "XYZ Traders" },
];

export default function Sales() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    billNumber: "",
    partyName: "",
    date: new Date().toISOString().split("T")[0],
    items: [] as InvoiceItem[],
    paymentMethod: "Bank Transfer",
    taxPercentage: 15,
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
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

  const addItemRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItemRow = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItemRow = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            updated.amount = updated.quantity * updated.rate;
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = (subtotal * formData.taxPercentage) / 100;
  const total = subtotal + tax;

  const resetForm = () => {
    setFormData({
      billNumber: "",
      partyName: "",
      date: new Date().toISOString().split("T")[0],
      items: [],
      paymentMethod: "Bank Transfer",
      taxPercentage: 15,
    });
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billNumber || !formData.partyName || formData.items.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      billNumber: formData.billNumber,
      partyName: formData.partyName,
      date: formData.date,
      items: formData.items,
      subtotal,
      tax,
      total,
      paymentMethod: formData.paymentMethod,
      status: "draft",
    };

    setInvoices([newInvoice, ...invoices]);
    resetForm();
    setShowForm(false);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales & Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage customer invoices
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Create Invoice Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create New Invoice</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bill Number *
                  </label>
                  <input
                    type="text"
                    name="billNumber"
                    value={formData.billNumber}
                    onChange={handleInputChange}
                    placeholder="INV-001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Party Name *
                  </label>
                  <Select value={formData.partyName} onValueChange={(v) => handleSelectChange(v, "partyName")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                    <SelectContent>
                      {parties.map((party) => (
                        <SelectItem key={party.id} value={party.name}>
                          {party.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange(e, "date")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">Invoice Items</h3>
                  <Button
                    type="button"
                    onClick={addItemRow}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>

                {formData.items.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-2 items-start bg-muted/20 p-3 rounded border border-border"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Product
                            </label>
                            <Select
                              value={item.productName}
                              onValueChange={(v) =>
                                updateItemRow(item.id, "productName", v)
                              }
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.name}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemRow(item.id, "quantity", parseInt(e.target.value) || 0)
                              }
                              min="1"
                              className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Rate
                            </label>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                updateItemRow(item.id, "rate", parseFloat(e.target.value) || 0)
                              }
                              step="0.01"
                              className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Amount
                            </label>
                            <div className="px-2 py-1 bg-white rounded border border-border text-sm font-medium">
                              ৳{item.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors mt-6"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items added. Click "Add Item" to add products.
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tax:</span>
                    <input
                      type="number"
                      value={formData.taxPercentage}
                      onChange={(e) =>
                        handleInputChange(
                          e as any,
                          "taxPercentage"
                        ) || handleSelectChange(e.target.value, "taxPercentage")
                      }
                      className="w-16 px-2 py-1 border border-border rounded text-sm"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-semibold">৳{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">৳{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Method
                  </label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => handleSelectChange(v, "paymentMethod")}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  Save Invoice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by bill number or party name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Party
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {invoice.billNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {invoice.partyName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {invoice.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {invoice.items.length}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right">
                        ৳{invoice.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : invoice.status === "sent"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {invoice.status === "paid"
                            ? "Paid"
                            : invoice.status === "sent"
                              ? "Sent"
                              : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-1.5 hover:bg-muted rounded transition-colors">
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">No invoices found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
