import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Download,
  Search,
  ChevronDown,
  Plus,
  Printer,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: "invoice" | "payment" | "adjustment";
  reference: string;
}

interface PartyLedger {
  partyId: string;
  partyName: string;
  partyType: "customer" | "supplier";
  entries: LedgerEntry[];
}

const mockLedgers: PartyLedger[] = [
  {
    partyId: "1",
    partyName: "ABC Corporation",
    partyType: "customer",
    entries: [
      {
        id: "1",
        date: "2024-03-01",
        description: "Opening Balance",
        debit: 50000,
        credit: 0,
        balance: 50000,
        type: "adjustment",
        reference: "Opening",
      },
      {
        id: "2",
        date: "2024-03-10",
        description: "Invoice INV-001",
        debit: 51750,
        credit: 0,
        balance: 101750,
        type: "invoice",
        reference: "INV-001",
      },
      {
        id: "3",
        date: "2024-03-12",
        description: "Payment Received",
        debit: 0,
        credit: 25000,
        balance: 76750,
        type: "payment",
        reference: "CHQ-001",
      },
      {
        id: "4",
        date: "2024-03-15",
        description: "Invoice INV-002",
        debit: 45000,
        credit: 0,
        balance: 121750,
        type: "invoice",
        reference: "INV-002",
      },
    ],
  },
  {
    partyId: "2",
    partyName: "XYZ Traders",
    partyType: "supplier",
    entries: [
      {
        id: "5",
        date: "2024-03-01",
        description: "Opening Balance",
        debit: 0,
        credit: 25000,
        balance: -25000,
        type: "adjustment",
        reference: "Opening",
      },
      {
        id: "6",
        date: "2024-03-05",
        description: "Purchase PUR-001",
        debit: 0,
        credit: 65500,
        balance: -90500,
        type: "invoice",
        reference: "PUR-001",
      },
      {
        id: "7",
        date: "2024-03-12",
        description: "Payment Made",
        debit: 30000,
        credit: 0,
        balance: -60500,
        type: "payment",
        reference: "CHQ-002",
      },
    ],
  },
];

const parties = [
  { id: "1", name: "ABC Corporation", type: "customer" },
  { id: "2", name: "XYZ Traders", type: "supplier" },
];

export default function Ledger() {
  const [ledgers, setLedgers] = useState<PartyLedger[]>(mockLedgers);
  const [selectedParty, setSelectedParty] = useState<string>("1");
  const [expandedParties, setExpandedParties] = useState<Set<string>>(
    new Set(["1"])
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "party">("party");

  const currentLedger = ledgers.find((l) => l.partyId === selectedParty);

  const toggleParty = (partyId: string) => {
    const newExpanded = new Set(expandedParties);
    if (newExpanded.has(partyId)) {
      newExpanded.delete(partyId);
    } else {
      newExpanded.add(partyId);
    }
    setExpandedParties(newExpanded);
  };

  const getFilteredEntries = (entries: LedgerEntry[]) => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStartDate = !startDate || entry.date >= startDate;
      const matchesEndDate = !endDate || entry.date <= endDate;
      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  };

  const calculatePartyBalance = (entries: LedgerEntry[]) => {
    if (entries.length === 0) return 0;
    return entries[entries.length - 1].balance;
  };

  const calculatePartyTotals = (entries: LedgerEntry[]) => {
    return {
      totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
      totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
    };
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Party Ledger</h1>
            <p className="text-muted-foreground mt-1">
              Track all transactions with customers and suppliers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("party")}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  viewMode === "party"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Party View
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  viewMode === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Ledgers
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {viewMode === "party" && (
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Party
                </label>
                <Select value={selectedParty} onValueChange={setSelectedParty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name} ({party.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1">
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

            <div className="w-full md:w-40">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="w-full md:w-40">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Party View */}
        {viewMode === "party" && currentLedger && (
          <div className="space-y-6">
            {/* Party Summary */}
            <div className="bg-white rounded-lg border border-border p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Party Name
                  </p>
                  <p className="text-lg font-bold text-foreground mt-2">
                    {currentLedger.partyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Party Type
                  </p>
                  <p className="text-lg font-bold text-foreground mt-2 capitalize">
                    {currentLedger.partyType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Debit
                  </p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Rs. 
                    {calculatePartyTotals(currentLedger.entries).totalDebit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Current Balance
                  </p>
                  <p
                    className={`text-lg font-bold mt-2 ${
                      calculatePartyBalance(currentLedger.entries) >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    Rs. {calculatePartyBalance(currentLedger.entries).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredEntries(currentLedger.entries).length > 0 ? (
                      getFilteredEntries(currentLedger.entries).map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {entry.date}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 bg-secondary/70 rounded text-xs font-medium">
                              {entry.reference}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                            {entry.debit > 0
                              ? `Rs. ${entry.debit.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                            {entry.credit > 0
                              ? `Rs. ${entry.credit.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-primary">
                            Rs. {entry.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <p className="text-muted-foreground">
                            No entries found
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t-2 border-border font-bold">
                      <td colSpan={3} className="px-6 py-4 text-sm">
                        TOTALS
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        Rs. 
                        {getFilteredEntries(currentLedger.entries)
                          .reduce((sum, e) => sum + e.debit, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">
                        Rs. 
                        {getFilteredEntries(currentLedger.entries)
                          .reduce((sum, e) => sum + e.credit, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        Rs. 
                        {calculatePartyBalance(
                          getFilteredEntries(currentLedger.entries)
                        ).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Ledgers View */}
        {viewMode === "all" && (
          <div className="space-y-4">
            {ledgers.map((ledger) => {
              const filteredEntries = getFilteredEntries(ledger.entries);
              const isExpanded = expandedParties.has(ledger.partyId);

              return (
                <div
                  key={ledger.partyId}
                  className="bg-white rounded-lg border border-border overflow-hidden"
                >
                  {/* Ledger Header */}
                  <button
                    onClick={() => toggleParty(ledger.partyId)}
                    className="w-full p-6 hover:bg-muted/30 transition-colors flex items-center justify-between"
                  >
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-foreground">
                        {ledger.partyName}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {ledger.partyType}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p
                          className={`text-lg font-bold ${
                            calculatePartyBalance(ledger.entries) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          Rs. 
                          {calculatePartyBalance(ledger.entries).toLocaleString()}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/20">
                              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                                Description
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                                Debit
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                                Credit
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                                Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEntries.map((entry) => (
                              <tr
                                key={entry.id}
                                className="border-b border-border hover:bg-muted/20"
                              >
                                <td className="px-6 py-3 text-sm text-muted-foreground">
                                  {entry.date}
                                </td>
                                <td className="px-6 py-3 text-sm text-foreground">
                                  {entry.description}
                                </td>
                                <td className="px-6 py-3 text-sm text-right text-green-600 font-medium">
                                  {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : "-"}
                                </td>
                                <td className="px-6 py-3 text-sm text-right text-red-600 font-medium">
                                  {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : "-"}
                                </td>
                                <td className="px-6 py-3 text-sm text-right font-bold text-primary">
                                  Rs. {entry.balance.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
