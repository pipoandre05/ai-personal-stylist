/**
 * Lógica de saludo contextual en el cliente para la pantalla de inicio (UI-20, Pieza C).
 * - Franjas: mañana (05:00 - 11:59), tarde (12:00 - 19:59), noche (20:00 - 04:59).
 * - Días: lunes, viernes, fin de semana (sábado y domingo), días de semana.
 * - Con nombre (\"Felipe\") o sin nombre (sin comas sueltas ni \"undefined\").
 * - Sin emojis, tuteo sobrio chileno, sin la palabra \"usuario\".
 */

export type GreetingData = {
  greeting: string;
  subtitle: string;
};

export const START_SUGGESTIONS = [
  "Quiero armar un look para salir el fin de semana",
  "¿Qué me pongo para ir a trabajar mañana?",
  "Tengo un matrimonio y no sé qué ponerme",
  "¿Cómo combinar unas prendas de mi clóset para una cena?",
] as const;

export function getContextualGreeting(
  displayName?: string | null,
  now: Date = new Date(),
  variantIndex?: number,
): GreetingData {
  const name = displayName?.trim() || null;

  // Extraer hora y día en zona horaria America/Santiago
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    hour: "numeric",
    hour12: false,
  });
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    weekday: "short",
  });

  const hour = parseInt(hourFormatter.format(now), 10) || 0;
  const weekday = weekdayFormatter.format(now); // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"

  // Franja horaria
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 20;

  // Día
  const isMonday = weekday === "Mon";
  const isFriday = weekday === "Fri";
  const isWeekend = weekday === "Sat" || weekday === "Sun";

  type Option = { greeting: string; subtitle: string };
  const options: Option[] = [];

  if (isMorning) {
    if (name) {
      options.push(
        { greeting: `Buen día, ${name}.`, subtitle: "¿Qué armamos hoy?" },
        { greeting: `Buenos días, ${name}.`, subtitle: "Cuéntame qué panorama tienes." },
        { greeting: `De vuelta, ${name}.`, subtitle: "¿En qué te ayudo esta mañana?" },
      );
    } else {
      options.push(
        { greeting: "Buen día.", subtitle: "¿Qué armamos hoy?" },
        { greeting: "Buenos días.", subtitle: "Cuéntame qué panorama tienes." },
        { greeting: "De vuelta.", subtitle: "¿En qué te ayudo esta mañana?" },
      );
    }
  } else if (isAfternoon) {
    if (name) {
      options.push(
        { greeting: `Buenas tardes, ${name}.`, subtitle: "¿Qué tienes pensado vestir?" },
        { greeting: `De vuelta, ${name}.`, subtitle: "Dime qué ocasión tienes en mente." },
        { greeting: `Hola, ${name}.`, subtitle: "¿Buscamos algo en tu clóset o armamos un look?" },
      );
    } else {
      options.push(
        { greeting: "Buenas tardes.", subtitle: "¿Qué tienes pensado vestir?" },
        { greeting: "De vuelta.", subtitle: "Dime qué ocasión tienes en mente." },
        { greeting: "Hola.", subtitle: "¿Buscamos algo en tu clóset o armamos un look?" },
      );
    }
  } else {
    // Noche
    if (name) {
      options.push(
        { greeting: `Buenas noches, ${name}.`, subtitle: "¿Preparamos lo de mañana?" },
        { greeting: `De vuelta, ${name}.`, subtitle: "¿Qué tienes pensado para mañana o el fin de semana?" },
        { greeting: `Hola, ${name}.`, subtitle: "¿Revisamos alguna tenida?" },
      );
    } else {
      options.push(
        { greeting: "Buenas noches.", subtitle: "¿Preparamos lo de mañana?" },
        { greeting: "De vuelta.", subtitle: "¿Qué tienes pensado para mañana o el fin de semana?" },
        { greeting: "Hola.", subtitle: "¿Revisamos alguna tenida?" },
      );
    }
  }

  // Si es día especial, agregamos opciones orientadas a ese contexto
  if (isMonday) {
    const mondaySubtitle = "¿Arrancamos la semana? Cuéntame qué necesitas.";
    options.unshift({
      greeting: name ? `Buen inicio de semana, ${name}.` : "Buen inicio de semana.",
      subtitle: mondaySubtitle,
    });
  } else if (isFriday) {
    const fridaySubtitle = "Se viene el fin de semana. ¿Tienes algún evento o salida?";
    options.unshift({
      greeting: name ? `Buen viernes, ${name}.` : "Buen viernes.",
      subtitle: fridaySubtitle,
    });
  } else if (isWeekend) {
    const weekendSubtitle = "¿Qué panorama tienes para hoy?";
    options.unshift({
      greeting: name ? `Buen fin de semana, ${name}.` : "Buen fin de semana.",
      subtitle: weekendSubtitle,
    });
  }

  const index =
    typeof variantIndex === "number"
      ? Math.abs(variantIndex) % options.length
      : Math.floor(Math.random() * options.length);

  return options[index];
}
