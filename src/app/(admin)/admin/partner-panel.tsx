"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

export default function PartnerPanel() {
  const [form, setForm] = useState({ name: "", slug: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/partner")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load the partner.");
        return (await response.json()).partner as { name: string; slug: string };
      })
      .then((partner) => setForm({ name: partner.name, slug: partner.slug }))
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
      setForm({ name: body.partner.name, slug: body.partner.slug });
      setMessage("Partner data updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the partner.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="flex flex-col gap-4 rounded-xl border p-6" onSubmit={(event) => void submit(event)}><div><h2 className="text-xl font-semibold">Partner</h2><p className="text-sm text-gray-500">Update the data used in the dashboard and public links.</p></div>{loading ? <p>Loading...</p> : <><label className="flex flex-col gap-1 text-sm">Name<input className="rounded border p-2" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="flex flex-col gap-1 text-sm">Slug<input className="rounded border p-2" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "Saving..." : "Save partner"}</button></>}{message ? <p aria-live="polite" className="text-sm">{message}</p> : null}</form>;
}
