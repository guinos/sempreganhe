"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import styles from "./public-scratch-card.module.css";

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
  const markImageRef = useRef<HTMLImageElement | null>(null);
  const markMaskRef = useRef<Uint8Array | null>(null);
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
    const scratchCanvas = canvas;
    const scratchContext = context;

    function drawCover() {
      const mark = markImageRef.current ?? new window.Image();
      markImageRef.current = mark;
      if (!mark.complete || mark.naturalWidth === 0) {
        mark.onload = drawCover;
        mark.src = "/brand/sempreganhe-official-mark.png";
        return;
      }
      const rect = scratchCanvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      scratchCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      scratchCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
      scratchContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      scratchContext.globalCompositeOperation = "source-over";
      scratchContext.clearRect(0, 0, rect.width, rect.height);
      const scale = Math.min(rect.width / mark.naturalWidth, rect.height / mark.naturalHeight);
      const width = mark.naturalWidth * scale;
      const height = mark.naturalHeight * scale;
      const x = (rect.width - width) / 2;
      const y = (rect.height - height) / 2;
      scratchContext.drawImage(mark, x, y, width, height);
      scratchContext.fillStyle = "rgba(17, 17, 17, 0.52)";
      scratchContext.font = "800 18px Arial";
      scratchContext.textAlign = "center";
      scratchContext.fillText("RASPE AQUI", rect.width / 2, rect.height * 0.68);
      const alpha = scratchContext.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
      const mask = new Uint8Array(alpha.length / 4);
      for (let index = 3, maskIndex = 0; index < alpha.length; index += 4, maskIndex += 1) {
        if (alpha[index] > 128) mask[maskIndex] = 1;
      }
      markMaskRef.current = mask;
      setScratchProgress(0);
    }

    drawCover();
    const observer = new ResizeObserver(() => {
      if (!isPointerDownRef.current && !scratchStartedRef.current) drawCover();
    });
    observer.observe(scratchCanvas);
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
    const mask = markMaskRef.current;
    if (!mask) return;
    let covered = 0;
    let total = 0;
    for (let index = 3, pixelIndex = 0; index < pixels.length; index += 4, pixelIndex += 1) {
      if (!mask[pixelIndex]) continue;
      total += 1;
      if (pixels[index] >= 128) covered += 1;
    }
    const progress = total ? 1 - covered / total : 0;
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

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.brandBar}>
        <Image className={styles.brandLogo} src="/brand/sempreganhe-official-transp.png" alt="SempreGanhe" width={720} height={240} priority />
        <span className={styles.secureLabel}>Experiência exclusiva</span>
      </header>

      <div className={styles.content}>
        <section className={styles.intro} aria-labelledby="promotion-title">
          <p className={styles.eyebrow}>Uma chance especial para você</p>
          <h1 className={styles.title} id="promotion-title">{promotion.title}</h1>
          <p className={styles.description}>Raspe, descubra seu prêmio e aproveite esta promoção exclusiva.</p>
        </section>

        {!scratched ? <section className={styles.scratchColumn} aria-label="Área da raspadinha">
          <div className={styles.scratchFrame}>
            <div className={styles.scratchCard}>
              <div className={styles.prizeUnderlay}>
                <div>
                  <p className={styles.prizeKicker}>Seu prêmio</p>
                  <p className={styles.prizeText}>{promotion.prizeDescription ?? "está esperando por você"}</p>
                </div>
              </div>
              <canvas aria-label="Marca SempreGanhe. Deslize o dedo para raspar e revelar o prêmio." className={styles.scratchCanvas} onPointerCancel={finishPointer} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointer} ref={canvasRef} />
            </div>
          </div>
          <p className={styles.instruction}><span aria-hidden="true" className={styles.instructionIcon}>↗</span>Deslize o dedo para raspar e revelar seu prêmio.</p>
          <div aria-label={`${Math.round(scratchProgress * 100)}% raspado`} className={styles.progressTrack} role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.round(scratchProgress * 100)}><div className={styles.progressValue} style={{ width: `${Math.round(scratchProgress * 100)}%` }} /></div>
        </section> : status === "redeemed" ? <div className={`${styles.statusCard} ${styles.statusSuccess}`} role="status"><h2>Prêmio resgatado!</h2><p>Apresente esta confirmação ao parceiro.</p></div> : status === "rejected" ? <div className={`${styles.statusCard} ${styles.statusError}`} role="status"><h2>Resgate não aprovado</h2><p>O parceiro não confirmou esta participação.</p></div> : rescueRequested ? <div className={`${styles.statusCard} ${styles.statusSuccess}`} role="status"><h2>Resgate solicitado</h2><p>Seu prêmio será enviado para seu WhatsApp.</p><a className={styles.whatsappButton} href={whatsappUrl} rel="noreferrer" target="_blank">Ir para WhatsApp</a></div> : status === "pending_confirmation" ? <div className={styles.statusCard} role="status"><h2>Aguardando confirmação</h2><p>O parceiro precisa confirmar seu pedido para liberar o prêmio.</p></div> : !showRedemptionForm ? <section className={styles.statusCard} aria-labelledby="prize-title"><p className={styles.eyebrow}>Parabéns</p><h2 id="prize-title">Você ganhou {promotion.prizeDescription}</h2><p>Seu prêmio está reservado. Informe seus dados para solicitar o resgate.</p><button className={styles.button} onClick={() => setShowRedemptionForm(true)} type="button">Solicitar resgate</button></section> : <form className={styles.redemptionCard} onSubmit={(event) => void register(event)}><p className={styles.eyebrow}>Último passo</p><h2>Resgate seu prêmio</h2><p>Preencha seus dados para enviar a solicitação ao parceiro.</p><div className={styles.form}><label className={styles.field}>Nome<input aria-label="Nome" className={styles.input} placeholder="Como podemos chamar você?" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className={styles.field}>Telefone<input aria-label="Telefone" className={styles.input} inputMode="tel" placeholder="(00) 00000-0000" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className={styles.button} disabled={isSubmitting} type="submit">{isSubmitting ? "Enviando..." : "Confirmar resgate"}</button></div></form>}
      </div>

      {error ? <p aria-live="polite" className={styles.error}>{error}</p> : null}
      <footer className={styles.footer}>Promoção que vira jogo.</footer>
    </div>
  </main>;
}
