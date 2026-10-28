"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputClass = "rounded border border-gray-400 bg-white p-2 text-gray-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-gray-900 dark:text-white";

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/onboarding/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Não foi possível concluir o cadastro.");
        return;
      }
      setCreated(true);
    } catch {
      setError("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (created) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-8 text-[var(--foreground)]">
        <section className="flex w-full flex-col gap-4 rounded-xl border p-6">
          <h1 className="text-2xl font-semibold">Partner cadastrado</h1>
          <p>Seu acesso de owner foi criado. Agora entre no painel para criar sua primeira promoção.</p>
          <button className="rounded bg-black px-4 py-2 text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600" onClick={() => router.push("/login")} type="button">
            Ir para o login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-8 text-[var(--foreground)]">
      <form className="flex w-full flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <div>
          <h1 className="text-3xl font-semibold">Criar seu partner</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Cadastre o negócio e o primeiro usuário owner.</p>
        </div>

        <label className="flex flex-col gap-1">
          Nome do negócio
          <input autoComplete="organization" className={inputClass} name="partnerName" required />
        </label>

        <label className="flex flex-col gap-1">
          Slug público
          <input autoComplete="off" className={inputClass} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="meu-negocio" required />
        </label>

        <label className="flex flex-col gap-1">
          Seu nome
          <input autoComplete="name" className={inputClass} name="ownerName" required />
        </label>

        <label className="flex flex-col gap-1">
          E-mail
          <input autoComplete="email" className={inputClass} name="ownerEmail" required type="email" />
        </label>

        <label className="flex flex-col gap-1">
          Senha
          <input autoComplete="new-password" className={inputClass} minLength={8} name="ownerPassword" required type="password" />
        </label>

        <label className="flex flex-col gap-1">
          WhatsApp do negócio <span className="text-xs text-gray-600 dark:text-gray-300">opcional</span>
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
            <select aria-label="País do WhatsApp" className={inputClass} defaultValue="55" name="whatsappCountryCode">
              <option value="55">🇧🇷 Brasil (+55)</option>
              <option value="1">🇺🇸 Estados Unidos/Canadá (+1)</option>
              <option value="351">🇵🇹 Portugal (+351)</option>
              <option value="34">🇪🇸 Espanha (+34)</option>
              <option value="44">🇬🇧 Reino Unido (+44)</option>
            </select>
            <input autoComplete="tel" className={inputClass} name="whatsappPhone" placeholder="DDD + número" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Informe DDD e número, sem o código do país.</span>
        </label>

        <label className="flex flex-col gap-1">
          Tipo de negócio <span className="text-xs text-gray-600 dark:text-gray-300">opcional</span>
          <input autoComplete="organization-title" className={inputClass} name="businessType" placeholder="Restaurante, loja ou serviço" />
        </label>

        {error ? <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <button className="rounded bg-black px-4 py-2 text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Cadastrando..." : "Cadastrar partner"}
        </button>
        <Link className="text-center text-sm underline outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="/login">
          Já tenho acesso
        </Link>
      </form>
    </main>
  );
}
