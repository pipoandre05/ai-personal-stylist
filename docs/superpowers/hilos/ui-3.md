# Hilo ui-3 — UI-3 a UI-5: Encabezado, Voces del asesor y persona, y Compositor

- **Rama:** `equipo/ui-3-base-hilo`
- **Dependencias declaradas:** ninguna
- **Tope de vueltas QA ↔ Constructor:** 4 (al tope decide el Productor)
- **Reglas:** append-only con `agentes/scripts/hilo.sh`; nunca se edita un turno anterior. Los VEREDICTO los lee DevOps antes de mergear.

### 2026-11-14 15:28 · Diseño · nota · vuelta 0

Maquetas de ui-3, ui-4 y ui-5 entregadas en docs/superpowers/mockups/ (390x844, tokens de Prendie, referencia v4):
- 2026-11-14-ui-3-encabezado.html
- 2026-11-14-ui-4-voces.html
- 2026-11-14-ui-5-compositor.html

Decisiones clave:
1. Encabezado h-14 sticky, wordmark provisional "Estilo" en Bricolage (font-display text-titulo). "Tu espacio" es botón contorno mediano con ícono de cuadrícula, aria-haspopup="dialog" y aria-expanded. Sin lima.
2. Asesor sin burbuja, text-destacado (Manrope 600 16/24); firma "Estilo" en text-sobretitulo solo en el primer bloque del turno.
3. Persona a la derecha: self-end max-w-[82%] bg-hundido rounded-campo text-cuerpo.
4. Compositor: barra superficie, foto contorno size-11, campo BLANCO con borde de tinta 1,5 px (linea-fuerte) por indicación de Felipe, no como dice hoy DESIGN.MD/UX_UI_SPEC §7.9 (hundido). Enviar inverso; Detener cuadrado size-3 mientras responde; placeholders contextuales; min-w-0 obligatorio a 360 px.
5. Pendiente integradora: alinear UX_UI_SPEC §7.9 y DESIGN.MD con el campo blanco.

Sin verificar: no vistas en navegador; sin validación Opus; sin consulta de factibilidad al Constructor (solo tokens y clases de la spec).
