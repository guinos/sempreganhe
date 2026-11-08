import ParticipationsPanel from "../participations-panel";
import PromotionsPanel from "../promotions-panel";
import PointsPanel from "../points-panel";

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-4 sm:p-8">
      <header className="border-b pb-6">
        <p className="text-sm text-gray-500">Marketing</p>
        <h1 className="mt-2 text-3xl font-semibold">Promoções e resgates</h1>
      </header>
      <section id="promotion-create" className="scroll-mt-6">
        <PromotionsPanel />
      </section>
      <section id="participations" className="scroll-mt-6">
        <ParticipationsPanel />
      </section>
      <section id="point-redemptions" className="scroll-mt-6">
        <PointsPanel />
      </section>
    </main>
  );
}
