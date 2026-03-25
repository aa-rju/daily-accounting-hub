import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesAPI, partyAPI, productAPI } from "@/lib/api";
import { Invoice } from "@shared/api";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, X, Download, Search } from "lucide-react";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

const paymentMethods = ["Cash", "Bank Transfer", "Cheque", "Card", "Mobile Payment"];

const emptyForm = {
  billNumber: "",
  partyId: "",
  partyName: "",
  date: new Date().toISOString().split("T")[0],
  items: [] as any[],
  paymentMethod: "Bank Transfer",
  taxPercentage: 15,
};

export default function Sales() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState(emptyForm);

  // ── Real data ─────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => salesAPI.getAll(1, 100),
  });
  const invoices: Invoice[] = data?.data ?? [];

  // Fetch real parties and products for the form dropdowns
  const { data: partiesData } = useQuery({
    queryKey: ["parties"],
    queryFn: () => partyAPI.getAll(1, 100),
  });
  const parties = partiesData?.data ?? [];

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => productAPI.getAll(1, 100),
  });
  const products = productsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => salesAPI.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setShowForm(false);
      setFormData(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      salesAPI.update(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartyChange = (partyId: string) => {
    const party = parties.find((p: any) => p.id === partyId);
    setFormData(prev => ({
      ...prev,
      partyId,
      partyName: party?.name ?? "",
    }));
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now().toString(),
        productId: "",
        productName: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      }],
    }));
  };

  const removeItemRow = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  const updateItemRow = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "productId") {
          const product = products.find((p: any) => p.id === value);
          updated.productName = product?.name ?? "";
          updated.rate = product?.price ?? 0;
          updated.amount = updated.quantity * updated.rate;
        }
        if (field === "quantity" || field === "rate") {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }),
    }));
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = (subtotal * formData.taxPercentage) / 100;
  const total = subtotal + tax;

  const resetForm = () => setFormData(emptyForm);

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billNumber || !formData.partyId || formData.items.length === 0) {
      alert("Please fill all required fields and add at least one item");
      return;
    }
    createMutation.mutate({
      billNumber: formData.billNumber,
      partyId: formData.partyId,
      partyName: formData.partyName,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      taxPercentage: formData.taxPercentage,
      items: formData.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        rate: i.rate,
        amount: i.amount,
      })),
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, status });
  };

  // ── Filtered list ─────────────────────────────────────────────
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales & Invoices</h1>
            <p className="text-muted-foreground mt-1">Create and manage customer invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </Button>
          </div>
        </div>

        {/* Create Invoice Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create New Invoice</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
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
                    type="text" name="billNumber" value={formData.billNumber}
                    onChange={handleInputChange} placeholder="INV-001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Party *
                  </label>
                  <Select value={formData.partyId} onValueChange={handlePartyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                    <SelectContent>
                      {parties.map((party: any) => (
                        <SelectItem key={party.id} value={party.id}>
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
                    type="date" name="date" value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">Invoice Items</h3>
                  <Button type="button" onClick={addItemRow} size="sm"
                    className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Item
                  </Button>
                </div>

                {formData.items.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.items.map(item => (
                      <div key={item.id}
                        className="flex gap-2 items-start bg-muted/20 p-3 rounded border border-border">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Product
                            </label>
                            <Select value={item.productId}
                              onValueChange={v => updateItemRow(item.id, "productId", v)}>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p: any) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Qty</label>
                            <input type="number" value={item.quantity}
                              onChange={e => updateItemRow(item.id, "quantity", parseInt(e.target.value) || 0)}
                              min="1"
                              className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Rate</label>
                            <input type="number" value={item.rate}
                              onChange={e => updateItemRow(item.id, "rate", parseFloat(e.target.value) || 0)}
                              step="0.01"
                              className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                            <div className="px-2 py-1 bg-white rounded border border-border text-sm font-medium">
                              ৳{item.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeItemRow(item.id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors mt-6">
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
                    <input type="number" name="taxPercentage"
                      value={formData.taxPercentage} onChange={handleInputChange}
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
                  <Select value={formData.paymentMethod}
                    onValueChange={v => handleSelectChange(v, "paymentMethod")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary hover:bg-primary/90">
                  {createMutation.isPending ? "Saving..." : "Save Invoice"}
                </Button>
                <Button type="button" variant="outline"
                  onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by bill number or party name..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
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
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Bill #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map(invoice => (
                      <tr key={invoice.id}
                        className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {invoice.billNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{invoice.partyName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{invoice.date}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {invoice.items.length}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right">
                          ৳{invoice.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Select value={invoice.status}
                            onValueChange={v => handleStatusChange(invoice.id, v)}>
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <p className="text-muted-foreground">
                          {searchTerm || filterStatus !== "all"
                            ? "No invoices match your search"
                            : "No invoices yet. Click \"Create Invoice\" to get started."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}