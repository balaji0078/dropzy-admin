"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Eye,
  EyeOff,
  Truck,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    fetch(`${API_BASE}/health`, { method: "GET" })
      .then((res) => setApiStatus(res.ok ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password.trim()) { setError("Password is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message?.includes("Unauthorized") || err.message?.includes("401")) {
        setError("Invalid email or password");
      } else if (err.message?.includes("Admin") || err.message?.includes("admin")) {
        setError("Access denied — admin accounts only");
      } else if (err.message?.includes("fetch") || err.message?.includes("network")) {
        setError("Cannot reach server. Check if backend is running.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[50%] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #AF52DE 100%)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2), transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15), transparent 50%)",
          }}
        />
        <div className="absolute top-20 right-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-32 left-16 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Dropzy</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="animate-fade-in-up animation-delay-100">
              <h1 className="text-[36px] font-bold text-white leading-tight tracking-tight">
                Manage your<br />delivery empire
              </h1>
              <p className="mt-4 text-white/60 text-[15px] leading-relaxed max-w-sm">
                Track orders, manage drivers, monitor payments, and grow your business from one powerful dashboard.
              </p>
            </div>

            <div className="animate-fade-in-up animation-delay-300 flex gap-6">
              {[
                { value: "30+", label: "Endpoints" },
                { value: "Real-time", label: "Tracking" },
                { value: "Secure", label: "JWT + Redis" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[20px] font-bold text-white">{stat.value}</p>
                  <p className="text-[12px] text-white/40 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="animate-fade-in-up animation-delay-400 flex flex-wrap gap-2">
              {[
                { icon: Truck, text: "Live Tracking" },
                { icon: Shield, text: "Secure Payments" },
                { icon: Clock, text: "Real-time Updates" },
              ].map((f) => (
                <div
                  key={f.text}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/80"
                  style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-in animation-delay-500">
            <p className="text-[11px] text-white/30">Dropzy Admin v2.0 — Powered by Go + Next.js</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 relative flex items-center justify-center px-6 py-12">
        <div className="relative z-10 w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 animate-fade-in-up">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "linear-gradient(135deg, #007AFF, #5856D6)", boxShadow: "0 4px 16px rgba(0, 122, 255, 0.3)" }}
            >
              <Package className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Dropzy Admin</h1>
          </div>

          <div className="animate-fade-in-up animation-delay-100 mb-8">
            <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-[14px] text-gray-400 mt-1">Sign in to your admin dashboard</p>
          </div>

          {/* API status */}
          <div className="animate-fade-in-up animation-delay-200 mb-5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className={`w-2 h-2 rounded-full ${
                apiStatus === "online" ? "bg-green-500" : apiStatus === "offline" ? "bg-red-500" : "bg-amber-500 animate-pulse"
              }`} />
              <span className={
                apiStatus === "online" ? "text-green-600 font-medium" : apiStatus === "offline" ? "text-red-500 font-medium" : "text-amber-600 font-medium"
              }>
                {apiStatus === "online" ? "Backend connected" : apiStatus === "offline" ? "Backend unreachable" : "Checking..."}
              </span>
            </div>
          </div>

          {/* Login Card */}
          <div
            className="animate-fade-in-up animation-delay-200 p-7"
            style={{
              background: "rgba(255, 255, 255, 0.72)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              borderRadius: "20px",
              boxShadow: "0 16px 64px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[13px] animate-fade-in-up" style={{ border: "1px solid rgba(255, 59, 48, 0.1)" }}>
                  <span className="text-red-500 font-bold mt-0.5">!</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required
                  placeholder="admin@dropzy.com"
                  autoComplete="email"
                  className="apple-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="apple-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || apiStatus === "checking"}
                className="apple-btn apple-btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
                ) : (
                  <>Sign In<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <div className="animate-fade-in animation-delay-500 mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin accounts only — secured with JWT</span>
          </div>

          {/* Mobile features */}
          <div className="lg:hidden animate-fade-in animation-delay-500 mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {["Live Tracking", "Payments", "Fleet Ops"].map((f) => (
                <span key={f} className="flex items-center gap-1 text-[11px] text-gray-500 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.03)" }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#007AFF" }} />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
