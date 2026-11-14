# Contrato — Sesiones, inicio de cero y zona única de respuestas rápidas (2026-11-14)

Pedido de Felipe (2026-11-14). Este documento fija la interfaz entre servidor (sesión integradora) e interfaz (equipo)
**antes** de construir, para que ambos trabajen en paralelo. Los nombres de esta página son vinculantes.

## Qué cambia para la persona

1. **Panel de sesiones.** Botón de menú arriba a la izquierda. Abre un panel deslizable con "Nueva conversación" y las
   sesiones pasadas (título y fecha), de la más reciente a la más antigua.
2. **Cada entrada parte de cero.** Abrir la PWA muestra la pantalla de inicio, sin hilo. Las sesiones anteriores quedan en el panel.
3. **Pantalla de inicio.** Saludo corto y centrado con el nombre, contextual a la hora y el día, y 3 o 4 sugerencias.
   Se genera en el cliente: **no llama al asesor**. Patrón de referencia: la pantalla de inicio de la app de Claude
   (saludo centrado, menú arriba a la izquierda, compositor abajo). Identidad visual de Estilo, no la de Claude.
4. **Opciones de compra en carrusel** horizontal.
5. **Una sola zona de respuestas rápidas**, sobre el compositor. Los botones de ajuste salen de las tarjetas.

## Rutas (interfaz, `web/src/app/**`)

| Ruta | Qué muestra |
|---|---|
| `/asesor` | Sesión nueva: pantalla de inicio. No lee ninguna conversación. |
| `/asesor/[id]` | Una sesión pasada. Si `getConversation(id)` devuelve `null`: redirigir a `/asesor`. |

Al enviar el primer mensaje desde `/asesor`, el servidor crea la conversación y emite el evento
`{ type: "conversation", id }` (ya existe). El cliente cambia la URL a `/asesor/<id>` sin recargar
(`window.history.replaceState`), para que recargar la página conserve el hilo.

## Lo que entrega el servidor (sesión integradora, `web/src/lib/**`)

```ts
// web/src/lib/domain/types.ts
export type ConversationSummary = {
  id: string;
  /** Nunca vacío: si la conversación aún no tiene título, el servidor entrega "Conversación". */
  title: string;
  /** timestamptz ISO. Mostrar con fmtDate(). */
  updated_at: string;
};

// web/src/lib/data/queries.ts (solo servidor)
/** Sesiones de la persona con al menos un mensaje, de la más reciente a la más antigua. Máximo 50. */
export function listConversations(): Promise<ConversationSummary[]>;
/** Una sesión de la persona con sus mensajes. null si no existe o no es suya. */
export function getConversation(id: string): Promise<{ id: string; title: string; messages: ChatMessageView[] } | null>;

// web/src/lib/actions/conversations.ts
export function renameConversation(id: string, title: string): Promise<ActionResult>;
export function deleteConversation(id: string): Promise<ActionResult>;
```

- `getLatestConversation()` sigue existiendo, pero la interfaz deja de usarlo.
- **Título:** lo pone el servidor al primer turno: el tipo de evento si lo hay ("Matrimonio en Casablanca"), o las primeras
  palabras del primer mensaje (máximo 40 caracteres). La interfaz no lo calcula.
- **`streamChat`** no cambia de firma. Sin `conversation_id` crea una sesión nueva; con `conversation_id` continúa esa.
- **`start: true`** queda solo para la primera vez de una persona con el perfil incompleto (el asesor habla primero para
  conocerla). Para eso `AsesorPage` ya puede leer `getProfile()`; el servidor agrega:

```ts
// web/src/lib/data/queries.ts
/** true si a la persona le falta completar su perfil inicial: en ese caso /asesor abre con el asesor hablando primero. */
export function needsOnboarding(): Promise<boolean>;
```

- Borrar una sesión no borra los looks guardados (la columna `conversation_id` del look queda en null).
- Sin migración: `conversations` ya tiene `title` y `updated_at`.

## Mientras el servidor no está en main

La interfaz puede construir contra datos fijos con esas mismas formas (en `web/src/app/dev/**` o con un arreglo local).
Cuando el servidor esté en main, la sesión integradora avisa y se cambia el arreglo por las funciones reales.

## Lo que construye el equipo (interfaz)

- **A. Zona única de respuestas rápidas.** `refinements` de looks y de opciones de compra dejan de pintarse dentro de las
  tarjetas y se muestran sobre el compositor, según el último turno del asesor. En las tarjetas quedan solo sus acciones
  propias: Guardar look, No es para mí, Ver en la tienda. Los botones siguen enviando el mismo `intent`. No depende del servidor.
- **B. Carrusel de opciones de compra.** Deslizable con ajuste, usable con teclado y lector de pantalla, la opción elegida
  siempre visible. Con una sola opción no parece carrusel roto. No depende del servidor.
- **C. Pantalla de inicio.** Saludo en el cliente con variantes por franja horaria (mañana, tarde, noche), día (lunes,
  viernes, fin de semana) y regreso ("De vuelta, Felipe"); que no se repita siempre el mismo. Sin emoji, tuteo, con el nombre
  si existe. Sugerencias que envían texto normal. No depende del servidor.
- **D. Panel de sesiones.** Lista con `listConversations()`, abre `/asesor/[id]`, "Nueva conversación" va a `/asesor`.
  Renombrar y borrar son opcionales para la primera versión. Depende del servidor solo para los datos reales.

## Fuera de alcance

Búsqueda dentro de sesiones, fijar sesiones, compartir una sesión.
