import AccountPanel from "./account-panel";

export default function AccountPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <p className="text-sm text-gray-500">Configurações</p>
        <h1 className="text-3xl font-semibold">Minha conta</h1>
      </header>
      <AccountPanel />
    </main>
  );
}
