import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import AdminNavigation from "./admin-navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-72">
      <AdminNavigation />
      {children}
    </div>
  );
}
