"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Account = {
  name: string;
  email: string;
  phone: string | null;
  documentType: "CPF" | "CNPJ" | null;
  documentNumber: string | null;
  billingAddress: string | null;
  role: "owner" | "admin";
};

const emptyProfile = { name: "", phone: "", documentType: "", documentNumber: "", billingAddress: "" };

export default function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/account")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar a conta.");
        return body.account as Account;
      })
      .then((value) => {
        setAccount(value);
        setEmail(value.email);
        setProfile({
          name: value.name,
          phone: value.phone ?? "",
          documentType: value.documentType ?? "",
          documentNumber: value.documentNumber ?? "",
          billingAddress: value.billingAddress ?? "",
        });
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("PATCH", { ...profile, documentType: profile.documentType || null, phone: profile.phone || null, documentNumber: profile.documentNumber || null, billingAddress: profile.billingAddress || null }, "Dados pessoais atualizados.");
  }

  async function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("PUT", { email }, "E-mail atualizado.");
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("POST", passwords, "Senha atualizada.");
    setPasswords({ currentPassword: "", newPassword: "" });
  }

  async function submit(method: "PATCH" | "PUT" | "POST", body: object, successMessage: string) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/account", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar as alterações.");
      if (result.account) {
        setAccount(result.account);
        setEmail(result.account.email);
      }
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Carregando conta...</p>;
  if (!account) return <p aria-live="polite">{message || "Conta não encontrada."}</p>;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border bg-white p-6">
        <div className="mb-5 flex items-center gap-3"><h2 className="text-xl font-semibold">Informações da conta</h2><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{account.role === "owner" ? "Owner" : "Admin"}</span></div>
        <div className="flex flex-col gap-6">
          <form className="grid gap-3 border-b pb-6 sm:grid-cols-[1fr_2fr_auto] sm:items-end" onSubmit={(event) => void saveEmail(event)}>
            <label className="text-sm font-medium" htmlFor="account-email">E-mail</label>
            <input className="rounded border p-2" id="account-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <button className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50" disabled={saving} type="submit">Alterar e-mail</button>
          </form>
          <form className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end" onSubmit={(event) => void savePassword(event)}>
            <label className="text-sm font-medium" htmlFor="current-password">Senha</label>
            <div className="grid gap-2 sm:grid-cols-2"><input aria-label="Senha atual" className="rounded border p-2" id="current-password" minLength={1} placeholder="Senha atual" required type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /><input aria-label="Nova senha" className="rounded border p-2" minLength={8} placeholder="Nova senha (mínimo 8 caracteres)" required type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /></div>
            <button className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50" disabled={saving} type="submit">Alterar senha</button>
          </form>
        </div>
      </section>

      <form className="rounded-xl border bg-white p-6" onSubmit={(event) => void saveProfile(event)}>
        <h2 className="mb-5 text-xl font-semibold">Informações pessoais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">Nome completo<input className="rounded border p-2 font-normal" required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm font-medium">Número de telefone<input className="rounded border p-2 font-normal" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm font-medium">Tipo de documento<select className="rounded border p-2 font-normal" value={profile.documentType} onChange={(event) => setProfile({ ...profile, documentType: event.target.value })}><option value="">Não informado</option><option value="CPF">CPF</option><option value="CNPJ">CNPJ</option></select></label>
          <label className="flex flex-col gap-1 text-sm font-medium">Número do documento<input className="rounded border p-2 font-normal" value={profile.documentNumber} onChange={(event) => setProfile({ ...profile, documentNumber: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">Endereço de cobrança<textarea className="rounded border p-2 font-normal" rows={3} value={profile.billingAddress} onChange={(event) => setProfile({ ...profile, billingAddress: event.target.value })} /></label>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4"><p aria-live="polite" className="text-sm">{message}</p><button className="rounded bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Salvar alterações"}</button></div>
      </form>
    </div>
  );
}
