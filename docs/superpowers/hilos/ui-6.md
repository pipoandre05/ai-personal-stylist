# Hilo ui-6 — UI-6 a UI-8: Sugerencias, Rastro del asesor en vivo y Ritmo del hilo

- **Rama:** `equipo/ui-6-dinamica-hilo`
- **Dependencias declaradas:** ninguna
- **Tope de vueltas QA ↔ Constructor:** 4 (al tope decide el Productor)
- **Reglas:** append-only con `agentes/scripts/hilo.sh`; nunca se edita un turno anterior. Los VEREDICTO los lee DevOps antes de mergear.

### 2026-11-14 15:55 · Diseño · nota · vuelta 0

Maquetas de ui-6, ui-7 y ui-8 entregadas en docs/superpowers/mockups/: 2026-11-14-ui-6-sugerencias.html (5 marcos), 2026-11-14-ui-7-rastro.html (5 marcos) y 2026-11-14-ui-8-ritmo.html (4 marcos), a 390 px con notas de construcción al pie.

Decisiones: sugerencias en contorno 44 px a la derecha, modo múltiple con chips aria-pressed y "Listo" inverso, sin lima. Rastro en vivo que acumula pasos y colapsa a "N pasos de trabajo" con check exito y aria-expanded. Ritmo: margen 24 px, separador de día, máscara superior 28 px, "Ir al final" inverso con shadow-flotante, esqueleto animate-esqueleto y aviso sin conexión.

Corrección en esta entrega: se arregló un reset CSS que anulaba los bordes de los botones contorno en los borradores originales.

Fuera de ui-7: el marco con dato y miniaturas necesita tool_step, que el contrato actual no emite.

Sin verificar: validación Opus omitida por decisión del Productor; factibilidad no consultada al Constructor (modo múltiple de sugerencias en el contrato); contraste de tinta sobre falta sin medir; máscara de 28 px no probada contra la firma.

### 2026-11-14 16:10 · Constructor · respuesta · vuelta 0

Construcción de UI-6 (Respuestas sugeridas) completada sobre el commit `25b2cb3e99263aa2ed863475e707980d0ae3e798`.

## Cambios realizados
1. `web/src/components/chat/suggested-replies.tsx`:
   - Modo simple: botones contorno medianos de 44 px (`Button variant="contorno" size="mediano"`) alineados a la derecha (`flex flex-wrap justify-end gap-2 px-6 pb-3`).
   - Acción de foto: opciones que coinciden con `PHOTO_ACTION` ("Mandar foto", "Subir foto", "Mandar selfie") incluyen el ícono de cámara `IconCamera` size-5 y abren el selector (`onPickPhoto`).
   - Modo múltiple: opciones como chips (`Chip mode="toggle"`) con `aria-pressed`, altura accesible (44 px mediante `after:-inset-1`), y botón "Listo" mediano inverso (`Button variant="inverso" size="mediano"`) deshabilitado si no hay selección (`disabled:opacity-45`).
   - Cero lima: ninguna sugerencia ni chip usa `accion` / `bg-accion`.
   - Accesibilidad: contenedor con `role="group"` y `aria-label="Respuestas sugeridas"`, anillo de foco azul de 3 px (`globals.css`), objetivos táctiles >= 44 px.
   - Respeto estricto de frontera y restricciones: solo se modificó `suggested-replies.tsx` y su suite de tests. Archivos prohibidos (`thread.tsx`, `thread-types.ts`, `conversation.tsx`, `use-conversation.ts`, `outfit-card.tsx`, `tool-status.tsx`) 100% intactos.

2. `web/tests/ui/suggested-replies.test.ts`:
   - Suite con 12 tests unitarios cubriendo detección de fotos, renderizado simple, renderizado múltiple, accesibilidad, estados deshabilitados y cero lima.
   - `npm run verify` pasando (295/295 tests) y `AI_MODE=mock npm run build` exitoso.
