"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type TeamMember = { id: string; name: string; email: string; role: "owner" | "admin"; active: boolean; createdAt: string };
type NewMember = { name: string; email: string; password: string };

const permissions = ["Pedidos", "Produtos", "Mostrar/Ocultar", "Aparência", "Inventário", "Vendas", "Configurações", "Cozinha"];

export default function TeamPanel() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [form, setForm] = useState<NewMember>({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTeam() {
    const response = await fetch("/api/admin/team");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar a equipe.");
    setTeam(body.team as TeamMember[]);
  }

  useEffect(() => {
    void fetch("/api/admin/team")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar a equipe.");
        return body.team as TeamMember[];
      })
      .then((members) => setTeam(members))
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, role: "admin" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível adicionar o usuário.");
      setForm({ name: "", email: "", password: "" });
      setMessage("Usuário adicionado à equipe.");
      await loadTeam();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível adicionar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleMember(member: TeamMember) {
    setMessage("");
    const response = await fetch(`/api/admin/team/${member.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !member.active }) });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error ?? "Não foi possível atualizar o usuário.");
      return;
    }
    setTeam((current) => current.map((item) => item.id === member.id ? body.member as TeamMember : item));
  }

  return <div className="flex flex-col gap-6">
    <section className="rounded-xl border bg-white p-6">
      <details open>
        <summary className="cursor-pointer font-semibold">Saiba mais sobre as funções</summary>
        <div className="mt-4 overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-3">Função</th>{permissions.map((permission) => <th className="p-3 text-center font-normal" key={permission}>{permission} <span className="text-blue-600" title="Permissão de referência">ⓘ</span></th>)}</tr></thead><tbody>{[["Admin", permissions], ["Manager", permissions], ["Garçom", ["Pedidos", "Produtos", "Mostrar/Ocultar"]], ["Caixa", ["Pedidos", "Mostrar/Ocultar", "Inventário", "Vendas"]], ["Cozinheiro", ["Cozinha"]], ["Entregador", ["Pedidos"]]].map(([role, allowed]) => <tr className="border-b last:border-0" key={role as string}><td className="p-3 font-medium">{role as string} <span className="text-blue-600" title="Função de referência">ⓘ</span></td>{permissions.map((permission) => <td className="p-3 text-center text-lg" key={permission}>{(allowed as string[]).includes(permission as string) ? <span className="text-green-600">✓</span> : <span className="text-gray-200">✓</span>}</td>)}</tr>)}</tbody></table></div>
      </details>
    </section>

    <section className="rounded-xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Usuários da equipe</h2>
      {loading ? <p>Carregando...</p> : <div className="overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Função</th><th className="p-3">Estado</th><th className="p-3">Ações</th></tr></thead><tbody>{team.map((member) => <tr className="border-b last:border-0" key={member.id}><td className="p-3">{member.name}</td><td className="p-3">{member.email}</td><td className="p-3"><span className="rounded-full border border-blue-500 px-3 py-1 text-xs text-blue-600">{member.role === "owner" ? "Owner" : "Admin"}</span></td><td className="p-3">{member.active ? "Ativo" : "Inativo"}</td><td className="p-3">{member.role === "admin" ? <button className="text-blue-600 underline" onClick={() => void toggleMember(member)} type="button">{member.active ? "Desativar" : "Ativar"}</button> : <span className="text-gray-400">Conta principal</span>}</td></tr>)}</tbody></table></div>}
      <form className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2" onSubmit={(event) => void addMember(event)}><h3 className="sm:col-span-2 font-semibold">Adicionar usuário</h3><input aria-label="Nome do usuário" className="rounded border p-2" placeholder="Nome" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><input aria-label="E-mail do usuário" className="rounded border p-2" placeholder="E-mail" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><input aria-label="Senha inicial" className="rounded border p-2" minLength={8} placeholder="Senha inicial (mínimo 8 caracteres)" required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button className="rounded bg-green-600 px-4 py-2 font-medium text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Adicionando..." : "+ Adicionar usuário"}</button></form>
      {message ? <p aria-live="polite" className="mt-4 text-sm">{message}</p> : null}
    </section>
  </div>;
}
