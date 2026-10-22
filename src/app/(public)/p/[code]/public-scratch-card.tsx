"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type ParticipationStatus = "pending_registration" | "pending_confirmation" | "redeemed" | "rejected";
type State = { title: string; prizeDescription?: string; publicToken?: string; status?: ParticipationStatus };

export default function PublicScratchCard({ code }: { code: string }) {
  const publicCode = decodeURIComponent(code);
  const [promotion, setPromotion] = useState<State | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");
  const [scratched, setScratched] = useState(false);

  useEffect(() => {
    void fetch(`/api/public/promotions/${encodeURIComponent(publicCode)}`).then(async (response) => {
      if (!response.ok) throw new Error("Promoção não encontrada ou encerrada.");
      const body = await response.json();
      setPromotion(body.promotion);
    }).catch((reason: Error) => setError(reason.message));
  }, [publicCode]);

  useEffect(() => {
    if (!promotion?.publicToken || promotion.status !== "pending_confirmation") return;
    const refreshStatus = () => {
      void fetch(`/api/public/participations/${promotion.publicToken}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Não foi possível consultar o status do resgate.");
          return (await response.json()).participation as { status: ParticipationStatus };
        })
        .then((participation) => setPromotion((current) => current ? { ...current, status: participation.status } : current))
        .catch((reason: Error) => setError(reason.message));
    };
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 3000);
    return () => window.clearInterval(interval);
  }, [promotion?.publicToken, promotion?.status]);

  async function scratch() {
    setError("");
    const response = await fetch(`/api/public/promotions/${encodeURIComponent(publicCode)}`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "Não foi possível raspar."); return; }
    setPromotion((current) => ({ ...current, ...body.participation }));
    setScratched(true);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!promotion?.publicToken) return;
    const response = await fetch(`/api/public/participations/${promotion.publicToken}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "Não foi possível concluir o resgate."); return; }
    setPromotion((current) => current ? { ...current, status: body.participation.status } : current);
  }

  if (error && !promotion) return <main className="mx-auto flex min-h-screen max-w-md items-center p-8"><p>{error}</p></main>;
  const status = promotion?.status;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8 text-center">
    <p className="text-sm text-gray-500">SempreGanhe</p>
    <h1 className="text-3xl font-semibold">{promotion?.title ?? "Sua raspadinha"}</h1>
    {!scratched ? <button className="rounded-xl bg-black px-6 py-12 text-xl font-semibold text-white" onClick={() => void scratch()} type="button">Raspar e descobrir prêmio</button> : status === "redeemed" ? <div className="rounded-xl border p-6"><h2 className="text-xl font-semibold">Prêmio resgatado!</h2><p>Apresente esta confirmação ao parceiro.</p></div> : status === "rejected" ? <div className="rounded-xl border p-6"><h2 className="text-xl font-semibold">Resgate não aprovado</h2><p>O parceiro não confirmou esta participação.</p></div> : status === "pending_confirmation" ? <div className="rounded-xl border p-6"><h2 className="text-xl font-semibold">Aguardando confirmação</h2><p>O parceiro precisa confirmar seu pedido para liberar o prêmio.</p></div> : <form className="flex flex-col gap-4 rounded-xl border p-6 text-left" onSubmit={(event) => void register(event)}><p className="text-center text-xl font-semibold">{promotion?.prizeDescription}</p><p className="text-sm text-gray-600">Cadastre-se para solicitar o resgate. O parceiro confirmará após validar o pedido.</p><label className="flex flex-col gap-1">Nome<input className="rounded border p-2" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="flex flex-col gap-1">Telefone<input className="rounded border p-2" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className="rounded bg-black px-4 py-2 text-white" type="submit">Solicitar resgate</button></form>}
    {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
  </main>;
}
