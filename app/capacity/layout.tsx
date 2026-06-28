"use client";

import { AuthProvider } from "@/lib/auth-context";
import AdminLayout from "@/components/layout/AdminLayout";

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AuthProvider>
  );
}
