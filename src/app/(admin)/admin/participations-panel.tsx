"use client";

import { useEffect, useMemo, useState } from "react";

type Participation = {
  id: string;
  prizeDescription: string;
  status: "pending_registration" | "pending_confirmation" | "redeemed" | "rejected";
  scrapedAt: string;
  promotionTitle: string;
  customerName: string | null;
  customerPhone: string | null;
};
const PARTICIPATIONS_PAGE_SIZE = 10;

export default function ParticipationsPanel() {
  const [items, setItems] = useState<Participation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Participation["status"]>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

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

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const searchableText = [item.promotionTitle, item.prizeDescription, item.customerName ?? "", item.customerPhone ?? ""].join(" ").toLocaleLowerCase();
      return matchesStatus && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [items, search, statusFilter]);

  const pendingConfirmationCount = items.filter((item) => item.status === "pending_confirmation").length;
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PARTICIPATIONS_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleItems = filteredItems.slice(currentPage * PARTICIPATIONS_PAGE_SIZE, (currentPage + 1) * PARTICIPATIONS_PAGE_SIZE);

  return (
    <section className="rounded-xl border p-6">
      <div className="mb-4"><h2 className="text-xl font-semibold">Participações e resgates</h2><p className="text-sm text-gray-500">Acompanhe quem raspou e quem concluiu o cadastro.</p></div>
      {loading ? <p>Carregando...</p> : null}
      {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error && items.length === 0 && <p className="text-gray-500">Nenhuma participação ainda.</p>}
      {!loading && !error && items.length > 0 && <>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-semibold">{items.length}</p></div>
          <div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-gray-600">Aguardando confirmação</p><p className="text-2xl font-semibold">{pendingConfirmationCount}</p></div>
          <div className="rounded-lg bg-green-50 p-3"><p className="text-xs text-gray-600">Resgatados</p><p className="text-2xl font-semibold">{items.filter((item) => item.status === "redeemed").length}</p></div>
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1 text-sm">Buscar<input className="rounded border p-2" placeholder="Cliente, telefone, promoção ou prêmio" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label>
          <label className="flex flex-col gap-1 text-sm sm:w-56">Status<select className="rounded border p-2" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as "all" | Participation["status"]); setPage(0); }}><option value="all">Todos</option><option value="pending_registration">Pendente de cadastro</option><option value="pending_confirmation">Aguardando confirmação</option><option value="redeemed">Resgatado</option><option value="rejected">Recusado</option></select></label>
        </div>
        {filteredItems.length === 0 ? <p className="text-gray-500">Nenhuma participação corresponde aos filtros.</p> : <><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2 pr-4">Promoção</th><th className="py-2 pr-4">Prêmio</th><th className="py-2 pr-4">Cliente</th><th className="py-2 pr-4">Data</th><th className="py-2 pr-4">Status</th><th className="py-2">Ação</th></tr></thead><tbody>{visibleItems.map((item) => <tr className="border-b last:border-0" key={item.id}><td className="py-3 pr-4">{item.promotionTitle}</td><td className="py-3 pr-4">{item.prizeDescription}</td><td className="py-3 pr-4">{item.customerName ? <>{item.customerName}<br /><span className="text-xs text-gray-500">{item.customerPhone}</span></> : <span className="text-gray-500">Aguardando cadastro</span>}</td><td className="whitespace-nowrap py-3 pr-4 text-xs text-gray-500">{new Date(item.scrapedAt).toLocaleString("pt-BR")}</td><td className="py-3 pr-4">{statusLabel(item.status)}</td><td className="py-3">{item.status === "pending_confirmation" && <div className="flex gap-2"><button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" disabled={actionId === item.id} onClick={() => void updateStatus(item.id, "confirm")} type="button">Confirmar</button><button className="rounded border px-3 py-1 disabled:opacity-50" disabled={actionId === item.id} onClick={() => void updateStatus(item.id, "reject")} type="button">Recusar</button></div>}</td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between gap-4 border-t pt-4"><button className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage === 0} onClick={() => setPage((page) => page - 1)} type="button">Anterior</button><span className="text-sm text-gray-500">Página {currentPage + 1} de {pageCount}</span><button className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage >= pageCount - 1} onClick={() => setPage((page) => page + 1)} type="button">Próximas 10</button></div></>}
      </>}
    </section>
  );
}
