import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Download,
  Eye,
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

interface Job {
  id: number;
  jobId: string;
  customerName: string;
  materialCost: number;
  laborCost: number;
  vat: number;
  totalCost: number;
  depositPaid: number;
  balanceDue: number;
  status: "pending" | "in_progress" | "completed";
  startDate: string;
  completionDate?: string;
  description: string;
}

const mockJobs: Job[] = [
  {
    id: 1,
    jobId: "JOB001",
    customerName: "ABC Corporation",
    materialCost: 15000,
    laborCost: 8000,
    vat: 3680,
    totalCost: 26680,
    depositPaid: 15000,
    balanceDue: 11680,
    status: "in_progress",
    startDate: "2024-03-01",
    description: "Office renovation project",
  },
  {
    id: 2,
    jobId: "JOB002",
    customerName: "XYZ Traders",
    materialCost: 25000,
    laborCost: 12000,
    vat: 8880,
    totalCost: 45880,
    depositPaid: 25000,
    balanceDue: 20880,
    status: "in_progress",
    startDate: "2024-03-05",
    description: "Shop construction",
  },
  {
    id: 3,
    jobId: "JOB003",
    customerName: "Tech Solutions Ltd",
    materialCost: 8000,
    laborCost: 5000,
    vat: 2080,
    totalCost: 15080,
    depositPaid: 15080,
    balanceDue: 0,
    status: "completed",
    startDate: "2024-02-15",
    completionDate: "2024-02-28",
    description: "Software installation and setup",
  },
  {
    id: 4,
    jobId: "JOB004",
    customerName: "Green Energy Co",
    materialCost: 45000,
    laborCost: 20000,
    vat: 13000,
    totalCost: 78000,
    depositPaid: 40000,
    balanceDue: 38000,
    status: "pending",
    startDate: "2024-03-10",
    description: "Solar panel installation",
  },
  {
    id: 5,
    jobId: "JOB005",
    customerName: "Fashion Plus",
    materialCost: 12000,
    laborCost: 6000,
    vat: 2880,
    totalCost: 20880,
    depositPaid: 10000,
    balanceDue: 10880,
    status: "pending",
    startDate: "2024-03-12",
    description: "Store design and renovation",
  },
];

const VAT_RATE = 0.15;

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    jobId: "",
    customerName: "",
    materialCost: "",
    laborCost: "",
    depositPaid: "",
    status: "pending" as Job["status"],
    startDate: new Date().toISOString().split("T")[0],
    completionDate: "",
    description: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      jobId: "",
      customerName: "",
      materialCost: "",
      laborCost: "",
      depositPaid: "",
      status: "pending",
      startDate: new Date().toISOString().split("T")[0],
      completionDate: "",
      description: "",
    });
    setEditingId(null);
  };

  const calculateVAT = (material: number, labor: number) => {
    return (material + labor) * VAT_RATE;
  };

  const calculateTotal = (material: number, labor: number) => {
    const vat = calculateVAT(material, labor);
    return material + labor + vat;
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.materialCost || !formData.laborCost) {
      alert("Please fill in all required fields");
      return;
    }

    const materialCost = parseFloat(formData.materialCost);
    const laborCost = parseFloat(formData.laborCost);
    const vat = calculateVAT(materialCost, laborCost);
    const totalCost = calculateTotal(materialCost, laborCost);
    const depositPaid = parseFloat(formData.depositPaid) || 0;
    const balanceDue = totalCost - depositPaid;

    if (editingId) {
      setJobs(
        jobs.map((j) =>
          j.id === editingId
            ? {
                ...j,
                jobId: formData.jobId,
                customerName: formData.customerName,
                materialCost,
                laborCost,
                vat,
                totalCost,
                depositPaid,
                balanceDue,
                status: formData.status,
                startDate: formData.startDate,
                completionDate: formData.completionDate,
                description: formData.description,
              }
            : j
        )
      );
      setEditingId(null);
    } else {
      const newJob: Job = {
        id: Math.max(...jobs.map((j) => j.id), 0) + 1,
        jobId: formData.jobId,
        customerName: formData.customerName,
        materialCost,
        laborCost,
        vat,
        totalCost,
        depositPaid,
        balanceDue,
        status: formData.status,
        startDate: formData.startDate,
        completionDate: formData.completionDate,
        description: formData.description,
      };
      setJobs([newJob, ...jobs]);
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (job: Job) => {
    setFormData({
      jobId: job.jobId,
      customerName: job.customerName,
      materialCost: job.materialCost.toString(),
      laborCost: job.laborCost.toString(),
      depositPaid: job.depositPaid.toString(),
      status: job.status,
      startDate: job.startDate,
      completionDate: job.completionDate || "",
      description: job.description,
    });
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setJobs(jobs.filter((j) => j.id !== id));
  };

  const filteredJobs =
    filterStatus === "all" ? jobs : jobs.filter((j) => j.status === filterStatus);

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    inProgress: jobs.filter((j) => j.status === "in_progress").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    totalRevenue: jobs.reduce((sum, j) => sum + j.totalCost, 0),
    totalReceived: jobs.reduce((sum, j) => sum + j.depositPaid, 0),
    totalDue: jobs.reduce((sum, j) => sum + j.balanceDue, 0),
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Jobs & Services</h1>
            <p className="text-muted-foreground mt-1">
              Track job costs and customer billing
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
              New Job
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Total Jobs</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-700 mt-2">
              {stats.pending}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">In Progress</p>
            <p className="text-3xl font-bold text-purple-700 mt-2">
              {stats.inProgress}
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {stats.completed}
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700 mt-2">
              ৳{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Amount Received</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">
              ৳{stats.totalReceived.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Balance Due</p>
            <p className="text-2xl font-bold text-red-700 mt-2">
              ৳{stats.totalDue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Edit Job" : "Create New Job"}
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

            <form onSubmit={handleAddOrUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job ID
                  </label>
                  <input
                    type="text"
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleInputChange}
                    placeholder="e.g., JOB001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Customer name"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Material Cost *
                  </label>
                  <input
                    type="number"
                    name="materialCost"
                    value={formData.materialCost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Labour Cost *
                  </label>
                  <input
                    type="number"
                    name="laborCost"
                    value={formData.laborCost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Deposit Paid
                  </label>
                  <input
                    type="number"
                    name="depositPaid"
                    value={formData.depositPaid}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <Select value={formData.status} onValueChange={(v) => handleSelectChange(v, "status")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Job description"
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingId ? "Update Job" : "Create Job"}
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

        {/* Filter */}
        <div className="bg-white rounded-lg border border-border p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Deposit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Balance Due
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {job.jobId}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {job.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "in_progress"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {job.status === "in_progress" ? "In Progress" : job.status === "completed" ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground text-right">
                      ৳{job.totalCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 font-semibold text-right">
                      ৳{job.depositPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 font-semibold text-right">
                      ৳{job.balanceDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 hover:bg-muted rounded transition-colors">
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleEdit(job)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-primary" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 hover:bg-muted rounded transition-colors">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Job</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete job "{job.jobId}"? This action cannot be
                              undone.
                            </AlertDialogDescription>
                            <div className="flex gap-3 justify-end">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(job.id)}
                                className="bg-destructive hover:bg-destructive/90"
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
