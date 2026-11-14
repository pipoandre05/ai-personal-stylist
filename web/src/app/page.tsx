import { IntroCarousel } from "@/components/onboarding/intro-carousel";
import { RegisterSW } from "@/components/ui";

/**
 * Portada: el recorrido de entrada. Antes de crear la cuenta, la persona entiende qué es Prendie, cómo trabaja el asesor
 * y qué necesita de ella. Después de entrar, el asesor la conoce conversando (`needsOnboarding` en /asesor).
 */
export default function Portada() {
  return (
    <main id="contenido" className="mx-auto flex h-dvh w-full max-w-app flex-col bg-fondo">
      <RegisterSW />
      <header className="flex h-14 shrink-0 items-center px-6 pt-seguro">
        <span className="font-display text-titulo font-extrabold tracking-[-0.03em]">Prendie</span>
      </header>
      <h1 className="sr-only">Prendie, tu asesor de imagen</h1>
      <IntroCarousel />
    </main>
  );
}
