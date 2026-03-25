import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, X, Download } from "lucide-react";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { partyAPI } from "@/lib/api";
import { Party } from "@shared/api";

const emptyForm = {
  name: "", phone: "", address: "",
  type: "customer" as "customer" | "supplier" | "both",
  openingBalance: 0,
};

export default function Parties() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ── Fetch parties from real API ──────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["parties", filter],
    queryFn: () => partyAPI.getAll(1, 50, filter === "all" ? undefined : filter),
  });

  const parties = data?.data ?? [];

  // ── Create ───────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (newParty: typeof emptyForm) => partyAPI.create(newParty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  // ── Update ───────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyForm }) =>
      partyAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setEditingParty(null);
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  // ── Delete ───────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => partyAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parties"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParty) {
      updateMutation.mutate({ id: editingParty.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setForm({
      name: party.name,
      phone: party.phone,
      address: party.address,
      type: party.type,
      openingBalance: party.openingBalance,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingParty(null);
    setForm(emptyForm);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Parties</h1>
            <p className="text-muted-foreground">Manage customers and suppliers</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button size="sm" onClick={() => { setEditingParty(null); setForm(emptyForm); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Party
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="supplier">Suppliers</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                {editingParty ? "Edit Party" : "Add New Party"}
              </h2>
              <button onClick={handleCancel}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">Address</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Opening Balance</label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.openingBalance}
                  onChange={e => setForm(p => ({ ...p, openingBalance: Number(e.target.value) }))}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingParty ? "Update Party" : "Create Party"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Failed to load parties</div>
          ) : parties.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No parties yet. Click "Add Party" to create one.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Balance</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party) => (
                  <tr key={party.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{party.name}</td>
                    <td className="p-4 text-muted-foreground">{party.phone || "—"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        party.type === "customer" ? "bg-blue-100 text-blue-700" :
                        party.type === "supplier" ? "bg-purple-100 text-purple-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {party.type}
                      </span>
                    </td>
                    <td className={`p-4 font-medium ${party.openingBalance >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {party.openingBalance >= 0 ? "+" : ""}
                      {party.openingBalance.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(party)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete {party.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This cannot be undone. All ledger entries for this party will remain.
                            </AlertDialogDescription>
                            <div className="flex justify-end gap-3 mt-4">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(party.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}