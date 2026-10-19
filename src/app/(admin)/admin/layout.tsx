import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
