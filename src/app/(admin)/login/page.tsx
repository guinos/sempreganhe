"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });

    if (!response.ok) {
      setError(true);
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-8">
      <form className="flex w-full flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <h1 className="text-3xl font-semibold">Login administrativo</h1>
        <label className="flex flex-col gap-1">
          E-mail
          <input className="rounded border p-2" name="email" type="email" required />
        </label>
        <label className="flex flex-col gap-1">
          Senha
          <input className="rounded border p-2" name="password" type="password" required />
        </label>
        {error ? <p role="alert">E-mail ou senha inválidos.</p> : null}
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">
          Entrar
        </button>
        <Link className="text-center text-sm underline outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="/onboarding">
          Criar um novo partner
        </Link>
      </form>
    </main>
  );
}
