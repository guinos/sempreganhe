"use client";

import { useRouter } from "next/navigation";

export type CustomerView = "dashboard" | "account";

export default function CustomerNavigation({ activeView, onChange }: { activeView: CustomerView; onChange: (view: CustomerView) => void }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/customer/auth/logout", { method: "POST" });
    router.refresh();
    window.location.reload();
  }

  return (
    <aside className="border-b bg-slate-950 text-white sm:fixed sm:inset-y-0 sm:left-0 sm:w-72 sm:border-b-0 sm:border-r sm:border-slate-800">
      <div className="flex h-full flex-col p-4 sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">SempreGanhe</p>
          <h1 className="mt-2 text-xl font-semibold">Painel do cliente</h1>
        </div>
        <nav aria-label="Menu do cliente" className="flex-1 space-y-2">
          <button aria-current={activeView === "dashboard" ? "page" : undefined} className={`block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-400 ${activeView === "dashboard" ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-900/70 hover:bg-slate-800"}`} onClick={() => onChange("dashboard")} type="button">
            Meu painel
          </button>
          <button aria-current={activeView === "account" ? "page" : undefined} className={`block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-400 ${activeView === "account" ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-900/70 hover:bg-slate-800"}`} onClick={() => onChange("account")} type="button">
            Meus dados
          </button>
        </nav>
        <button className="mt-6 rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white" onClick={() => void logout()} type="button">
          Sair / Deslogar
        </button>
      </div>
    </aside>
  );
}
