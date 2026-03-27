import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0/mo",
    features: ["1 user", "100 transactions/mo", "Basic reports"],
    color: "border-gray-200",
    badge: "",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹999/mo",
    features: ["5 users", "Unlimited transactions", "All reports", "Invoice PDF"],
    color: "border-blue-500",
    badge: "Most Popular",
  },
  {
    id: "business",
    name: "Business",
    price: "₹2499/mo",
    features: ["Unlimited users", "Everything in Pro", "Priority support", "Custom branding"],
    color: "border-purple-500",
    badge: "",
  },
];

export default function Register() {
  const API_URL = "http://localhost:3001";
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    try {

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        setStep(1);
        return;
      }

      login(data.token, data.user);
      navigate("/dashboard");

    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg p-8">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">$</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
              <span className="text-sm font-medium text-foreground">Your details</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
              <span className="text-sm font-medium text-foreground">Choose plan</span>
            </div>
          </div>

          {/* Step 1 — Details */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-xl font-bold text-foreground text-center mb-6">Create your account</h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Acme Traders" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@acme.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Min 6 characters" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Confirm password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Repeat password" required />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg text-center">{error}</div>
              )}

              <button type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium mt-2">
                Continue
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          )}

          {/* Step 2 — Plan selection */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground text-center mb-2">Choose your plan</h2>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Start free, upgrade anytime. No credit card required for Free plan.
              </p>

              <div className="space-y-3">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.id ? plan.color + " bg-blue-50/30" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-4 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === plan.id ? "border-primary" : "border-gray-300"
                        }`}>
                          {selectedPlan === plan.id && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">{plan.features.join(" · ")}</p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">{plan.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg text-center">{error}</div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)}
                  className="flex-1 border border-input py-2.5 rounded-lg font-medium text-sm text-foreground hover:bg-muted">
                  Back
                </button>
                <button onClick={handleRegister} disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm disabled:opacity-50">
                  {loading ? "Creating account..." : selectedPlan === "free" ? "Start for free" : "Continue to payment"}
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Pro and Business plans will redirect to payment in a future update.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}