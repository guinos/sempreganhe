"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CustomerNavigation, { type CustomerView } from "./customer-navigation";

type Account = { firstName: string; lastName: string; email: string; phone: string; birthDate: string };
type Dashboard = {
  account: { firstName: string; lastName: string } | null;
  history: Array<{ id: string; promotionTitle: string; prizeDescription: string; status: string; scrapedAt: string; partnerName: string }>;
  redeemedByPartner: Array<{ partnerId: string; partnerName: string; redemptionCount: number }>;
};

const statusLabels: Record<string, string> = { pending_registration: "Cadastro pendente", pending_confirmation: "Aguardando partner", redeemed: "Resgatado", rejected: "Recusado" };

export default function CustomerPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [activeView, setActiveView] = useState<CustomerView>("dashboard");
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadDashboard() {
    const response = await fetch("/api/customer/dashboard");
    if (response.ok) setDashboard(await response.json() as Dashboard);
  }

  async function loadAccount() {
    const response = await fetch("/api/customer/account");
    if (response.ok) setAccount((await response.json() as { account: Account }).account);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = mode === "login" ? "/api/customer/auth/login" : "/api/customer/auth/register";
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(mode === "login" ? data : { ...data, privacyAccepted: data.privacyAccepted === "on" }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? "Não foi possível continuar.");
    else { await loadDashboard(); await loadAccount(); }
    setSaving(false);
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/customer/account", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? "Não foi possível salvar seus dados.");
    else {
      setAccount(body.account as Account);
      setDashboard((current) => current ? { ...current, account: { firstName: body.account.firstName, lastName: body.account.lastName } } : current);
      setError("Dados atualizados com sucesso.");
    }
    setSaving(false);
  }

  if (!dashboard) return <main className="mx-auto flex min-h-screen w-full max-w-lg items-center p-6"><form className="w-full space-y-4 rounded-2xl border bg-white p-6 shadow-sm" onSubmit={(event) => void submitAuth(event)}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">SempreGanhe</p><h1 className="text-3xl font-bold">{mode === "login" ? "Meu painel" : "Criar minha conta"}</h1><p className="text-sm text-gray-600">{mode === "login" ? "Consulte suas participações e prêmios em todos os partners." : "Crie sua conta para acompanhar suas promoções em um só lugar."}</p>{mode === "register" && <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Nome<input className="mt-1 w-full rounded border p-2" name="firstName" required /></label><label className="text-sm">Sobrenome<input className="mt-1 w-full rounded border p-2" name="lastName" required /></label></div>}<label className="block text-sm">E-mail<input className="mt-1 w-full rounded border p-2" name="email" required type="email" /></label>{mode === "register" && <><label className="block text-sm">Telefone<input className="mt-1 w-full rounded border p-2" inputMode="tel" name="phone" placeholder="(11) 99999-9999" required /></label><label className="block text-sm">Data de nascimento<input className="mt-1 w-full rounded border p-2" name="birthDate" required type="date" /></label></>}<label className="block text-sm">Senha<input className="mt-1 w-full rounded border p-2" name="password" required type="password" /></label>{mode === "register" && <label className="flex gap-2 text-sm"><input name="privacyAccepted" required type="checkbox" />Aceito o tratamento dos meus dados conforme a Política de Privacidade.</label>}{error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}<button className="w-full rounded bg-black px-4 py-3 font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button><button className="w-full text-sm underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} type="button">{mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}</button></form></main>;

  const redeemedCount = dashboard.history.filter((item) => item.status === "redeemed").length;
  return <div className="min-h-screen bg-slate-50 sm:pl-72"><CustomerNavigation activeView={activeView} onChange={(view) => { setActiveView(view); setError(""); if (view === "account" && !account) void loadAccount(); }} /><main className="mx-auto w-full max-w-6xl p-4 sm:p-8">{activeView === "dashboard" ? <DashboardView dashboard={dashboard} redeemedCount={redeemedCount} /> : <AccountView account={account} error={error} saving={saving} onSubmit={(event) => void saveAccount(event)} />}</main></div>;
}

function DashboardView({ dashboard, redeemedCount }: { dashboard: Dashboard; redeemedCount: number }) {
  return <div className="space-y-6"><header className="rounded-xl border bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Meu painel</p><h1 className="mt-2 text-3xl font-semibold">Olá, {dashboard.account?.firstName}!</h1><p className="mt-1 text-gray-600">Seu histórico de promoções e prêmios.</p></header><section className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Participações</p><p className="mt-2 text-3xl font-bold">{dashboard.history.length}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Prêmios resgatados</p><p className="mt-2 text-3xl font-bold">{redeemedCount}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Partners visitados</p><p className="mt-2 text-3xl font-bold">{dashboard.redeemedByPartner.length}</p></div></section><section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"><div className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Minhas participações</h2>{dashboard.history.length === 0 ? <p className="mt-4 text-sm text-gray-500">Você ainda não participou de nenhuma promoção.</p> : <div className="mt-4 divide-y">{dashboard.history.map((item) => <article className="py-4 first:pt-0" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.promotionTitle}</h3><p className="text-sm text-gray-600">{item.prizeDescription}</p><p className="mt-1 text-xs text-gray-500">{item.partnerName} · {new Date(item.scrapedAt).toLocaleDateString("pt-BR")}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{statusLabels[item.status] ?? item.status}</span></div></article>)}</div>}</div><div className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Resgates por partner</h2>{dashboard.redeemedByPartner.length === 0 ? <p className="mt-4 text-sm text-gray-500">Seus prêmios resgatados aparecerão aqui.</p> : <div className="mt-4 space-y-3">{dashboard.redeemedByPartner.map((item) => <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3" key={item.partnerId}><span>{item.partnerName}</span><strong>{item.redemptionCount}</strong></div>)}</div>}</div></section></div>;
}

function AccountView({ account, error, saving, onSubmit }: { account: Account | null; error: string; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  if (!account) return <section className="rounded-xl border bg-white p-6"><p className="text-sm text-gray-600">Carregando seus dados...</p></section>;
  return <div className="space-y-6"><header className="rounded-xl border bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Meus dados</p><h1 className="mt-2 text-3xl font-semibold">Dados da minha conta</h1><p className="mt-1 text-gray-600">Mantenha seus dados atualizados para acompanhar seus prêmios.</p></header><form className="max-w-3xl space-y-5 rounded-xl border bg-white p-6 shadow-sm" onSubmit={onSubmit}><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Nome<input className="mt-2 w-full rounded-lg border border-slate-300 p-3" defaultValue={account.firstName} name="firstName" required /></label><label className="text-sm font-medium">Sobrenome<input className="mt-2 w-full rounded-lg border border-slate-300 p-3" defaultValue={account.lastName} name="lastName" required /></label></div><label className="block text-sm font-medium">E-mail<input className="mt-2 w-full rounded-lg border border-slate-300 p-3" defaultValue={account.email} name="email" required type="email" /></label><label className="block text-sm font-medium">Telefone<input className="mt-2 w-full rounded-lg border border-slate-300 p-3" defaultValue={account.phone} inputMode="tel" name="phone" required /></label><label className="block text-sm font-medium">Data de nascimento<input className="mt-2 w-full rounded-lg border border-slate-300 p-3" defaultValue={account.birthDate.slice(0, 10)} name="birthDate" required type="date" /></label>{error ? <p className={`text-sm ${error.includes("sucesso") ? "text-emerald-600" : "text-red-600"}`} role="status">{error}</p> : null}<button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Salvar alterações"}</button></form></div>;
}
