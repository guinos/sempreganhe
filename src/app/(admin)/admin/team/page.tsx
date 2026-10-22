import TeamPanel from "./team-panel";

export default function TeamPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <p className="text-sm text-gray-500">Configurações</p>
        <h1 className="text-3xl font-semibold">Gerenciar minha equipe</h1>
      </header>
      <TeamPanel />
    </main>
  );
}
