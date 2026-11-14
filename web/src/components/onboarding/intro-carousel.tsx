"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink, Mascot, cn, type MascotPose } from "@/components/ui";

// Recorrido de entrada: cinco pantallas, una capacidad real por pantalla. La mascota es el hilo conductor:
// una pose por pantalla y una sola mascota a la vista. Todo lo que se promete aquí existe en el producto.

type Slide = {
  id: string;
  pose: MascotPose;
  eyebrow: string;
  title: string;
  text: string;
  /** Prueba concreta de la capacidad, en pocas palabras. */
  proof?: { label: string; items: string[] };
};

export const INTRO_SLIDES: Slide[] = [
  {
    id: "que-es",
    pose: "saludo",
    eyebrow: "Prendie",
    title: "Hola, soy tu asesor de imagen.",
    text: "Te ayudo a verte como quieres verte, con la ropa que ya tienes y con lo que de verdad vale la pena comprar.",
  },
  {
    id: "te-conozco",
    pose: "ceja",
    eyebrow: "Primero te conozco",
    title: "Conversamos, sin formularios.",
    text: "Te pregunto cómo te vistes y cómo te gustaría verte, de a una cosa. Lo que me cuentas lo recuerdo.",
    proof: { label: "Lo que me sirve saber", items: ["Tu estilo", "Tus ocasiones", "Fotos de tu ropa", "Una selfie para tu paleta"] },
  },
  {
    id: "como-pienso",
    pose: "pensando",
    eyebrow: "Así pienso un look",
    title: "Me cuentas el plan y yo lo armo.",
    text: "Un matrimonio, un asado, la oficina. Miro qué tan formal es, el clima de ese día y lo que hay en tu clóset.",
    proof: { label: "Lo que reviso", items: ["El evento", "El clima", "Tu clóset"] },
  },
  {
    id: "dos-looks",
    pose: "tada",
    eyebrow: "Lo que recibes",
    title: "Dos looks, y el porqué de cada uno.",
    text: "Uno más seguro y otro más atrevido, armados con tu propia ropa. Guardas el que te gusta o me pides ajustarlo.",
    proof: { label: "Para elegir", items: ["Más seguro", "Más atrevido"] },
  },
  {
    id: "te-busco",
    pose: "saludo",
    eyebrow: "Si te falta algo",
    title: "Te busco opciones en tiendas chilenas.",
    text: "Hasta tres, con foto y precio. Yo no compro nada: tú eliges y compras en la tienda.",
  },
];

export function IntroCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = INTRO_SLIDES.length - 1;

  // La pantalla activa es la que está centrada en el carril (deslizar con el dedo, flechas o botones).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        setIndex(Math.min(last, Math.max(0, i)));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [last]);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const target = Math.min(last, Math.max(0, i));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: target * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    },
    [last],
  );

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Qué es Prendie y cómo funciona"
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      <div
        ref={trackRef}
        tabIndex={0}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {INTRO_SLIDES.map((s, i) => (
          <article
            key={s.id}
            role="group"
            aria-roledescription="pantalla"
            aria-label={`${i + 1} de ${INTRO_SLIDES.length}: ${s.eyebrow}`}
            aria-hidden={i !== index}
            className="flex w-full shrink-0 snap-center snap-always flex-col items-center justify-center px-6 pb-4 text-center"
          >
            <Mascot pose={s.pose} height={176} className="[@media(max-height:620px)]:hidden" />
            <p className="mt-5 text-sobretitulo uppercase text-tinta-suave">{s.eyebrow}</p>
            <h2 className="mt-2 max-w-sm font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta">{s.title}</h2>
            <p className="mt-3 max-w-sm text-cuerpo text-tinta-suave">{s.text}</p>
            {s.proof ? (
              <ul aria-label={s.proof.label} className="mt-5 flex max-w-sm flex-wrap justify-center gap-2">
                {s.proof.items.map((item) => (
                  <li key={item} className="rounded-full bg-hundido px-3 py-1.5 text-meta font-bold text-tinta">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      <div className="px-6 pt-2 pb-seguro">
        <div className="flex items-center justify-center gap-1" role="group" aria-label="Pantallas">
          {INTRO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a la pantalla ${i + 1}: ${s.eyebrow}`}
              aria-current={i === index ? "step" : undefined}
              className="flex size-11 items-center justify-center"
            >
              <span className={cn("h-2 rounded-full transition-all duration-200", i === index ? "w-6 bg-tinta" : "w-2 bg-linea-fuerte")} />
            </button>
          ))}
        </div>

        <div className="mt-1">
          {index < last ? (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-inverso text-sm font-bold text-sobre-inverso transition-transform active:scale-[0.98]"
            >
              Siguiente
            </button>
          ) : (
            <ButtonLink href="/entrar?modo=crear" fullWidth>
              Crear mi cuenta
            </ButtonLink>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-sm">
          <Link href="/entrar" className="inline-flex min-h-11 items-center px-3 font-bold text-tinta underline underline-offset-4">
            Ya tengo cuenta
          </Link>
          {index < last ? (
            <Link href="/entrar?modo=crear" className="inline-flex min-h-11 items-center px-3 text-tinta-suave underline underline-offset-4">
              Saltar
            </Link>
          ) : null}
        </div>
        <p className="mt-1 text-center text-xs text-tinta-suave">Tus fotos son privadas. Puedes borrar todo cuando quieras.</p>
      </div>
    </section>
  );
}
