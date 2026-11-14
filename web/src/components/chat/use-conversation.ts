"use client";

// Todo el estado y la lógica del hilo. Los componentes de presentación no deben saber de streamChat, refs ni eventos SSE.

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { streamChat } from "@/lib/client/api";
import { uploadUserImage } from "@/lib/client/upload";
import type { AgentToolName, ChatEvent, ChatMessageView, ColorAnalysis, GarmentView, OutfitView, QuickReplies } from "@/lib/domain/types";
import type { ComposerHandle } from "./composer";
import { dayKey } from "./thread";
import { toItems, type AdvisorItem, type PersonItem, type ThreadItem } from "./thread-types";

export type UseConversationInput = {
  conversationId: string | null;
  initialMessages: ChatMessageView[];
};

type Turn = { text: string; imagePath?: string; start?: boolean };
type Attempt = { text: string; file: File | null; imagePath?: string };
type Acc = { text: string; outfits: OutfitView[]; garments: GarmentView[]; palette: ColorAnalysis | null; memories: string[] };

const GENERIC = "Algo salió mal. Intenta de nuevo en un momento.";
const CUT_OFF = "Se cortó mi respuesta. Tu mensaje quedó guardado.";
const LIMIT_TEXT = /m[aá]ximo de mensajes/i;
import { computePlaceholder } from "./placeholder";
export { computePlaceholder, LIMIT_PLACEHOLDER } from "./placeholder";
export type { ComputePlaceholderInput } from "./placeholder";


const NEAR_BOTTOM_PX = 120;
const JUMP_AFTER_PX = 360;

// --- Scroll (la página entera hace scroll: encabezado y dock son sticky) ---

const distanceFromBottom = () => document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function scrollToBottom(smooth: boolean) {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
  });
}

const subscribeNever = () => () => {};

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Une lo que el servidor ya persistió (tarjetas que no llegaron por el flujo) con lo que muestra el hilo. */
function mergeServer(prev: ThreadItem[], server: ChatMessageView[]): ThreadItem[] {
  const byId = new Map(server.map((m) => [m.id, m]));
  let changed = false;
  const next = prev.map((item) => {
    if (item.kind !== "advisor" || !item.id) return item;
    const s = byId.get(item.id);
    if (!s) return item;
    const garments = item.garments.length ? item.garments : s.garments;
    const outfits = item.outfits.length ? item.outfits : s.outfits;
    const palette = item.palette ?? s.palette;
    if (garments === item.garments && outfits === item.outfits && palette === item.palette) return item;
    changed = true;
    return { ...item, garments, outfits, palette };
  });
  return changed ? next : prev;
}

function announcementFor(acc: Acc): string {
  const bits = [acc.text.trim()];
  for (const o of acc.outfits) bits.push(`Te propuse un look: ${o.title}.`);
  for (const g of acc.garments) bits.push(`Reconocí: ${g.name}.`);
  if (acc.palette) bits.push(`Tu paleta: ${acc.palette.season}, confianza ${acc.palette.confidence}.`);
  for (const m of acc.memories) bits.push(`Anotado: ${m}.`);
  return bits.filter(Boolean).join(" ");
}

export function useConversation({ conversationId, initialMessages }: UseConversationInput) {
  const router = useRouter();
  const [items, setItems] = useState<ThreadItem[]>(() => toItems(initialMessages));
  const [replies, setReplies] = useState<QuickReplies | null>(() => {
    const last = initialMessages.at(-1);
    return last?.role === "assistant" ? last.quick_replies : null;
  });
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [tool, setTool] = useState<AgentToolName | null>(null);
  const [limit, setLimit] = useState(false);
  const [announcement, setAnnouncement] = useState({ n: 0, text: "" });
  const [showJump, setShowJump] = useState(false);
  // "Hoy" depende de la hora actual: solo existe en el cliente (el prerender no puede leer el reloj).
  const todayKey = useSyncExternalStore(subscribeNever, () => dayKey(new Date().toISOString()), () => "");
  const [seenProps, setSeenProps] = useState(initialMessages);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const mainRef = useRef<HTMLElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const convRef = useRef(conversationId);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const startedRef = useRef(false);
  const counter = useRef(0);
  const attempts = useRef(new Map<string, Attempt>());
  const lastTurn = useRef<Turn | null>(null);
  const blobUrls = useRef<string[]>([]);
  const stick = useRef(true);
  const smoothNext = useRef(false);
  const lockUntil = useRef(0);

  const nextKey = (prefix: string) => `${prefix}-${++counter.current}`;
  const setBusyBoth = (value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  };

  // Reconciliación con el servidor tras `router.refresh()` (patrón de "ajustar estado al cambiar props").
  if (seenProps !== initialMessages) {
    setSeenProps(initialMessages);
    if (!busy) {
      setItems((prev) => mergeServer(prev, initialMessages));
      const last = initialMessages.at(-1);
      const tail = items.at(-1);
      if (!replies && last?.role === "assistant" && last.quick_replies && tail?.kind === "advisor" && tail.id === last.id) {
        setReplies(last.quick_replies);
      }
    }
  }

  // --- Scroll: abajo al abrir; sigue el texto mientras la persona no haya subido a leer ---

  useLayoutEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      const d = distanceFromBottom();
      stick.current = d < NEAR_BOTTOM_PX;
      setShowJump(d > JUMP_AFTER_PX);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!stick.current) return;
      scrollToBottom(smoothNext.current);
      smoothNext.current = false;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(
    () => () => {
      for (const url of blobUrls.current) URL.revokeObjectURL(url);
    },
    [],
  );

  // --- Estado del hilo ---

  const patchPerson = (key: string, patch: Partial<PersonItem>) =>
    setItems((prev) => prev.map((i) => (i.kind === "person" && i.key === key ? { ...i, ...patch } : i)));

  /** Un turno del asesor: transmite, reduce los eventos SSE al hilo y cierra el estado. */
  async function runTurn(turn: Turn, personKey?: string) {
    lastTurn.current = turn;
    const key = nextKey("a");
    const controller = new AbortController();
    abortRef.current = controller;
    setBusyBoth(true);
    setAwaiting(true);
    setTool(null);
    setReplies(null);

    const acc: Acc = { text: "", outfits: [], garments: [], palette: null, memories: [] };
    const fresh: AdvisorItem = {
      kind: "advisor",
      key,
      id: null,
      at: new Date().toISOString(),
      fresh: true,
      ...acc,
      streaming: true,
      error: null,
    };
    setItems((prev) => [...prev, fresh]);

    const update = (extra: Partial<AdvisorItem> = {}) =>
      setItems((prev) =>
        prev.map((i) =>
          i.kind === "advisor" && i.key === key
            ? {
                ...i,
                text: acc.text,
                outfits: [...acc.outfits],
                garments: [...acc.garments],
                palette: acc.palette,
                memories: [...acc.memories],
                ...extra,
              }
            : i,
        ),
      );

    let gotEvent = false;
    let doneId: string | null = null;
    let eventError: string | null = null;
    let thrown: string | null = null;

    const onEvent = (e: ChatEvent) => {
      if (!gotEvent) {
        gotEvent = true;
        if (personKey) patchPerson(personKey, { status: "sent", error: null });
      }
      switch (e.type) {
        case "conversation":
          convRef.current = e.id;
          break;
        case "text_delta":
          setAwaiting(false);
          setTool(null);
          acc.text += e.text;
          update();
          break;
        case "tool":
          setTool(e.status === "start" ? e.name : null);
          setAwaiting(true);
          break;
        case "outfit":
          acc.outfits = [...acc.outfits.filter((o) => o.id !== e.outfit.id), e.outfit];
          update();
          break;
        case "garment":
          acc.garments = [...acc.garments.filter((g) => g.id !== e.garment.id), e.garment];
          update();
          break;
        case "palette":
          acc.palette = e.analysis;
          // La selfie se borra tras el análisis: la foto enviada pasa a ser un marcador.
          if (personKey) patchPerson(personKey, { imageUrl: null, photoDeleted: true });
          update();
          break;
        case "quick_replies":
          setReplies({ options: e.options, multiple: e.multiple });
          break;
        case "memory":
          acc.memories = [...acc.memories, e.fact];
          update();
          break;
        case "done":
          doneId = e.message_id;
          break;
        case "error":
          eventError = e.message;
          break;
      }
    };

    try {
      await streamChat(
        { conversation_id: convRef.current ?? undefined, text: turn.text, image_path: turn.imagePath, start: turn.start },
        onEvent,
        controller.signal,
      );
    } catch (err) {
      thrown = err instanceof Error ? err.message : GENERIC;
    }

    const hasContent = Boolean(acc.text.trim() || acc.outfits.length || acc.garments.length || acc.palette);
    if (thrown && !gotEvent) {
      // La request ni siquiera empezó (red, 429, sesión): el mensaje de la persona queda marcado como no enviado.
      if (LIMIT_TEXT.test(thrown)) setLimit(true);
      if (personKey) {
        setItems((prev) => prev.filter((i) => !(i.kind === "advisor" && i.key === key)));
        patchPerson(personKey, { status: "failed", error: thrown });
      } else {
        update({ streaming: false, error: thrown });
      }
    } else {
      const error = eventError ?? (thrown ? CUT_OFF : null);
      if (!hasContent && !error) {
        setItems((prev) => prev.filter((i) => !(i.kind === "advisor" && i.key === key)));
      } else {
        update({ streaming: false, id: doneId, error });
      }
      if (doneId) {
        setAnnouncement((a) => ({ n: a.n + 1, text: announcementFor(acc) }));
        // El servidor es la fuente de verdad (tarjetas y sugerencias persistidas, conteo del clóset).
        router.refresh();
      }
    }
    abortRef.current = null;
    setBusyBoth(false);
    setAwaiting(false);
    setTool(null);
  }

  /** Sube la foto (si hay) y pide el turno. El mensaje de la persona ya está en el hilo. */
  async function deliver(personKey: string) {
    const attempt = attempts.current.get(personKey);
    if (!attempt) return setBusyBoth(false);
    try {
      if (attempt.file && !attempt.imagePath) attempt.imagePath = await uploadUserImage(attempt.file, "chat");
    } catch (err) {
      patchPerson(personKey, { status: "failed", error: err instanceof Error ? err.message : GENERIC });
      return setBusyBoth(false);
    }
    patchPerson(personKey, { status: "sending", error: null });
    await runTurn({ text: attempt.text, imagePath: attempt.imagePath }, personKey);
  }

  function send(text: string, file: File | null = null) {
    const clean = text.trim();
    if (busyRef.current || (!clean && !file)) return;
    setBusyBoth(true);
    const key = nextKey("p");
    let imageUrl: string | null = null;
    if (file) {
      imageUrl = URL.createObjectURL(file);
      blobUrls.current.push(imageUrl);
    }
    attempts.current.set(key, { text: clean, file });
    setItems((prev) => [
      ...prev,
      {
        kind: "person",
        key,
        at: new Date().toISOString(),
        fresh: true,
        text: clean,
        imageUrl,
        photoDeleted: false,
        status: file ? "uploading" : "sending",
        error: null,
      },
    ]);
    setReplies(null);
    stick.current = true;
    smoothNext.current = true;
    lockUntil.current = Date.now() + 700;
    setShowJump(false);
    void deliver(key);
  }

  function retryPerson(key: string) {
    if (busyRef.current) return;
    const attempt = attempts.current.get(key);
    if (!attempt) return;
    setBusyBoth(true);
    patchPerson(key, { status: attempt.file && !attempt.imagePath ? "uploading" : "sending", error: null });
    void deliver(key);
  }

  function retryAdvisor(key: string) {
    const turn = lastTurn.current;
    if (busyRef.current || !turn) return;
    setItems((prev) => prev.filter((i) => i.key !== key));
    setBusyBoth(true);
    void runTurn(turn);
  }

  const stop = () => abortRef.current?.abort();

  // Saludo inicial: sin historial el asesor abre la conversación. El ref protege del doble disparo de StrictMode.
  // No se cancela al desmontar (StrictMode desmonta y vuelve a montar): el servidor termina y persiste el turno igual.
  const greet = useEffectEvent(() => {
    void runTurn({ text: "", start: true });
  });
  useEffect(() => {
    if (initialMessages.length > 0 || startedRef.current) return;
    startedRef.current = true;
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  const jumpToEnd = useCallback(() => {
    stick.current = true;
    lockUntil.current = Date.now() + 700;
    scrollToBottom(true);
    setShowJump(false);
  }, []);

  const disabled = limit || !online;
  const placeholder = computePlaceholder({ limit, online, replies, busy, items });
  const failedStart = items.length === 1 && items[0].kind === "advisor" && items[0].error !== null;

  /** Con el teclado abierto el último mensaje debe seguir a la vista. */
  const onFocusField = () => {
    window.setTimeout(() => {
      if (stick.current) scrollToBottom(false);
    }, 300);
  };

  const pickPhoto = (selfie: boolean) => composerRef.current?.openPicker(selfie);

  // Estado y refs van por separado: así el estado puro se lee en el render sin tocar refs.
  const state = {
    items,
    replies,
    busy,
    awaiting,
    tool,
    online,
    disabled,
    placeholder,
    failedStart,
    showJump,
    todayKey,
    announcement,
    pickPhoto,
    send,
    retryPerson,
    retryAdvisor,
    stop,
    jumpToEnd,
    onFocusField,
  };
  return [state, mainRef, composerRef] as const;
}
