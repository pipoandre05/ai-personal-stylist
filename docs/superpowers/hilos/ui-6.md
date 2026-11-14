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
