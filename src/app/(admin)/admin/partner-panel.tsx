"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

export default function PartnerPanel() {
  const [form, setForm] = useState({ name: "", slug: "", whatsappPhone: "", address: "", hideAddress: false, currency: "BRL", language: "pt-BR", businessType: "", businessHours: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/partner")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load the partner.");
        return (await response.json()).partner as typeof form;
      })
      .then((partner) => setForm({ name: partner.name, slug: partner.slug, whatsappPhone: partner.whatsappPhone ?? "", address: partner.address ?? "", hideAddress: partner.hideAddress, currency: partner.currency, language: partner.language, businessType: partner.businessType ?? "", businessHours: partner.businessHours ?? "" }))
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/partner", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to save the partner.");
      setForm({ name: body.partner.name, slug: body.partner.slug, whatsappPhone: body.partner.whatsappPhone ?? "", address: body.partner.address ?? "", hideAddress: body.partner.hideAddress, currency: body.partner.currency, language: body.partner.language, businessType: body.partner.businessType ?? "", businessHours: body.partner.businessHours ?? "" });
      setMessage("Informações atualizadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the partner.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="flex flex-col gap-6 rounded-xl border bg-white p-6" onSubmit={(event) => void submit(event)}><div><h2 className="text-xl font-semibold">Informações do negócio</h2><p className="text-sm text-gray-500">Configure os dados exibidos no painel e nos links públicos.</p></div>{loading ? <p>Carregando...</p> : <><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm">Nome do negócio<input className="rounded border p-2" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Slug<input className="rounded border p-2" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">WhatsApp para pedidos<input className="rounded border p-2" value={form.whatsappPhone} onChange={(event) => setForm({ ...form, whatsappPhone: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Tipo de negócio<input className="rounded border p-2" placeholder="Ex.: Restaurante, loja ou serviço" value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm sm:col-span-2">Endereço<textarea className="rounded border p-2" rows={2} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label></div><label className="flex items-center gap-2 text-sm"><input checked={form.hideAddress} type="checkbox" onChange={(event) => setForm({ ...form, hideAddress: event.target.checked })} />Não mostrar o endereço no menu digital</label><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm">Moeda<select className="rounded border p-2" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option value="BRL">BRL</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label><label className="flex flex-col gap-1 text-sm">Idioma<select className="rounded border p-2" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="pt-BR">Português</option><option value="en-US">English</option><option value="es-ES">Español</option></select></label></div><label className="flex flex-col gap-1 text-sm">Horário de atendimento<textarea className="rounded border p-2" placeholder="Ex.: Segunda a sexta, das 11h às 22h" rows={3} value={form.businessHours} onChange={(event) => setForm({ ...form, businessHours: event.target.value })} /></label><button className="self-end rounded bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Salvar alterações"}</button></>}{message ? <p aria-live="polite" className="text-sm">{message}</p> : null}</form>;
}
