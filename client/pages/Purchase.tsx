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
  TrendingDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseItem {
  id: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: "draft" | "received" | "paid";
}

const mockPurchases: Purchase[] = [];

const paymentMethods = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Card",
  "Credit",
];
const products = [
  { id: "1", name: "Cement Bag 50kg", price: 420 },
  { id: "2", name: "Steel Rod 12mm", price: 70 },
  { id: "3", name: "Bricks", price: 7 },
  { id: "4", name: "Sand (Ton)", price: 1800 },
];
const suppliers = [
  { id: "1", name: "XYZ Traders" },
  { id: "2", name: "Material Supplies Co" },
];

export default function Purchase() {
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    purchaseNumber: "",
    supplierName: "",
    date: new Date().toISOString().split("T")[0],
    items: [] as PurchaseItem[],
    paymentMethod: "Bank Transfer",
    taxPercentage: 15,
  });

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
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
    const newItem: PurchaseItem = {
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

  const updateItemRow = (id: string, field: keyof PurchaseItem, value: any) => {
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
      purchaseNumber: "",
      supplierName: "",
      date: new Date().toISOString().split("T")[0],
      items: [],
      paymentMethod: "Bank Transfer",
      taxPercentage: 15,
    });
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.purchaseNumber ||
      !formData.supplierName ||
      formData.items.length === 0
    ) {
      alert("Please fill all required fields");
      return;
    }

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      purchaseNumber: formData.purchaseNumber,
      supplierName: formData.supplierName,
      date: formData.date,
      items: formData.items,
      subtotal,
      tax,
      total,
      paymentMethod: formData.paymentMethod,
      status: "draft",
    };

    setPurchases([newPurchase, ...purchases]);
    resetForm();
    setShowForm(false);
  };

  const totalPurchaseValue = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPending = purchases
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.total, 0);

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Purchase Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Record and manage supplier purchases
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
              Create Purchase
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Total Purchases</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">
              ৳{totalPurchaseValue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{purchases.length} purchases</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Pending Payment</p>
            <p className="text-3xl font-bold text-yellow-700 mt-2">
              ৳{totalPending.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {purchases.filter((p) => p.status !== "paid").length} pending
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Paid Amount</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              ৳
              {purchases
                .filter((p) => p.status === "paid")
                .reduce((sum, p) => sum + p.total, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* Create Purchase Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                Create New Purchase Order
              </h2>
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

            <form onSubmit={handleSavePurchase} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    PO Number *
                  </label>
                  <input
                    type="text"
                    name="purchaseNumber"
                    value={formData.purchaseNumber}
                    onChange={handleInputChange}
                    placeholder="PUR-001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Supplier *
                  </label>
                  <Select
                    value={formData.supplierName}
                    onValueChange={(v) => handleSelectChange(v, "supplierName")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    PO Date
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
                  <h3 className="font-bold text-foreground">Purchase Items</h3>
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
                                  <SelectItem
                                    key={product.id}
                                    value={product.name}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemRow(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 0
                                )
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
                                updateItemRow(
                                  item.id,
                                  "rate",
                                  parseFloat(e.target.value) || 0
                                )
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
                    <span className="text-muted-foreground">Tax (GST):</span>
                    <input
                      type="number"
                      value={formData.taxPercentage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          taxPercentage: parseFloat(e.target.value) || 0,
                        }))
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
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Save Purchase Order
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
                  placeholder="Search by PO number or supplier..."
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
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    PO #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Supplier
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
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {purchase.purchaseNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {purchase.supplierName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {purchase.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {purchase.items.length}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right">
                        ৳{purchase.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            purchase.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : purchase.status === "received"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {purchase.status === "paid"
                            ? "Paid"
                            : purchase.status === "received"
                              ? "Received"
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
                      <p className="text-muted-foreground">No purchases found</p>
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
