"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Package } from "lucide-react";

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
      <div className="h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-dz-offer ring-1 ring-gold/50 shadow-violet">
            <Package className="w-6 h-6 text-gold animate-pulse" />
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-[13px] text-ink-soft font-medium">Loading Dropzy...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="ml-[260px]">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
