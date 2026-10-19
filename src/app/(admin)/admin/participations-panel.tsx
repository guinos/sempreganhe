"use client";

import { useEffect, useState } from "react";

type Participation = {
  id: string;
  prizeDescription: string;
  status: "pending_registration" | "pending_confirmation" | "redeemed" | "rejected";
  scrapedAt: string;
  promotionTitle: string;
  customerName: string | null;
  customerPhone: string | null;
};

export default function ParticipationsPanel() {
  const [items, setItems] = useState<Participation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/participations")
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar os resgates.");
        return (await response.json()).participations as Participation[];
      })
      .then((data) => { if (!cancelled) setItems(data); })
      .catch((reason: Error) => { if (!cancelled) setError(reason.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function updateStatus(id: string, action: "confirm" | "reject") {
    setActionId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/participations/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível atualizar o resgate.");
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: body.participation.status } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o resgate.");
    } finally {
      setActionId(null);
    }
  }

  function statusLabel(status: Participation["status"]) {
    if (status === "pending_registration") return "Pendente de cadastro";
    if (status === "pending_confirmation") return "Aguardando confirmação";
    if (status === "rejected") return "Recusado";
    return "Resgatado";
  }

  return (
    <section className="rounded-xl border p-6">
      <div className="mb-4"><h2 className="text-xl font-semibold">Participações e resgates</h2><p className="text-sm text-gray-500">Acompanhe quem raspou e quem concluiu o cadastro.</p></div>
      {loading && <p>Carregando...</p>}
      {error && <p aria-live="polite" className="text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="text-gray-500">Nenhuma participação ainda.</p>}
      {!loading && !error && items.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2 pr-4">Promoção</th><th className="py-2 pr-4">Prêmio</th><th className="py-2 pr-4">Cliente</th><th className="py-2 pr-4">Status</th><th className="py-2">Ação</th></tr></thead><tbody>{items.map((item) => <tr className="border-b last:border-0" key={item.id}><td className="py-3 pr-4">{item.promotionTitle}</td><td className="py-3 pr-4">{item.prizeDescription}</td><td className="py-3 pr-4">{item.customerName ? <>{item.customerName}<br /><span className="text-xs text-gray-500">{item.customerPhone}</span></> : <span className="text-gray-500">Aguardando cadastro</span>}</td><td className="py-3 pr-4">{statusLabel(item.status)}</td><td className="py-3">{item.status === "pending_confirmation" && <div className="flex gap-2"><button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" disabled={actionId === item.id} onClick={() => void updateStatus(item.id, "confirm")} type="button">Confirmar</button><button className="rounded border px-3 py-1 disabled:opacity-50" disabled={actionId === item.id} onClick={() => void updateStatus(item.id, "reject")} type="button">Recusar</button></div>}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
