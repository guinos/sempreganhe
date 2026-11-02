"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";

type Promotion = {
  id: string;
  title: string;
  prizeDescription: string;
  publicCode: string;
  status: string;
  startsAt: string;
  endsAt: string;
  maxParticipationsPerCustomer: number;
};

const initialForm = {
  title: "",
  prizeDescription: "",
  publicCode: "",
  status: "draft",
  startsAt: "",
  endsAt: "",
  maxParticipationsPerCustomer: 1,
};
const PROMOTIONS_PAGE_SIZE = 10;

type PromotionForm = typeof initialForm;
type PromotionFilter = "all" | "active" | "inactive";

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function PromotionsPanel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedQr, setSelectedQr] = useState<{ promotion: Promotion; url: string } | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editForm, setEditForm] = useState<PromotionForm>(initialForm);
  const [promotionFilter, setPromotionFilter] = useState<PromotionFilter>("all");
  const [promotionPage, setPromotionPage] = useState(0);

  function publicUrl(promotion: Promotion) {
    return `${window.location.origin}/p/${encodeURIComponent(promotion.publicCode)}`;
  }

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

  function startEditing(promotion: Promotion) {
    setEditingPromotion(promotion);
    setEditForm({
      title: promotion.title,
      prizeDescription: promotion.prizeDescription,
      publicCode: promotion.publicCode,
      status: promotion.status,
      startsAt: toDateTimeLocal(promotion.startsAt),
      endsAt: toDateTimeLocal(promotion.endsAt),
      maxParticipationsPerCustomer: promotion.maxParticipationsPerCustomer,
    });
    setMessage("");
  }

  async function updatePromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPromotion) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/promotions/${editingPromotion.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Não foi possível atualizar a promoção.");
      setEditingPromotion(null);
      setMessage("Promoção atualizada com sucesso.");
      setPromotions(await fetchPromotions());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a promoção.");
    } finally {
      setSaving(false);
    }
  }

  async function pausePromotion(promotion: Promotion) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Não foi possível inativar a promoção.");
      setMessage("Promoção inativada.");
      setPromotions(await fetchPromotions());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível inativar a promoção.");
    } finally {
      setSaving(false);
    }
  }

  const filteredPromotions = promotions.filter((promotion) => {
    if (promotionFilter === "all") return true;
    const isActive = promotion.status === "active";
    return promotionFilter === "active" ? isActive : !isActive;
  });
  const pageCount = Math.max(1, Math.ceil(filteredPromotions.length / PROMOTIONS_PAGE_SIZE));
  const currentPromotionPage = Math.min(promotionPage, pageCount - 1);
  const visiblePromotions = filteredPromotions.slice(currentPromotionPage * PROMOTIONS_PAGE_SIZE, (currentPromotionPage + 1) * PROMOTIONS_PAGE_SIZE);

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
        <label className="flex flex-col gap-1 text-sm">Participações máximas por cliente<input className="rounded border p-2" min="1" required type="number" value={form.maxParticipationsPerCustomer} onChange={(event) => setForm({ ...form, maxParticipationsPerCustomer: Number(event.target.value) })} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">Início<input className="rounded border p-2" required type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm">Fim<input className="rounded border p-2" required type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label>
        </div>
        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Criar promoção"}</button>
        {message ? <p aria-live="polite" className="text-sm">{message}</p> : null}
      </form>

      <div className="rounded-xl border p-6" id="promotions-list">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">Promoções cadastradas</h2><label className="flex items-center gap-2 text-sm text-gray-600">Filtrar<select aria-label="Filtrar promoções por status" className="rounded border p-2 text-gray-900" value={promotionFilter} onChange={(event) => { setPromotionFilter(event.target.value as PromotionFilter); setPromotionPage(0); }}><option value="all">Todas ({promotions.length})</option><option value="active">Ativas ({promotions.filter((promotion) => promotion.status === "active").length})</option><option value="inactive">Inativas ({promotions.filter((promotion) => promotion.status !== "active").length})</option></select></label></div>
        {loading ? <p>Carregando...</p> : promotions.length === 0 ? <p className="text-gray-500">Nenhuma promoção cadastrada.</p> : filteredPromotions.length === 0 ? <p className="text-gray-500">Nenhuma promoção encontrada neste filtro.</p> : <><ul className="divide-y">{visiblePromotions.map((promotion) => <li className="py-4" key={promotion.id}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{promotion.title}</p><p className="text-sm text-gray-600">{promotion.prizeDescription}</p><p className="text-xs text-gray-500">Código: {promotion.publicCode}</p><div className="mt-2 flex flex-wrap gap-3"><a aria-label={`Abrir raspadinha: ${promotion.title}`} className="inline-flex text-xs font-medium text-blue-600 underline hover:text-blue-800" href={`/p/${encodeURIComponent(promotion.publicCode)}`} rel="noreferrer" target="_blank">Abrir raspadinha</a><button className="text-xs font-medium text-blue-600 underline hover:text-blue-800" onClick={() => setSelectedQr({ promotion, url: publicUrl(promotion) })} type="button">Ver QR Code</button><button className="text-xs font-medium text-blue-600 underline hover:text-blue-800" onClick={() => startEditing(promotion)} type="button">Editar</button>{promotion.status === "active" && <button className="text-xs font-medium text-red-600 underline hover:text-red-800" disabled={saving} onClick={() => void pausePromotion(promotion)} type="button">Inativar</button>}</div></div><span className="rounded bg-gray-100 px-2 py-1 text-xs">{promotion.status}</span></div></li>)}</ul><div className="mt-4 flex items-center justify-between gap-4 border-t pt-4"><button className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40" disabled={promotionPage === 0} onClick={() => setPromotionPage((page) => page - 1)} type="button">Anterior</button><span className="text-sm text-gray-500">Página {promotionPage + 1} de {pageCount}</span><button className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40" disabled={promotionPage >= pageCount - 1} onClick={() => setPromotionPage((page) => page + 1)} type="button">Próximas 10</button></div></>}
      </div>

      {editingPromotion ? <div aria-label="Editar promoção" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingPromotion(null)} role="presentation"><form aria-labelledby="edit-promotion-title" className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void updatePromotion(event)}><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold" id="edit-promotion-title">Editar promoção</h3><p className="text-sm text-gray-500">Atualize o período ou altere o status da promoção.</p></div><button aria-label="Fechar edição" className="text-2xl leading-none text-gray-500" onClick={() => setEditingPromotion(null)} type="button">×</button></div><label className="flex flex-col gap-1 text-sm">Título<input className="rounded border p-2" required value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Prêmio<input className="rounded border p-2" required value={editForm.prizeDescription} onChange={(event) => setEditForm({ ...editForm, prizeDescription: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Código público<input className="rounded border p-2" required value={editForm.publicCode} onChange={(event) => setEditForm({ ...editForm, publicCode: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Status<select className="rounded border p-2" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}><option value="draft">Rascunho</option><option value="active">Ativa</option><option value="paused">Inativa</option><option value="ended">Encerrada</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm">Início<input className="rounded border p-2" required type="datetime-local" value={editForm.startsAt} onChange={(event) => setEditForm({ ...editForm, startsAt: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Fim<input className="rounded border p-2" required type="datetime-local" value={editForm.endsAt} onChange={(event) => setEditForm({ ...editForm, endsAt: event.target.value })} /></label></div><div className="flex justify-end gap-3"><button className="rounded border px-4 py-2" onClick={() => setEditingPromotion(null)} type="button">Cancelar</button><button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Salvar alterações"}</button></div></form></div> : null}

      {selectedQr ? <div aria-label="QR Code da promoção" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedQr(null)} role="presentation"><div aria-labelledby="qr-title" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Uma chance especial para você</p><h3 className="mt-1 text-2xl font-bold" id="qr-title">Raspe e Ganhe</h3><p className="mt-2 text-sm text-gray-500">Raspe, descubra seu prêmio e aproveite esta promoção exclusiva.</p><p className="mt-3 text-sm font-semibold text-gray-800">Acesse a promoção pelo QR Code abaixo.</p></div><button aria-label="Fechar" className="text-2xl leading-none text-gray-500" onClick={() => setSelectedQr(null)} type="button">×</button></div><div className="mt-5 flex justify-center rounded-lg bg-white p-3"><QRCodeSVG bgColor="#ffffff" fgColor="#111111" marginSize={4} size={240} title={`QR Code para ${selectedQr.promotion.title}`} value={selectedQr.url} /></div></div></div> : null}
    </section>
  );
}
