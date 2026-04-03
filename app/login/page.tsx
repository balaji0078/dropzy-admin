"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Eye,
  EyeOff,
  Truck,
  MapPin,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

/* ─── Animated background blobs ─── */
function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient mesh */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-brand-400/20 via-blue-300/10 to-transparent rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-brand-600/15 via-indigo-400/10 to-transparent rounded-full blur-3xl animate-float animation-delay-200" style={{ animationDuration: "4s" }} />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-gradient-to-r from-cyan-300/10 to-brand-300/10 rounded-full blur-3xl animate-float animation-delay-400" style={{ animationDuration: "5s" }} />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1b6cf5 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated delivery truck line */}
      <div className="absolute bottom-20 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-200 to-transparent opacity-40" />
      <div className="absolute bottom-[79px] animate-truck">
        <Truck className="w-5 h-5 text-brand-400/40" />
      </div>
    </div>
  );
}

/* ─── Feature pill ─── */
function FeaturePill({ icon: Icon, text, delay }: { icon: any; text: string; delay: string }) {
  return (
    <div
      className={`opacity-0 animate-fade-in-up ${delay} flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm text-xs font-medium text-gray-600`}
    >
      <Icon className="w-3.5 h-3.5 text-brand-600" />
      {text}
    </div>
  );
}

/* ─── Login Form ─── */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const { login } = useAuth();
  const router = useRouter();

  // Check API health on mount
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    fetch(`${API_BASE}/health`, { method: "GET" })
      .then((res) => {
        setApiStatus(res.ok ? "online" : "offline");
      })
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
    <div className="min-h-screen relative flex">
      {/* ─── Left Panel: Branding ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 animate-gradient overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute top-20 right-20 w-48 h-48 rounded-full border border-white/5" />
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-white/20 animate-float" />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 rounded-full bg-white/30 animate-float animation-delay-300" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="opacity-0 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Dropzy</span>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div className="opacity-0 animate-fade-in-up animation-delay-100">
              <h1 className="text-4xl font-bold text-white leading-tight">
                Manage your<br />
                delivery empire
              </h1>
              <p className="mt-3 text-brand-200 text-base leading-relaxed max-w-sm">
                Track orders, manage drivers, monitor payments, and grow your business — all from one powerful dashboard.
              </p>
            </div>

            {/* Stats row */}
            <div className="opacity-0 animate-fade-in-up animation-delay-300 flex gap-8">
              <div>
                <p className="text-2xl font-bold text-white">30+</p>
                <p className="text-xs text-brand-300">API Endpoints</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold text-white">Real-time</p>
                <p className="text-xs text-brand-300">GPS Tracking</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold text-white">Secure</p>
                <p className="text-xs text-brand-300">JWT + Redis</p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              <FeaturePill icon={Truck} text="Live Driver Tracking" delay="animation-delay-300" />
              <FeaturePill icon={Shield} text="Payment Security" delay="animation-delay-400" />
              <FeaturePill icon={Clock} text="Real-time Orders" delay="animation-delay-500" />
            </div>
          </div>

          {/* Footer */}
          <div className="opacity-0 animate-fade-in animation-delay-500">
            <p className="text-xs text-brand-300/60">
              Dropzy Admin Dashboard v1.0 — Powered by Go + Next.js
            </p>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="flex-1 relative flex items-center justify-center px-6 py-12 bg-gray-50/80">
        <BackgroundBlobs />

        <div className="relative z-10 w-full max-w-[400px]">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8 opacity-0 animate-fade-in-up">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/20">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dropzy Admin</h1>
          </div>

          {/* Form header */}
          <div className="opacity-0 animate-fade-in-up animation-delay-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your admin dashboard</p>
          </div>

          {/* API status indicator */}
          <div className="opacity-0 animate-fade-in-up animation-delay-200 mb-6">
            <div className="flex items-center gap-2 text-xs">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    apiStatus === "online"
                      ? "bg-emerald-500"
                      : apiStatus === "offline"
                      ? "bg-red-500"
                      : "bg-amber-500 animate-pulse"
                  }`}
                />
                {apiStatus === "online" && (
                  <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring" />
                )}
              </div>
              <span className={
                apiStatus === "online"
                  ? "text-emerald-600 font-medium"
                  : apiStatus === "offline"
                  ? "text-red-500 font-medium"
                  : "text-amber-600 font-medium"
              }>
                {apiStatus === "online"
                  ? "Backend connected"
                  : apiStatus === "offline"
                  ? "Backend unreachable"
                  : "Checking connection..."}
              </span>
            </div>
          </div>

          {/* Login card */}
          <div className="opacity-0 animate-fade-in-up animation-delay-200 glass-card rounded-2xl p-8 shadow-xl shadow-gray-200/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error alert */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    required
                    placeholder="admin@dropzy.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-brand-500 input-glow transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-brand-500 input-glow transition-all duration-200 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || apiStatus === "checking"}
                className="group w-full py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security note */}
          <div className="opacity-0 animate-fade-in animation-delay-500 mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin accounts only — secured with JWT</span>
          </div>

          {/* Verified features (mobile only) */}
          <div className="lg:hidden opacity-0 animate-fade-in animation-delay-500 mt-6">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: CheckCircle2, label: "Live Tracking" },
                { icon: CheckCircle2, label: "Payment Mgmt" },
                { icon: CheckCircle2, label: "Driver Ops" },
              ].map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
                >
                  <f.icon className="w-3 h-3 text-brand-500" />
                  {f.label}
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
