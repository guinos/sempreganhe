import { requireAdminSession } from "@/lib/auth";
import PromotionsPanel from "./promotions-panel";
import ParticipationsPanel from "./participations-panel";
import PartnerPanel from "./partner-panel";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-4 sm:p-8" data-partner-id={session.partnerId}>
      <header className="flex flex-col gap-2 border-b pb-6">
        <div>
          <p className="text-sm text-gray-500">Visão geral do seu negócio</p>
          <h1 className="text-3xl font-semibold">Bem-vindo ao painel</h1>
        </div>
      </header>
      <section aria-label="Resumo do painel" className="grid gap-4 sm:grid-cols-3">
        <a className="rounded-xl border bg-white p-5 transition hover:border-slate-400" href="#promotion-create">
          <p className="text-sm text-gray-500">Marketing</p>
          <p className="mt-1 font-semibold">Criar promoção</p>
        </a>
        <a className="rounded-xl border bg-white p-5 transition hover:border-slate-400" href="#partner">
          <p className="text-sm text-gray-500">Configurações</p>
          <p className="mt-1 font-semibold">Info do negócio</p>
        </a>
        <a className="rounded-xl border bg-white p-5 transition hover:border-slate-400" href="#participations">
          <p className="text-sm text-gray-500">Marketing</p>
          <p className="mt-1 font-semibold">Participação e resgate</p>
        </a>
      </section>
      <section id="promotion-create" className="scroll-mt-6">
        <PromotionsPanel />
      </section>
      <section id="partner" className="scroll-mt-6">
        <PartnerPanel />
      </section>
      <section id="participations" className="scroll-mt-6">
        <ParticipationsPanel />
      </section>
    </main>
  );
}
