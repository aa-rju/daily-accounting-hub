/**
 * client/pages/Settings.tsx
 * Reads and writes settings from /api/settings (DB-backed, per org).
 * Shows the logged-in user's org name, plan, and all accounting preferences.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Save, Moon, Sun, Lock, LogOut,
  Bell, User, Building2, Receipt,
  CheckCircle, AlertCircle, Loader2,
  Shield, BadgeCheck,
} from "lucide-react";
import { settingsAPI, authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// ─── Small reusable components ────────────────────────────────

function Field({
  label, name, type = "text", value, onChange, placeholder, disabled, hint,
}: {
  label: string; name: string; type?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                   disabled:opacity-50 disabled:cursor-not-allowed transition"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function NumField({
  label, name, value, onChange, min = 0, step = 1, hint,
}: {
  label: string; name: string; value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type="number" name={name} value={value} min={min} step={step}
        onChange={onChange}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-5">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({
  label, desc, checked, onChange,
}: { label: string; desc?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <div
        onClick={onChange}
        className={`relative mt-0.5 w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0
          ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
          transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </label>
  );
}

function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm animate-in slide-in-from-top-2
      ${type === "success"
        ? "bg-green-50 border-green-200 text-green-800"
        : "bg-red-50 border-red-200 text-red-800"}`}>
      {type === "success"
        ? <CheckCircle className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // ── Business profile form ──────────────────────────────────
  const [profile, setProfile] = useState({
    orgName: "", orgPhone: "", orgEmail: "", orgAddress: "",
  });

  // ── Accounting settings form ───────────────────────────────
  const [accounting, setAccounting] = useState({
    invoicePrefix: "INV",
    purchasePrefix: "PUR",
    defaultTaxRate: 13,
    currency: "NPR",
    lowStockThreshold: 10,
    fiscalYearStart: "07-16",
  });

  // ── Feature toggles ───────────────────────────────────────
  const [toggles, setToggles] = useState({
    enableStock: true,
    enableLedger: true,
    pushNotifications: true,
    emailNotifications: false,
  });

  // ── User info ─────────────────────────────────────────────
  const [userInfo, setUserInfo] = useState({ name: "", email: "", orgId: "", plan: "free" });

  // ── Fetch settings from DB ────────────────────────────────
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsAPI.get,
  });

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: authAPI.me,
  });

  // Populate forms from API
  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      setProfile({
        orgName:    s.orgName    ?? "",
        orgPhone:   s.orgPhone   ?? "",
        orgEmail:   s.orgEmail   ?? "",
        orgAddress: s.orgAddress ?? "",
      });
      setAccounting({
        invoicePrefix:     s.invoicePrefix     ?? "INV",
        purchasePrefix:    s.purchasePrefix    ?? "PUR",
        defaultTaxRate:    s.defaultTaxRate    ?? 13,
        currency:          s.currency          ?? "NPR",
        lowStockThreshold: s.lowStockThreshold ?? 10,
        fiscalYearStart:   s.fiscalYearStart   ?? "07-16",
      });
      setToggles(t => ({
        ...t,
        enableStock:  s.enableStock  ?? true,
        enableLedger: s.enableLedger ?? true,
      }));
      setUserInfo(u => ({ ...u, plan: s.plan ?? "free" }));
    }
  }, [settingsData]);

  useEffect(() => {
    if (meData?.data) {
      const u = meData.data;
      setUserInfo({ name: u.name ?? "", email: u.email ?? "", orgId: u.orgId ?? "", plan: userInfo.plan });
    }
  }, [meData]);

  // ── Save mutation ─────────────────────────────────────────
  const save = useMutation({
    mutationFn: (data: any) => settingsAPI.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      showToast("success", "Settings saved successfully");
    },
    onError: (e: any) => showToast("error", e.message ?? "Failed to save"),
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  }

  function handleAccountingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setAccounting(a => ({ ...a, [name]: name === "defaultTaxRate" || name === "lowStockThreshold" ? Number(value) : value }));
  }

  const saveProfile = () => save.mutate({ ...profile });
  const saveAccounting = () => save.mutate({
    ...accounting,
    enableStock:  toggles.enableStock,
    enableLedger: toggles.enableLedger,
  });

  const handleLogout = () => { logout(); navigate("/login"); };

  const PLAN_COLORS: Record<string, string> = {
    free:     "bg-gray-100 text-gray-700",
    pro:      "bg-blue-100 text-blue-700",
    business: "bg-purple-100 text-purple-700",
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading settings…</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your business profile and accounting preferences
            </p>
          </div>
          {/* Plan badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_COLORS[userInfo.plan] ?? PLAN_COLORS.free}`}>
            {userInfo.plan} plan
          </span>
        </div>

        {toast && <Toast {...toast} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: main settings ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Business Profile */}
            <Card title="Business Profile" icon={Building2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field
                    label="Business / Organisation Name"
                    name="orgName" value={profile.orgName}
                    onChange={handleProfileChange}
                    placeholder="e.g. Sharma Traders Pvt Ltd"
                    hint="This name appears on your invoices and reports"
                  />
                </div>
                <Field label="Phone" name="orgPhone" type="tel"
                  value={profile.orgPhone} onChange={handleProfileChange}
                  placeholder="+977-98XXXXXXXX" />
                <Field label="Email" name="orgEmail" type="email"
                  value={profile.orgEmail} onChange={handleProfileChange}
                  placeholder="business@example.com" />
                <div className="md:col-span-2">
                  <Field label="Address" name="orgAddress"
                    value={profile.orgAddress} onChange={handleProfileChange}
                    placeholder="Street, City, District" />
                </div>
              </div>
              <Button
                onClick={saveProfile} disabled={save.isPending}
                className="flex items-center gap-2"
              >
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </Button>
            </Card>

            {/* Accounting Preferences */}
            <Card title="Accounting Preferences" icon={Receipt}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Currency
                  </label>
                  <Select
                    value={accounting.currency}
                    onValueChange={v => setAccounting(a => ({ ...a, currency: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NPR">NPR — रू (Nepalese Rupee)</SelectItem>
                      <SelectItem value="INR">INR — ₹ (Indian Rupee)</SelectItem>
                      <SelectItem value="USD">USD — $ (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR — € (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP — £ (British Pound)</SelectItem>
                      <SelectItem value="BDT">BDT — ৳ (Bangladeshi Taka)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tax Rate */}
                <NumField
                  label="Default VAT / Tax Rate (%)"
                  name="defaultTaxRate"
                  value={accounting.defaultTaxRate}
                  onChange={handleAccountingChange}
                  min={0} step={0.5}
                  hint="13% is Nepal's standard VAT rate"
                />

                {/* Invoice Prefix */}
                <div>
                  <Field
                    label="Invoice Prefix"
                    name="invoicePrefix"
                    value={accounting.invoicePrefix}
                    onChange={handleAccountingChange}
                    placeholder="INV"
                    hint={`Bills will be: ${accounting.invoicePrefix}-00001`}
                  />
                </div>

                {/* Purchase Prefix */}
                <div>
                  <Field
                    label="Purchase Prefix"
                    name="purchasePrefix"
                    value={accounting.purchasePrefix}
                    onChange={handleAccountingChange}
                    placeholder="PUR"
                    hint={`Orders will be: ${accounting.purchasePrefix}-00001`}
                  />
                </div>

                {/* Low Stock Threshold */}
                <NumField
                  label="Low Stock Alert Threshold (units)"
                  name="lowStockThreshold"
                  value={accounting.lowStockThreshold}
                  onChange={handleAccountingChange}
                  min={0}
                  hint="Alert when stock falls at or below this"
                />

                {/* Fiscal Year */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Fiscal Year Start
                  </label>
                  <Select
                    value={accounting.fiscalYearStart}
                    onValueChange={v => setAccounting(a => ({ ...a, fiscalYearStart: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07-16">Shrawan 1 (Jul 16) — Nepali FY</SelectItem>
                      <SelectItem value="01-01">January 1 — Calendar Year</SelectItem>
                      <SelectItem value="04-01">April 1 — Indian FY</SelectItem>
                      <SelectItem value="07-01">July 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Feature toggles */}
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Features
                </p>
                <Toggle
                  label="Inventory / Stock Tracking"
                  desc="Track product quantities and get low-stock alerts"
                  checked={toggles.enableStock}
                  onChange={() => setToggles(t => ({ ...t, enableStock: !t.enableStock }))}
                />
                <Toggle
                  label="Double-Entry Ledger"
                  desc="Automatically record debit/credit entries per party"
                  checked={toggles.enableLedger}
                  onChange={() => setToggles(t => ({ ...t, enableLedger: !t.enableLedger }))}
                />
              </div>

              <Button
                onClick={saveAccounting} disabled={save.isPending}
                className="flex items-center gap-2"
              >
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Accounting Settings
              </Button>
            </Card>
          </div>

          {/* ── Right: sidebar cards ─────────────────────────── */}
          <div className="space-y-5">

            {/* Account Info */}
            <Card title="Your Account" icon={User}>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold">{userInfo.name || "—"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold">{userInfo.email || "—"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Organisation ID</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {userInfo.orgId || "—"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </Card>

            {/* Appearance */}
            <Card title="Appearance" icon={Sun}>
              <div className="space-y-2">
                {(["light", "dark"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      document.documentElement.classList.toggle("dark", t === "dark");
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-2 text-sm font-medium
                      ${theme === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 text-foreground"}`}
                  >
                    {t === "light"
                      ? <Sun className="w-4 h-4 text-yellow-500" />
                      : <Moon className="w-4 h-4 text-blue-600" />}
                    {t === "light" ? "Light Mode" : "Dark Mode"}
                  </button>
                ))}
              </div>
            </Card>

            {/* Notifications */}
            <Card title="Notifications" icon={Bell}>
              <div className="space-y-4">
                <Toggle
                  label="Push Notifications"
                  checked={toggles.pushNotifications}
                  onChange={() => setToggles(t => ({ ...t, pushNotifications: !t.pushNotifications }))}
                />
                <Toggle
                  label="Email Notifications"
                  checked={toggles.emailNotifications}
                  onChange={() => setToggles(t => ({ ...t, emailNotifications: !t.emailNotifications }))}
                />
              </div>
            </Card>

            {/* Security */}
            <Card title="Security" icon={Shield}>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" disabled>
                  <BadgeCheck className="w-4 h-4 mr-2" />
                  Two-Factor Auth
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Coming in the next update.</p>
            </Card>

            {/* System info */}
            <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">Daily Accounting Hub</p>
              <div className="space-y-1">
                <p>Default Currency: NPR (रू)</p>
                <p>VAT Rate: 13% (Nepal)</p>
                <p>Fiscal Year: Shrawan 1 (Jul 16)</p>
                <p>Data: Isolated per organisation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
