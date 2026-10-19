import { requireAdminSession } from "@/lib/auth";
import PromotionsPanel from "./promotions-panel";
import ParticipationsPanel from "./participations-panel";
import RestaurantPanel from "./restaurant-panel";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Restaurante: {session.restaurantId}</p>
          <h1 className="text-3xl font-semibold">Promoções</h1>
        </div>
      </header>
      <PromotionsPanel />
      <RestaurantPanel />
      <ParticipationsPanel />
    </main>
  );
}
