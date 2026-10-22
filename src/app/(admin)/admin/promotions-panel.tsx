"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Promotion = {
  id: string;
  title: string;
  prizeDescription: string;
  publicCode: string;
  status: string;
  startsAt: string;
  endsAt: string;
};

const initialForm = {
  title: "",
  prizeDescription: "",
  publicCode: "",
  status: "draft",
  startsAt: "",
  endsAt: "",
};

export default function PromotionsPanel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchPromotions() {
    const response = await fetch("/api/admin/promotions");
    if (!response.ok) throw new Error("Não foi possível carregar as promoções.");
    return (await response.json()).promotions as Promotion[];
  }

  useEffect(() => {
    let cancelled = false;
    void fetchPromotions()
      .then((items) => { if (!cancelled) setPromotions(items); })
      .catch((error: Error) => { if (!cancelled) setMessage(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Não foi possível criar a promoção.");
      }
      setForm(initialForm);
      setMessage("Promoção criada com sucesso.");
      setPromotions(await fetchPromotions());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar a promoção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <form className="flex flex-col gap-4 rounded-xl border p-6" onSubmit={(event) => void submit(event)}>
        <div>
          <h2 className="text-xl font-semibold">Nova promoção</h2>
          <p className="text-sm text-gray-500">Cadastre o prêmio fixo da promoção.</p>
        </div>
        <label className="flex flex-col gap-1 text-sm">Título<input className="rounded border p-2" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-sm">Prêmio<input className="rounded border p-2" required value={form.prizeDescription} onChange={(event) => setForm({ ...form, prizeDescription: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-sm">Código público<input className="rounded border p-2" required value={form.publicCode} onChange={(event) => setForm({ ...form, publicCode: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-sm">Status<select className="rounded border p-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Rascunho</option><option value="active">Ativa</option><option value="paused">Pausada</option></select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">Início<input className="rounded border p-2" required type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm">Fim<input className="rounded border p-2" required type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label>
        </div>
        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Criar promoção"}</button>
        {message ? <p aria-live="polite" className="text-sm">{message}</p> : null}
      </form>

      <div className="rounded-xl border p-6" id="promotions-list">
        <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">Promoções cadastradas</h2></div>
        {loading ? <p>Carregando...</p> : promotions.length === 0 ? <p className="text-gray-500">Nenhuma promoção cadastrada.</p> : <ul className="divide-y">{promotions.map((promotion) => <li className="py-4" key={promotion.id}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{promotion.title}</p><p className="text-sm text-gray-600">{promotion.prizeDescription}</p><p className="text-xs text-gray-500">Código: {promotion.publicCode}</p><a aria-label={`Abrir raspadinha: ${promotion.title}`} className="mt-2 inline-flex text-xs font-medium text-blue-600 underline hover:text-blue-800" href={`/p/${encodeURIComponent(promotion.publicCode)}`} rel="noreferrer" target="_blank">Abrir raspadinha</a></div><span className="rounded bg-gray-100 px-2 py-1 text-xs">{promotion.status}</span></div></li>)}</ul>}
      </div>
    </section>
  );
}
