import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  X,
  Download,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryRecord {
  id: string;
  productName: string;
  date: string;
  openingStock: number;
  production: number;
  sales: number;
  closingStock: number;
  reorderLevel: number;
}

const mockInventory: InventoryRecord[] = [
  {
    id: "1",
    productName: "Cement Bag 50kg",
    date: "2024-03-15",
    openingStock: 500,
    production: 200,
    sales: 150,
    closingStock: 550,
    reorderLevel: 100,
  },
  {
    id: "2",
    productName: "Steel Rod 12mm",
    date: "2024-03-15",
    openingStock: 1000,
    production: 0,
    sales: 200,
    closingStock: 800,
    reorderLevel: 200,
  },
];

const products = [
  { name: "Cement Bag 50kg", reorderLevel: 100 },
  { name: "Steel Rod 12mm", reorderLevel: 200 },
  { name: "Bricks", reorderLevel: 500 },
  { name: "Sand (Ton)", reorderLevel: 50 },
];

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>(mockInventory);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [formData, setFormData] = useState({
    productName: "",
    date: new Date().toISOString().split("T")[0],
    openingStock: "",
    production: "0",
    sales: "0",
    reorderLevel: "100",
  });

  const filteredInventory = inventory.filter((record) => {
    const matchesSearch = record.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || record.date === filterDate;
    return matchesSearch && matchesDate;
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

  const resetForm = () => {
    setFormData({
      productName: "",
      date: new Date().toISOString().split("T")[0],
      openingStock: "",
      production: "0",
      sales: "0",
      reorderLevel: "100",
    });
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.openingStock) {
      alert("Product and opening stock are required");
      return;
    }

    const opening = parseFloat(formData.openingStock);
    const production = parseFloat(formData.production) || 0;
    const sales = parseFloat(formData.sales) || 0;
    const closing = opening + production - sales;

    const newRecord: InventoryRecord = {
      id: Date.now().toString(),
      productName: formData.productName,
      date: formData.date,
      openingStock: opening,
      production,
      sales,
      closingStock: closing,
      reorderLevel: parseFloat(formData.reorderLevel) || 100,
    };

    setInventory([newRecord, ...inventory]);
    resetForm();
    setShowForm(false);
  };

  const handleDeleteRecord = (id: string) => {
    setInventory(inventory.filter((r) => r.id !== id));
  };

  // Calculate totals
  const totalClosingStock = filteredInventory.reduce(
    (sum, r) => sum + r.closingStock,
    0
  );
  const totalProduction = filteredInventory.reduce(
    (sum, r) => sum + r.production,
    0
  );
  const totalSales = filteredInventory.reduce((sum, r) => sum + r.sales, 0);
  const lowStockItems = filteredInventory.filter(
    (r) => r.closingStock <= r.reorderLevel
  );

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track stock movements and levels
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
              Add Record
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">
              Total Stock
            </p>
            <p className="text-3xl font-bold text-blue-700 mt-2">
              {totalClosingStock.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {filteredInventory.length} products
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Production</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {totalProduction.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Total added</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Sales</p>
            <p className="text-3xl font-bold text-red-700 mt-2">
              {totalSales.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Total sold</p>
          </div>
          <div
            className={`${
              lowStockItems.length > 0
                ? "bg-orange-50 border border-orange-100"
                : "bg-green-50 border border-green-100"
            } rounded-lg p-6`}
          >
            <p className="text-sm text-muted-foreground font-medium">Low Stock Alert</p>
            <p
              className={`text-3xl font-bold mt-2 ${
                lowStockItems.length > 0
                  ? "text-orange-700"
                  : "text-green-700"
              }`}
            >
              {lowStockItems.length}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {lowStockItems.length > 0 ? "Need reorder" : "All good"}
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        {lowStockItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex gap-4">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Low Stock Alert</p>
              <p className="text-sm text-orange-800 mt-1">
                The following items are below reorder level:
              </p>
              <div className="mt-2 space-y-1">
                {lowStockItems.map((item) => (
                  <p key={item.id} className="text-sm text-orange-700">
                    • {item.productName}: {item.closingStock} units (Reorder at: {item.reorderLevel})
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Record Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                Add Inventory Record
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

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Product *
                  </label>
                  <Select
                    value={formData.productName}
                    onValueChange={(v) => handleSelectChange(v, "productName")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.name} value={product.name}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange(e, "date")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-foreground mb-3">Stock Movements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Opening Stock *
                    </label>
                    <input
                      type="number"
                      name="openingStock"
                      value={formData.openingStock}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="1"
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Production/Addition
                    </label>
                    <input
                      type="number"
                      name="production"
                      value={formData.production}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="1"
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sales/Reduction
                    </label>
                    <input
                      type="number"
                      name="sales"
                      value={formData.sales}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="1"
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Closing Stock Calculation */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Closing Stock</p>
                    <p className="text-lg font-bold text-green-700 mt-1">
                      {(
                        (parseFloat(formData.openingStock) || 0) +
                        (parseFloat(formData.production) || 0) -
                        (parseFloat(formData.sales) || 0)
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formula: Opening + Production - Sales
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  placeholder="100"
                  step="1"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when stock falls below this level
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Save Record
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
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full md:w-40 px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Opening
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    +Production
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    -Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Closing
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
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {record.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                        {record.openingStock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                        +{record.production.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                        -{record.sales.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-primary">
                        {record.closingStock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.closingStock <= record.reorderLevel
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {record.closingStock <= record.reorderLevel
                            ? "Low Stock"
                            : "Adequate"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">No inventory records found</p>
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
