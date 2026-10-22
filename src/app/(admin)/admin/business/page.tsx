import PartnerPanel from "../partner-panel";

export default function BusinessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <p className="text-sm text-gray-500">Configurações</p>
        <h1 className="text-3xl font-semibold">Informações do negócio</h1>
      </header>
      <PartnerPanel />
    </main>
  );
}
