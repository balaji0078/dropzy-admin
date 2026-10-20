"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Eye, EyeOff, Truck, Shield, Clock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { CORE_API } from "@/lib/config";
import CoreLoginPage from "@/components/core/pages/Login";
import DropzyScene from "@/components/layout/DropzyScene";

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
      if (err.message?.includes("Unauthorized") || err.message?.includes("401")) setError("Invalid email or password");
      else if (err.message?.includes("Admin")) setError("Access denied — admin accounts only");
      else if (err.message?.includes("fetch") || err.message?.includes("network")) setError("Cannot reach server.");
      else setError(err.message || "Login failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex bg-canvas">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-dz-hero border-r border-line">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-16 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <DropzyScene className="absolute inset-x-0 bottom-0 w-full h-[190px]" sun={[182, 116]} />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-dz-offer ring-1 ring-gold/60 shadow-violet">
                <Package className="w-6 h-6 text-gold" />
              </div>
              <span className="text-xl font-extrabold text-white">Drop<span className="text-gold">zy</span></span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="animate-fade-in-up animation-delay-100">
              <h1 className="text-[36px] font-bold text-white leading-tight">
                India&apos;s Most Trusted<br />Parcel Service
              </h1>
              <p className="mt-4 text-[#CFC8E6] text-[15px] leading-relaxed max-w-sm">
                Send parcels across 200+ cities with real-time tracking. Fast, safe, and affordable.
              </p>
            </div>

            <div className="animate-fade-in-up animation-delay-300 flex gap-6">
              {[{ value: "200+", label: "Cities" }, { value: "500+", label: "Buses" }, { value: "50K+", label: "Customers" }].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[20px] font-bold text-gold">{stat.value}</p>
                  <p className="text-[12px] text-[#CFC8E6]/80 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="animate-fade-in-up animation-delay-400 flex flex-wrap gap-2">
              {[{ icon: Truck, text: "Live Tracking" }, { icon: Shield, text: "Insured Parcels" }, { icon: Clock, text: "24-48h Delivery" }].map((f) => (
                <div key={f.text} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/90 bg-white/10 border border-white/15 backdrop-blur-sm">
                  <f.icon className="w-3.5 h-3.5 text-gold" />{f.text}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-in animation-delay-500">
            <p className="text-[11px] text-white/60">Dropzy Admin v2.0 — Powered by Go + Next.js</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 relative flex items-center justify-center px-6 py-12">
        <div className="relative z-10 w-full max-w-[380px]">
          <div className="lg:hidden text-center mb-8 animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-dz-offer ring-1 ring-gold/60 shadow-violet">
              <Package className="w-7 h-7 text-gold" />
            </div>
            <h1 className="text-[22px] font-bold text-ink">Dropzy Admin</h1>
          </div>

          <div className="animate-fade-in-up animation-delay-100 mb-8">
            <h2 className="text-[24px] font-bold text-ink">Welcome back</h2>
            <p className="text-[14px] text-ink-soft mt-1">Sign in to your admin dashboard</p>
          </div>

          <div className="animate-fade-in-up animation-delay-200 mb-5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className={`w-2 h-2 rounded-full ${apiStatus === "online" ? "bg-success" : apiStatus === "offline" ? "bg-danger" : "bg-warning animate-pulse"}`} />
              <span className={apiStatus === "online" ? "text-success font-medium" : apiStatus === "offline" ? "text-danger font-medium" : "text-warning font-medium"}>
                {apiStatus === "online" ? "Backend connected" : apiStatus === "offline" ? "Backend unreachable" : "Checking..."}
              </span>
            </div>
          </div>

          <div className="animate-fade-in-up animation-delay-200 relative bg-surface rounded-2xl p-7 shadow-rb-lg border border-line overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden />
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-danger/10 text-danger px-4 py-3 rounded-xl text-[13px] border border-danger/40">
                  <span className="font-bold mt-0.5">!</span><span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-ink-soft uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required placeholder="admin@dropzy.com" autoComplete="email" className="rb-input" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-ink-soft uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} required placeholder="Enter your password" autoComplete="current-password" className="rb-input pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-gold" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || apiStatus === "checking"} className="rb-btn rb-btn-primary w-full py-3 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : <>Sign In<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>

          <div className="animate-fade-in animation-delay-500 mt-6 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
            <Shield className="w-3.5 h-3.5 text-gold" /><span>Admin accounts only — secured with JWT</span>
          </div>

          <div className="lg:hidden animate-fade-in animation-delay-500 mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {["Live Tracking", "Payments", "Fleet Ops"].map((f) => (
                <span key={f} className="flex items-center gap-1 text-[11px] text-ink-soft px-2.5 py-1 rounded-full bg-surface-alt border border-line">
                  <CheckCircle2 className="w-3 h-3 text-gold" />{f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegacyLoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}

// NEXT_PUBLIC_CORE_API=true → phone OTP + MFA (P1); otherwise the legacy email/password admin login.
export default function LoginPage() {
  return CORE_API ? <CoreLoginPage /> : <LegacyLoginPage />;
}
