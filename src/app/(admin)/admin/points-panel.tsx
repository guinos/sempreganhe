"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Reward = { id: string; title: string; description: string | null; redemptionType: "percentage" | "fixed_amount"; discountValue: number; active: boolean };
type Redemption = { id: string; customerName: string; customerPhone: string; rewardTitle: string; pointsCost: number; status: "pending" | "confirmed" | "rejected"; requestedAt: string };

export default function PointsPanel() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [form, setForm] = useState({ title: "", description: "", redemptionType: "percentage", discountValue: 10 });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [rewardResponse, redemptionResponse] = await Promise.all([fetch("/api/admin/point-rewards"), fetch("/api/admin/point-redemptions")]);
      if (!rewardResponse.ok || !redemptionResponse.ok) throw new Error("Não foi possível carregar os pontos.");
      setRewards((await rewardResponse.json()).rewards as Reward[]);
      setRedemptions((await redemptionResponse.json()).redemptions as Redemption[]);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível carregar os pontos.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/point-rewards", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Recompensa criada." : body.error ?? "Não foi possível criar a recompensa.");
    if (response.ok) { setForm({ title: "", description: "", redemptionType: "percentage", discountValue: 10 }); await load(); }
    setSaving(false);
  }

  async function updateRedemption(id: string, action: "confirm" | "reject") {
    const response = await fetch(`/api/admin/point-redemptions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Resgate atualizado." : body.error ?? "Não foi possível atualizar o resgate.");
    if (response.ok) await load();
  }

  return <div className="space-y-8"><section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><form className="flex flex-col gap-4 rounded-xl border p-6" onSubmit={(event) => void createReward(event)}><div><p className="text-sm text-gray-500">Resgate de pontos</p><h2 className="text-xl font-semibold">Nova recompensa de 100 pontos</h2><p className="text-sm text-gray-500">Configure o benefício que o cliente poderá solicitar ao atingir 100 pontos.</p></div><label className="flex flex-col gap-1 text-sm">Título<input className="rounded border p-2" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="10% de desconto" /></label><label className="flex flex-col gap-1 text-sm">Descrição<input className="rounded border p-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Válido em um pedido" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm">Tipo<select className="rounded border p-2" value={form.redemptionType} onChange={(event) => setForm({ ...form, redemptionType: event.target.value })}><option value="percentage">Desconto percentual</option><option value="fixed_amount">Desconto em R$</option></select></label><label className="flex flex-col gap-1 text-sm">Valor<input className="rounded border p-2" min="1" required type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} /></label></div><button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Cadastrar recompensa"}</button>{message ? <p aria-live="polite" className="text-sm">{message}</p> : null}</form><section className="rounded-xl border p-6"><h2 className="text-xl font-semibold">Recompensas cadastradas</h2>{rewards.length === 0 ? <p className="mt-4 text-sm text-gray-500">Nenhuma recompensa cadastrada.</p> : <ul className="mt-4 divide-y">{rewards.map((reward) => <li className="flex items-center justify-between gap-4 py-3" key={reward.id}><div><p className="font-medium">{reward.title}</p><p className="text-sm text-gray-500">{reward.description ?? `${reward.discountValue}${reward.redemptionType === "percentage" ? "% de desconto" : " de desconto"}`}</p></div><span className="rounded bg-gray-100 px-2 py-1 text-xs">{reward.active ? "Ativa" : "Inativa"}</span></li>)}</ul>}</section></section><section className="rounded-xl border p-6"><h2 className="text-xl font-semibold">Solicitações de resgate de pontos</h2><p className="text-sm text-gray-500">Confirme o pedido do cliente para concluir o benefício ou recuse para devolver os pontos.</p>{redemptions.length === 0 ? <p className="mt-4 text-sm text-gray-500">Nenhuma solicitação.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2 pr-4">Cliente</th><th className="py-2 pr-4">Recompensa</th><th className="py-2 pr-4">Data</th><th className="py-2 pr-4">Status</th><th className="py-2">Ação</th></tr></thead><tbody>{redemptions.map((redemption) => <tr className="border-b last:border-0" key={redemption.id}><td className="py-3 pr-4">{redemption.customerName}<br /><span className="text-xs text-gray-500">{redemption.customerPhone}</span></td><td className="py-3 pr-4">{redemption.rewardTitle}<br /><span className="text-xs text-gray-500">{redemption.pointsCost} pontos</span></td><td className="py-3 pr-4 text-xs text-gray-500">{new Date(redemption.requestedAt).toLocaleString("pt-BR")}</td><td className="py-3 pr-4">{redemption.status === "pending" ? "Pendente" : redemption.status === "confirmed" ? "Confirmado" : "Recusado"}</td><td className="py-3">{redemption.status === "pending" && <div className="flex gap-2"><button className="rounded bg-black px-3 py-1 text-white" onClick={() => void updateRedemption(redemption.id, "confirm")} type="button">Confirmar</button><button className="rounded border px-3 py-1" onClick={() => void updateRedemption(redemption.id, "reject")} type="button">Recusar</button></div>}</td></tr>)}</tbody></table></div>}</section></div>;
}
