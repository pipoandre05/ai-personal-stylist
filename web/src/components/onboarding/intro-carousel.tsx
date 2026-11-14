"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mascot, MascotHead, cn, type MascotPose } from "@/components/ui";

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
      className="flex min-h-0 flex-1 flex-col landscape:[@media(max-height:500px)]:flex-row"
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
            className="flex w-full shrink-0 snap-center snap-always flex-col items-center justify-start px-6 pt-6 pb-4 text-center [@media(max-height:700px)]:pt-3 landscape:[@media(max-height:500px)]:flex-row landscape:[@media(max-height:500px)]:items-center landscape:[@media(max-height:500px)]:justify-start landscape:[@media(max-height:500px)]:gap-5 landscape:[@media(max-height:500px)]:px-8 landscape:[@media(max-height:500px)]:py-3 landscape:[@media(max-height:500px)]:text-left"
          >
            {/* D-04: Mascota de cuerpo entero en caja fija de 176 px constante en las 5 pantallas sin saltar. Oculta en pantallas bajas o apaisado */}
            <div className="flex h-[176px] shrink-0 items-center justify-center [@media(max-height:700px)]:hidden landscape:[@media(max-height:500px)]:hidden">
              <Mascot pose={s.pose} height={176} />
            </div>

            {/* D-03: En vertical de baja altura (<= 700 px y no apaisado), cabeza chica h-firma-s (88 px) junto al rótulo */}
            <div className="hidden [@media(max-height:700px)]:flex landscape:[@media(max-height:500px)]:hidden items-center justify-center gap-3 self-stretch">
              <MascotHead mood="firma" size={88} small className="h-[88px] w-[55px] shrink-0" />
              <p className="text-sobretitulo uppercase text-tinta-suave">{s.eyebrow}</p>
            </div>

            {/* D-03: En apaisado (<= 500 px), cabeza chica h-firma-s (88 px) a la izquierda del texto */}
            <div className="hidden landscape:[@media(max-height:500px)]:block shrink-0">
              <MascotHead mood="firma" size={88} small className="h-[88px] w-[55px]" />
            </div>

            {/* Bloque de textos y píldoras */}
            <div className="flex flex-col items-center max-w-sm landscape:[@media(max-height:500px)]:items-start">
              <p className="mt-5 text-sobretitulo uppercase text-tinta-suave [@media(max-height:700px)]:hidden landscape:[@media(max-height:500px)]:block landscape:[@media(max-height:500px)]:mt-0">
                {s.eyebrow}
              </p>
              <h2 className="mt-2 font-display text-titulo font-extrabold tracking-[-0.02em] text-tinta [@media(max-height:700px)]:mt-1.5 [@media(max-height:700px)]:text-[22px] [@media(max-height:700px)]:leading-[26px] landscape:[@media(max-height:500px)]:text-[24px] landscape:[@media(max-height:500px)]:leading-[28px]">
                {s.title}
              </h2>
              <p className="mt-3 text-cuerpo text-tinta-suave [@media(max-height:700px)]:mt-2 landscape:[@media(max-height:500px)]:mt-2">
                {s.text}
              </p>
              {s.proof ? (
                <ul
                  aria-label={s.proof.label}
                  className="mt-5 flex flex-wrap justify-center gap-2 [@media(max-height:700px)]:mt-3 landscape:[@media(max-height:500px)]:mt-3 landscape:[@media(max-height:500px)]:justify-start"
                >
                  {s.proof.items.map((item) => (
                    <li key={item} className="rounded-full bg-hundido px-3 py-1.5 text-meta font-bold text-tinta">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {/* D-04: Pie con cotas fijas: fila puntos/atrás (44 px), botón (52 px), enlaces (44 px) */}
      <div className="px-6 pt-2 pb-seguro landscape:[@media(max-height:500px)]:w-[320px] landscape:[@media(max-height:500px)]:shrink-0 landscape:[@media(max-height:500px)]:flex landscape:[@media(max-height:500px)]:items-center landscape:[@media(max-height:500px)]:p-0 landscape:[@media(max-height:500px)]:pr-6">
        <div className="w-full">
          {/* D-05: Fila de indicadores (44 px) con botón Atrás a la izquierda en grid de 3 columnas */}
          <div className="grid h-11 grid-cols-[76px_1fr_76px] items-center">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="flex h-11 items-center font-body text-sm font-bold text-tinta text-left cursor-pointer"
              >
                Atrás
              </button>
            ) : (
              <span className="invisible h-11" aria-hidden="true" tabIndex={-1} />
            )}

            {/* D-10: Indicadores de paso en caja 24x8 con capas animando solo opacity y scale-x */}
            <div className="flex items-center justify-center" role="group" aria-label="Pantallas">
              {INTRO_SLIDES.map((s, i) => {
                const active = i === index;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Ir a la pantalla ${i + 1}: ${s.eyebrow}`}
                    aria-current={active ? "step" : undefined}
                    className="relative flex size-11 items-center justify-center p-0 bg-transparent border-0 cursor-pointer"
                  >
                    {/* Contenedor relativo 24x8 */}
                    <span className="relative block h-2 w-6">
                      {/* Capa círculo (8px centrado): inactivo opacidad 100, activo opacidad 0 */}
                      <span
                        className={cn(
                          "absolute top-0 left-1/2 -ml-1 h-2 w-2 rounded-full bg-tinta transition-opacity duration-200 ease-salida motion-reduce:transition-none",
                          active ? "opacity-0" : "opacity-100",
                        )}
                      />
                      {/* Capa pastilla (24px): activo opacidad 100 y scale-x-100, inactivo opacidad 0 y scale-x-[0.3333] */}
                      <span
                        className={cn(
                          "absolute top-0 left-0 h-2 w-6 rounded-full bg-tinta origin-center transition-[opacity,transform] duration-200 ease-salida motion-reduce:transition-none",
                          active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-[0.3333]",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Placeholder simétrico a la derecha para centrado exacto de los puntos sin saltos */}
            <span className="invisible h-11" aria-hidden="true" tabIndex={-1} />
          </div>

          {/* D-04 y D-10: Botón de acción principal con altura fija idéntica de 52 px */}
          <div className="mt-1">
            {index < last ? (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-inverso text-sm font-bold text-sobre-inverso transition-transform duration-150 ease-salida active:scale-[0.98]"
              >
                Siguiente
              </button>
            ) : (
              <Link
                href="/entrar?modo=crear"
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-inverso text-sm font-bold text-sobre-inverso transition-transform duration-150 ease-salida active:scale-[0.98]"
              >
                Crear mi cuenta
              </Link>
            )}
          </div>

          {/* Enlaces secundarios (44 px) */}
          <div className="mt-1.5 flex h-11 items-center justify-center gap-1 text-sm">
            <Link
              href="/entrar"
              className="inline-flex min-h-11 items-center px-3 font-bold text-tinta underline underline-offset-4"
            >
              Ya tengo cuenta
            </Link>
            {index < last ? (
              <Link
                href="/entrar?modo=crear"
                className="inline-flex min-h-11 items-center px-3 text-tinta-suave underline underline-offset-4"
              >
                Saltar
              </Link>
            ) : null}
          </div>

          {/* D-02: Privacidad oculta en apaisado para asegurar holgura vertical sin cortes */}
          <p className="mt-1 text-center text-xs text-tinta-suave landscape:[@media(max-height:500px)]:hidden">
            Tus fotos son privadas. Puedes borrar todo cuando quieras.
          </p>
        </div>
      </div>
    </section>
  );
}
