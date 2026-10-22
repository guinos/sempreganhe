"use client";

import { useRouter } from "next/navigation";

type MenuItem = {
  label: string;
  href?: string;
  available?: boolean;
};

const menuGroups: Array<{ label: string; items: MenuItem[] }> = [
  {
    label: "Configurações",
    items: [
      { label: "Minha conta", available: false },
      { label: "Info do negócio", href: "#partner" },
      { label: "Equipe", available: false },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Criar promoção", href: "#promotion-create" },
      { label: "Promoções cadastradas", href: "#promotions-list" },
      { label: "Participação e resgate", href: "#participations" },
      { label: "Google Avaliações", available: false },
    ],
  },
  {
    label: "Clientes",
    items: [
      { label: "Cadastrar cliente", available: false },
      { label: "Relatório de clientes", available: false },
    ],
  },
];

export default function AdminNavigation() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="border-b bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:w-72 lg:border-b-0 lg:border-r lg:border-slate-800">
      <div className="flex h-full flex-col p-4 sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">SempreGanhe</p>
          <h1 className="mt-2 text-xl font-semibold">Painel administrativo</h1>
        </div>

        <nav aria-label="Menu administrativo" className="flex-1 space-y-3">
          {menuGroups.map((group) => (
            <details className="group rounded-lg bg-slate-900/70 p-2" key={group.label} open>
              <summary className="cursor-pointer list-none px-2 py-2 text-sm font-semibold text-slate-200 marker:hidden">
                <span className="flex items-center justify-between">
                  {group.label}
                  <span aria-hidden="true" className="text-slate-500 transition group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <ul className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.available === false ? (
                      <span className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-slate-500" title="Módulo em construção">
                        {item.label}
                        <span className="text-[10px] uppercase tracking-wide">Em breve</span>
                      </span>
                    ) : (
                      <a className="block rounded-md px-2 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white" href={item.href}>
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>

        <button className="mt-6 rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white" onClick={() => void logout()} type="button">
          Sair / Deslogar
        </button>
      </div>
    </aside>
  );
}
