"use client";

import { FormEvent, useEffect, useState } from "react";

export default function RestaurantPanel() {
  const [form, setForm] = useState({ name: "", slug: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/restaurant")
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar o restaurante.");
        return (await response.json()).restaurant as { name: string; slug: string };
      })
      .then((restaurant) => setForm({ name: restaurant.name, slug: restaurant.slug }))
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/restaurant", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível salvar o restaurante.");
      setForm({ name: body.restaurant.name, slug: body.restaurant.slug });
      setMessage("Dados do restaurante atualizados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o restaurante.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="flex flex-col gap-4 rounded-xl border p-6" onSubmit={(event) => void submit(event)}><div><h2 className="text-xl font-semibold">Restaurante</h2><p className="text-sm text-gray-500">Atualize os dados usados no painel e nos links públicos.</p></div>{loading ? <p>Carregando...</p> : <><label className="flex flex-col gap-1 text-sm">Nome<input className="rounded border p-2" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Slug<input className="rounded border p-2" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Salvando..." : "Salvar restaurante"}</button></>}{message && <p aria-live="polite" className="text-sm">{message}</p>}</form>;
}
