"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #f0f2f5 100%)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center animate-pulse"
            style={{
              background: "linear-gradient(135deg, #007AFF, #5856D6)",
              boxShadow: "0 4px 16px rgba(0, 122, 255, 0.3)",
            }}
          >
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-[13px] text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #f0f2f5 100%)" }}>
      <Sidebar />
      <div className="ml-[260px]">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
