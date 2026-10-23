"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";

type ParticipationStatus = "pending_registration" | "pending_confirmation" | "redeemed" | "rejected";
type State = {
  title: string;
  prizeDescription?: string;
  publicToken?: string;
  status?: ParticipationStatus;
  whatsappPhone?: string | null;
};

const REVEAL_THRESHOLD = 0.5;

function normalizeWhatsAppPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export default function PublicScratchCard({ code }: { code: string }) {
  const publicCode = decodeURIComponent(code);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);
  const scratchStartedRef = useRef(false);
  const lastProgressCheckRef = useRef(0);
  const [promotion, setPromotion] = useState<State | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");
  const [scratched, setScratched] = useState(false);
  const [showRedemptionForm, setShowRedemptionForm] = useState(false);
  const [rescueRequested, setRescueRequested] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetch(`/api/public/promotions/${encodeURIComponent(publicCode)}`).then(async (response) => {
      if (!response.ok) throw new Error("Promoção não encontrada ou encerrada.");
      const body = await response.json();
      setPromotion(body.promotion as State);
    }).catch((reason: Error) => setError(reason.message));
  }, [publicCode]);

  useEffect(() => {
    if (!promotion?.publicToken || promotion.status !== "pending_confirmation") return;
    const refreshStatus = () => {
      void fetch(`/api/public/participations/${promotion.publicToken}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Não foi possível consultar o status do resgate.");
          return (await response.json()).participation as { status: ParticipationStatus };
        })
        .then((participation) => setPromotion((current) => current ? { ...current, status: participation.status } : current))
        .catch((reason: Error) => setError(reason.message));
    };
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 3000);
    return () => window.clearInterval(interval);
  }, [promotion?.publicToken, promotion?.status]);

  useEffect(() => {
    if (!promotion || scratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    function drawCover() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#e7c873");
      gradient.addColorStop(0.45, "#c9a24a");
      gradient.addColorStop(1, "#8f671c");
      context.globalCompositeOperation = "source-over";
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);
      context.fillStyle = "rgba(17, 17, 17, 0.2)";
      context.font = "700 18px Arial";
      context.textAlign = "center";
      context.fillText("RASPE AQUI", rect.width / 2, rect.height / 2 + 6);
    }

    drawCover();
    const observer = new ResizeObserver(drawCover);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [promotion, scratched]);

  async function completeScratch() {
    if (scratchStartedRef.current || !promotion) return;
    scratchStartedRef.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/public/promotions/${encodeURIComponent(publicCode)}`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível raspar.");
      setPromotion((current) => current ? { ...current, ...body.participation } : current);
      setScratchProgress(1);
      setScratched(true);
    } catch (reason) {
      scratchStartedRef.current = false;
      setError(reason instanceof Error ? reason.message : "Não foi possível raspar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getPointerPosition(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function measureScratchProgress() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let sampled = 0;
    for (let index = 3; index < pixels.length; index += 32) {
      sampled += 1;
      if (pixels[index] < 128) transparent += 1;
    }
    const progress = sampled ? transparent / sampled : 0;
    setScratchProgress(progress);
    if (progress >= REVEAL_THRESHOLD) void completeScratch();
  }

  function eraseAt(point: { x: number; y: number }) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Math.max(38, rect.width * 0.12);
    context.beginPath();
    const previous = lastPointRef.current ?? point;
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
    const now = performance.now();
    if (now - lastProgressCheckRef.current > 80) {
      lastProgressCheckRef.current = now;
      measureScratchProgress();
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (scratchStartedRef.current || isSubmitting) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    isPointerDownRef.current = true;
    lastPointRef.current = getPointerPosition(event);
    if (lastPointRef.current) eraseAt(lastPointRef.current);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isPointerDownRef.current || scratchStartedRef.current) return;
    const point = getPointerPosition(event);
    if (point) eraseAt(point);
  }

  function finishPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    isPointerDownRef.current = false;
    lastPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    measureScratchProgress();
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!promotion?.publicToken) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/public/participations/${promotion.publicToken}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível concluir o resgate.");
      setPromotion((current) => current ? { ...current, status: body.participation.status } : current);
      setRescueRequested(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível concluir o resgate.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const whatsappPhone = normalizeWhatsAppPhone(promotion?.whatsappPhone);
  const whatsappMessage = encodeURIComponent(`Olá! Solicitei o resgate do prêmio: ${promotion?.prizeDescription ?? "minha promoção"}.`);
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}` : "https://wa.me/";
  const status = promotion?.status;

  if (error && !promotion) return <main className="mx-auto flex min-h-screen max-w-md items-center p-8"><p>{error}</p></main>;
  if (!promotion) return <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-8"><p>Carregando sua raspadinha...</p></main>;

  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6 text-center">
    <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">SempreGanhe</p>
    <h1 className="text-3xl font-semibold">{promotion.title}</h1>
    {!scratched ? <section className="flex flex-col gap-3">
      <div className="relative aspect-[1.7] overflow-hidden rounded-2xl border-2 border-black bg-white shadow-lg">
        <div className="flex h-full items-center justify-center p-6"><p className="text-2xl font-bold text-gray-900">Seu prêmio está aqui</p></div>
        <canvas aria-label="Raspadinha digital. Deslize o dedo para revelar o prêmio." className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing" onPointerCancel={finishPointer} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointer} ref={canvasRef} />
      </div>
      <p className="text-sm text-gray-600">Deslize o dedo para raspar e revelar seu prêmio.</p>
      <div aria-label={`${Math.round(scratchProgress * 100)}% raspado`} className="h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${Math.round(scratchProgress * 100)}%` }} /></div>
    </section> : status === "redeemed" ? <div className="rounded-2xl border border-green-600 bg-green-50 p-6"><h2 className="text-xl font-semibold">Prêmio resgatado!</h2><p className="mt-2">Apresente esta confirmação ao parceiro.</p></div> : status === "rejected" ? <div className="rounded-2xl border border-red-600 bg-red-50 p-6"><h2 className="text-xl font-semibold">Resgate não aprovado</h2><p className="mt-2">O parceiro não confirmou esta participação.</p></div> : rescueRequested ? <div className="rounded-2xl border border-green-600 bg-green-50 p-6"><h2 className="text-xl font-semibold">Resgate solicitado</h2><p className="mt-2">Seu prêmio será enviado para seu WhatsApp.</p><a className="mt-5 inline-flex justify-center rounded-xl bg-green-600 px-5 py-3 font-semibold text-white" href={whatsappUrl} rel="noreferrer" target="_blank">Ir para WhatsApp</a></div> : status === "pending_confirmation" ? <div className="rounded-2xl border p-6"><h2 className="text-xl font-semibold">Aguardando confirmação</h2><p className="mt-2">O parceiro precisa confirmar seu pedido para liberar o prêmio.</p></div> : !showRedemptionForm ? <section className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-2xl font-bold">Parabéns, você ganhou {promotion.prizeDescription}</p><button className="mt-6 w-full rounded-xl bg-black px-5 py-3 font-semibold uppercase tracking-wide text-white" onClick={() => setShowRedemptionForm(true)} type="button">RESGATE</button></section> : <form className="flex flex-col gap-4 rounded-2xl border bg-white p-6 text-left shadow-sm" onSubmit={(event) => void register(event)}><p className="text-center text-2xl font-bold">Parabéns, você ganhou {promotion.prizeDescription}</p><p className="text-sm text-gray-600">Preencha seus dados para solicitar o resgate.</p><label className="flex flex-col gap-1">Nome<input className="rounded border p-3" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="flex flex-col gap-1">Telefone<input className="rounded border p-3" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className="rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50" disabled={isSubmitting} type="submit">{isSubmitting ? "Enviando..." : "Solicitar resgate"}</button></form>}
    {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
  </main>;
}
