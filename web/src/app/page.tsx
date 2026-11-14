import { ButtonLink, RegisterSW, Screen } from "@/components/ui";

const BENEFICIOS = [
  { n: "01", titulo: "Una conversación, no un formulario", texto: "Me cuentas cómo te vistes y yo te voy conociendo, de a una pregunta." },
  { n: "02", titulo: "Tu paleta en una selfie", texto: "Me mandas una foto y te digo qué tonos iluminan tu cara, con el porqué." },
  { n: "03", titulo: "Solo lo que vale la pena comprar", texto: "Si algo te falta, te digo qué tipo de prenda y por qué. Sin catálogos." },
];

function Silueta({ d, className }: { d: string; className: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

// Siluetas de marca (marcadores de prenda): no son datos de la persona.
const ABRIGO = "M36 6 L50 24 L64 6 L80 14 L90 70 L82 72 L76 40 L76 96 L24 96 L24 40 L18 72 L10 70 L20 14 Z";
const TOP = "M34 10 L42 7 Q50 14 58 7 L66 10 L84 24 L76 36 L68 30 L68 92 L32 92 L32 30 L24 36 L16 24 Z";
const PANTALON = "M30 6 H70 L74 94 H56 L50 34 L44 94 H26 Z";

export default function Portada() {
  return (
    <Screen className="px-5">
      <RegisterSW />
      <header className="pt-seguro">
        <p className="pt-4 font-display text-2xl italic">Estilo</p>
      </header>

      {/* Composición editorial de marca */}
      <div
        aria-hidden="true"
        className="mt-5 grid h-60 grid-cols-[1.25fr_1fr] grid-rows-2 gap-1.5"
      >
        <div className="row-span-2 flex animate-aparecer items-center justify-center rounded-sm bg-hundido">
          <Silueta d={ABRIGO} className="size-4/5 text-tinta-suave" />
        </div>
        <div className="flex animate-aparecer items-center justify-center rounded-sm bg-linea [animation-delay:60ms]">
          <Silueta d={TOP} className="size-3/5 text-superficie" />
        </div>
        <div className="flex animate-aparecer items-center justify-center rounded-sm bg-hundido [animation-delay:120ms]">
          <Silueta d={PANTALON} className="size-3/5 text-tinta" />
        </div>
      </div>

      <section className="mt-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave">Asesoría de imagen personal</p>
        <h1 className="mt-2.5 font-display text-4xl leading-[1.05]">
          Te ayudo a verte como <em className="text-acento">quieres</em> verte.
        </h1>
        <p className="mt-3.5 text-lg text-tinta-suave">
          Con lo que ya tienes y con lo que realmente vale la pena comprar.
        </p>
        <p className="mt-3 text-base text-tinta">Cuéntale a tu asesor cómo te vistes y empieza por lo que necesites hoy.</p>
      </section>

      <ul className="mt-8 mb-6">
        {BENEFICIOS.map((b) => (
          <li key={b.n} className="flex gap-4 border-t border-linea py-4">
            <span aria-hidden="true" className="w-7 shrink-0 pt-0.5 font-display text-lg italic text-tinta-suave">
              {b.n}
            </span>
            <div>
              <h2 className="font-body text-base font-semibold leading-snug">{b.titulo}</h2>
              <p className="mt-1 text-sm text-tinta-suave">{b.texto}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 mt-auto -mx-5 bg-fondo px-5 pt-3 pb-seguro">
        <ButtonLink href="/entrar?modo=crear" fullWidth>
          Empezar
        </ButtonLink>
        <div className="mt-1.5 text-center">
          <ButtonLink href="/entrar" variant="text">
            Ya tengo cuenta
          </ButtonLink>
        </div>
        <p className="mt-1 text-center text-xs text-tinta-suave">
          Tus fotos son privadas. Puedes borrar todo cuando quieras.
        </p>
      </div>
    </Screen>
  );
}
