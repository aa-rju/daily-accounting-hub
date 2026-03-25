import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountAPI } from "@/lib/api";
import { Account } from "@shared/api";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Download,
  CreditCard,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const accountTypes = ["Cash", "Bank Account", "Mobile Wallet", "Credit Card"]; 

const emptyForm = {
  name: "",
  type: "Cash" as string,
  balance:"",
  openingBalance: "",
  currency: "BDT",
  status:"",
  notes: "",
};

export default function Accounts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState(emptyForm);

   // ── Real data ─────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountAPI.getAll(1, 100),
  });
  const accounts: Account[] = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: any) => accountAPI.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      setFormData(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      accountAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      setEditingAccount(null);
      setFormData(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });

  //Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingAccount(null);
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.openingBalance) {
      alert("Please fill in all required fields");
      return;
    }
    const payload = {
      name: formData.name,
      type: formData.type,
      openingBalance: parseFloat(formData.openingBalance),
      currency: formData.currency,
      notes: formData.notes,
    };
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      openingBalance: account.balance.toString(),
      balance: account.balance.toString(),
      currency: account.currency,
      status: account.status,
      notes: account.notes ?? "", 
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  // ── Computed stats ────────────────────────────────────────────
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const activeAccounts = accounts.length;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Cash":
        return (
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.16 4.5a.75.75 0 00-.75.75v2.5H4.5a2 2 0 00-2 2v3a2 2 0 002 2h8a2 2 0 002-2v-3a2 2 0 00-2-2h-2.91v-2.5a.75.75 0 00-.75-.75h-1.5zm0 2.5h1.5v2.5H8.16v-2.5zm3.5 3.75a.625.625 0 11-1.25 0 .625.625 0 011.25 0z" />
            </svg>
          </div>
        );
      case "Bank Account":
        return (
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10-1a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
        );
      case "Mobile Wallet":
        return (
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.5 1.5H4a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-14a2 2 0 00-2-2H10.5zm0 2h5.5v4H8.5V3.5h2zm-6 0v4h2V3.5h-2zm6 11h-2v-2h2v2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-red-100 rounded-lg">
            <CreditCard className="w-8 h-8 text-red-600" />
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your financial accounts and balances
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Active Accounts</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{activeAccounts}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              ৳{totalBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editingAccount ? "Edit Account" : "Add New Account"}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleInputChange} placeholder="e.g., Main Cash Box"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Type *
                  </label>
                  <Select value={formData.type} onValueChange={v => handleSelectChange(v, "type")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {accountTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Opening Balance *
                  </label>
                  <input
                    type="number" name="openingBalance" value={formData.openingBalance}
                    onChange={handleInputChange} placeholder="0.00" step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
                  <Select value={formData.currency} onValueChange={v => handleSelectChange(v, "currency")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                <textarea
                  name="notes" value={formData.notes}
                  onChange={handleInputChange} placeholder="Enter account details" rows={2}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {editingAccount ? "Update Account" : "Add Account"}
                </Button>
                <Button type="button" variant="outline"
                  onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No accounts yet. Click "Add Account" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(account => (
              <div key={account.id}
                className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>{getAccountIcon(account.type)}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(account)}
                      className="p-1.5 hover:bg-muted rounded transition-colors">
                      <Edit2 className="w-4 h-4 text-primary" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 hover:bg-muted rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{account.name}"?
                        </AlertDialogDescription>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">{account.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-secondary/70 text-muted-foreground">
                    {account.type}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className={`text-xl font-bold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {account.balance >= 0 ? "+" : ""}
                      {account.currency} {account.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-lg font-bold text-foreground">{account.currency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}