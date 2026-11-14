# Lector de tiendas

Estado: implementado, apagado por defecto · Fecha de las pruebas: **2026-11-14** · Código: `web/src/lib/shopping/` · Decisiones: DP-07, DP-09, DP-10, DP-18, DP-19, DT-09, DT-18

## Qué es

El lector real de `ProductSearch` (la herramienta `search_products` del asesor). Dado el encargo del asesor (pieza, categoría, color, precio máximo en CLP, talla opcional) consulta las tiendas configuradas, y devuelve **hasta 3 opciones** de tiendas distintas si se puede, ordenadas por qué tan bien calzan con la pieza pedida (no por precio, no por afiliación). Si no hay nada bueno, devuelve cero opciones y el asesor lo dice.

**No usa un modelo de lenguaje.** Son adaptadores deterministas contra los catálogos públicos estructurados que la propia tienda expone para su sitio. Eso quita la vía de inyección de instrucciones (solo se leen campos con nombre; los textos se tratan como texto plano), no gasta inferencia y es rápido.

## Cómo funciona

```
asesor ─ search_products ─▶ getProductSearch() ─▶ createRealProductSearch
                                                    │ 1. buildQuery: solo palabras de la pieza + color
                                                    │ 2. por tienda, en paralelo, cada una con su tope:
                                                    │      robots.txt (caché 6 h) → ¿la ruta está permitida?
                                                    │      detección de plataforma probando (caché 24 h)
                                                    │      consulta + normalización (adaptador Shopify o VTEX)
                                                    │ 3. score + filtros duros → pickDiverse (máx. 3)
                                                    ▼
                              ProductCandidate[] ─▶ finalizeOptions (validación del servidor, BF-03)
```

| Pieza | Archivo |
|---|---|
| Registro de tiendas (`SHOP_STORES`) | `stores.ts` |
| Selección por configuración | `index.ts` (`SHOPPING_SEARCH`) |
| Lo que sale a la red (única función) | `query.ts` |
| Defensa de red (lista blanca, IP privadas, redirecciones, tiempo, tamaño, User-Agent) | `safe-fetch.ts`, `net-guard.ts` |
| `robots.txt` (RFC 9309) | `robots.ts` |
| Detección de plataforma y búsqueda por tienda | `store-search.ts` |
| Adaptadores | `adapters/shopify.ts`, `adapters/vtex.ts` |
| Puntaje, filtros, diversificación | `rank.ts`, `lexicon.ts` |
| Caché de consulta (5 min) | `query-cache.ts` |
| Orquestación | `real-product-search.ts` |

### Plataformas

- **Shopify**: `GET /search/suggest.json?q=…&resources[type]=product&resources[limit]=10`. Devuelve título, precio, `url`, imagen, disponibilidad y, a veces, variantes (tallas).
- **VTEX**: `GET /api/catalog_system/pub/products/search?ft=<una palabra>&_from=0&_to=7`. VTEX exige **todas** las palabras de `ft`, por eso va una sola (la prenda) y el color, presupuesto y talla se filtran después, localmente. Con `+` en vez de `%20` responde 400.
- **Detección**: no se afirma de memoria; se prueba. Primero Shopify; si la respuesta no tiene su forma, VTEX; si ninguna, la tienda queda `unknown_platform` (caché 1 h, sin más solicitudes).

### Defensas (BF-03, BF-09, BF-10, DT-18)

- **Aislado**: el módulo solo recibe `ProductSearchRequest`. Sin perfil, clóset, historial ni identidad. A la red salen solo palabras de la descripción de la pieza y el color (≤ 6 palabras, solo `[a-z0-9]`). Presupuesto y talla **no viajan**: se filtran aquí. Hay test que inyecta datos personales en el encargo y comprueba que ningún byte sale.
- **Lista blanca**: solo los dominios de `SHOP_STORES`. Solo `https`, sin credenciales ni puerto. Nunca IP literales, `localhost` ni sufijos internos; además se verifica por DNS que el dominio no resuelva a una dirección privada.
- **Redirecciones**: se siguen a mano, máximo 2, y **solo al mismo host**. Cualquier otro destino se corta (`redirect_blocked`).
- **Tiempos**: 4 s por tienda, 8 s en total. **Tamaño**: máx. 1 MB por respuesta. **Solicitudes**: máx. 24 por búsqueda (suma de tiendas; robots incluido).
- **429**: no se insiste; la tienda queda como fallida en esa búsqueda.
- **User-Agent honesto**: `EstiloShopReader/1.0 (lector de catalogos publicos …)`; sin cookies.
- **robots.txt**: se revisa la ruta exacta (con query) antes de pedirla. Grupo propio si existe, si no `*`. 4xx = sin restricciones; 5xx/sin respuesta = no se consulta. Si lo prohíbe, la tienda se excluye y se anota (`robots_disallow`).
- **Texto plano**: títulos sin HTML, entidades de marcado, caracteres de control ni de dirección; ≤ 140 caracteres. Precio solo entero CLP (rechaza decimales: suele ser otra moneda). URL del producto: https, mismo dominio, sin parámetros de seguimiento. La `reason` se arma con plantilla desde los atributos que calzaron con **lo que pidió la persona**; nunca copia texto de la tienda.
- **Validación posterior**: el resultado pasa por `finalizeOptions` (BF-03) como cualquier otro buscador.

### Orden (DP-10)

Se descarta (no se rellena con algo mediocre, P-08): lo que no es la prenda pedida, lo agotado, lo que pasa del presupuesto, lo sin el color pedido (ni un tono parecido o cercano), lo que la tienda dice que no tiene en esa talla, lo infantil, lo del otro género si el encargo dice "mujer"/"hombre", y —si pidió palabras clave sin color— lo que no calza ninguna.

Puntaje (0 a 1): prenda 0,50 · color exacto 0,25 / tono parecido 0,15 / tono cercano 0,08 · palabras clave hasta 0,15 · presupuesto 0,05 · con stock 0,05 · talla confirmada 0,05. Desempate: precio, tienda, título. **La afiliación no se lee en ningún punto del ordenamiento** (hay test que la invierte). Se elige la mejor ficha de cada tienda y, si faltan, las siguientes; máx. 3.

`seen_at` es la hora real de la lectura (con la caché de 5 min, la de la lectura original). `searched` del contrato lleva `stores` = tiendas que respondieron y `results` = fichas leídas; las tiendas que fallaron salen en `stores_failed` (nombre y motivo) y se registran en el log `[shopping]` (solo conteos y motivos, nunca contenido de tiendas).

## Tiendas probadas (2026-11-14)

Pruebas con pocas solicitudes, espaciadas 1–2,5 s, con el User-Agent del lector. Query de prueba: la de los 3 escenarios de abajo.

| Dominio | Plataforma | Endpoint responde | `robots.txt` permite la ruta | Precios en CLP | Resultado |
|---|---|---|---|---|---|
| fashionspark.com | Shopify | Sí | Sí | Sí | **Funciona** |
| www.hushpuppies.cl | Shopify | Sí | Sí | Sí | **Funciona** (calzado) |
| guante.cl | Shopify | Sí | Sí | Sí | **Funciona** (calzado de cuero) |
| www.columbiachile.cl | Shopify | Sí | Sí | Sí | **Funciona** (outdoor) |
| www.shopcaterpillar.cl | Shopify | Sí | Sí | Sí | **Funciona** (casual/outdoor) |
| pilgrim.cl | Shopify | Sí | Sí | Sí | Funciona; catálogo de viaje, casi sin ropa |
| www.ellus.cl | VTEX | Sí (HTTP 206 con resultados) | Sí | Sí | **Funciona** |
| www.doite.cl | Shopify | Sí | **No** (`Disallow: /search`) | Sí | **Excluida por robots.txt** |
| www.tricot.cl | sin determinar | — | **No** (ambas rutas) | — | Excluida por robots.txt |
| www.paris.cl | propia (sin endpoints Shopify ni VTEX: 404) | No | — | — | Fuera |
| www.falabella.com | propia (404 en ambas) | No | — | — | Fuera |
| www.hites.com | propia (404 en ambas) | No | — | — | Fuera |
| www.americanino.cl | propia (Next.js; 404) | No | — | — | Fuera |
| www.rosen.cl | propia (404) | No | — | — | Fuera |
| www.lacoste.cl | propia (404) | No | — | — | Fuera |
| www.ripley.cl | bloquea bots (403) | No | — | — | Fuera |
| www.abc.cl (La Polar) | no determinada (redirecciones y respuesta de 1 MB+ no JSON) | No | — | — | Fuera |
| www.kayser.cl | — (certificado TLS inválido para `www`) | No | no alcanzable | — | Fuera |

Sin resolver o sin conexión desde la red de pruebas (no se pudo verificar; algunos dominios eran suposiciones): macowens.cl, lippi.cl, mimo.cl, ginatricot.cl, kosiuko.cl, ferradini.cl, naturalizer.cl, ecoclothing.cl, sybilla.cl. `bata.cl` redirige a `bata.com/cl` (no probada); H&M, Nike y adidas responden 403; Dafiti 403.

**Búsquedas reales** (los 3 escenarios, con las 8 tiendas que funcionaban; Doite se excluyó por robots):

1. "sandalia de taco bajo, camel, hasta $60.000" → 58 fichas leídas en 7 tiendas, 3 opciones de tiendas distintas (ejemplo en el reporte; con "para mujer" en la descripción el filtro de género se activa).
2. "blazer de lino, beige" → 54 fichas; solo Fashion's Park tiene blazers beige; 3 opciones, todas de esa tienda.
3. "vestido midi estampado" → 42 fichas; solo quedan vestidos midi/estampado de mujer (se descartan infantiles y los que no calzan ninguna palabra); 1 tienda.

Las respuestas se guardaron como fixtures en `web/tests/fixtures/shopping/` (JSON de las tiendas sin el HTML de las descripciones, y los `robots.txt` reales), y los tests corren **sin red** contra ellas.

## Cómo se agrega una tienda

1. Probar sin cargar la tienda: `GET https://<dominio>/robots.txt` y, según plataforma, `/search/suggest.json?q=sandalia&resources[type]=product&resources[limit]=3` (Shopify) o `/api/catalog_system/pub/products/search?ft=sandalia&_from=0&_to=2` (VTEX). Confirmar que responde JSON, que los precios son CLP enteros y que `robots.txt` no prohíbe la ruta.
2. Agregar el dominio **exacto** (el canónico, con o sin `www`) a `SHOP_STORES`: `dominio`, `dominio|Nombre visible` o `dominio|Nombre visible|afiliado`. Sin reiniciar código: es una variable de entorno (en Vercel, redeploy).
3. Si la tienda tiene un acuerdo de afiliación, marcarla `afiliado`: solo muestra la insignia (DP-10).
4. Una plataforma nueva (p. ej. otra API pública) se agrega como un adaptador en `adapters/` que implemente `parse*` y se sume a `store-search.ts`; con su fixture y su test.

```
SHOPPING_SEARCH=real
SHOP_STORES=www.hushpuppies.cl|Hush Puppies,fashionspark.com|Fashion's Park,guante.cl|Guante,www.ellus.cl|Ellus
```

## Cómo apagarlo

Cualquiera de estas, sin tocar código: `SHOPPING_SEARCH=none` (o `mock`), o dejar `SHOP_STORES` vacío (con `real` degrada a `none`), o vaciar `SHOPPING_SEARCH` (con IA real el valor por defecto es `none`: el lector real **nunca se enciende solo**). Con `none` el asesor describe la pieza y no inventa productos. Si una tienda objeta, se quita su dominio de `SHOP_STORES`.

## Límites conocidos

- **Stock y talla no están garantizados.** Disponibilidad = lo que dice la ficha en ese momento (`seen_at`). La talla solo se verifica cuando la tienda entrega variantes con tallas (en Shopify, `suggest` casi nunca las trae; pedirlas por producto —`/products/<handle>.js`— devuelve 429 a clientes automáticos). Si no se pudo confirmar, la `reason` lo dice.
- **El precio puede ser promocional** y cambiar al abrir la tienda; por eso siempre va con marca de tiempo y enlace a la tienda.
- **No conoce a la persona.** Género y edad solo se filtran si el asesor los pone en la descripción ("mujer"). Conviene que el prompt del asesor incluya "mujer"/"hombre" cuando lo sepa (decisión de la sesión integradora: este módulo no recibe datos privados).
- **Tiendas con plataforma propia quedan fuera** (Paris, Falabella, Hites, Ripley, Rosen, Lacoste y similares: sin catálogo público estructurado; solo se podría con un feed o acuerdo, DT-09 (c)). Las grandes tiendas por departamento son justamente las que no están.
- **Dependencia de endpoints que la tienda puede cerrar o cambiar** (Shopify `suggest`, VTEX `catalog_system`). Si cambia la forma de la respuesta, la tienda cae a `bad_response`/`unknown_platform` y la búsqueda sigue con las demás. Conviene mirar el log `[shopping]` y la tasa de `stores_failed`.
- **Relevancia aproximada**: puntaje por palabras (prenda, color y palabras clave con un vocabulario chico en `lexicon.ts`); no entiende estilo ni corte. "Taco bajo", "entallado" y similares casi nunca están en títulos y solo suman si aparecen.
- **Imágenes**: son URLs de la CDN de la tienda (p. ej. `cdn.shopify.com`); no se copian ni se almacenan.
- **Memoria de instancia**: las cachés (robots, plataforma, consultas) viven en memoria de cada instancia serverless; en frío se repiten solicitudes.

## Términos de uso: lo que el dueño debe conocer

- Son **catálogos públicos consultados en vivo**, por consulta de la persona y con un tope bajo de solicitudes; **no se guarda ni se copia el catálogo** (solo ≤ 3 fichas por consulta, 5 minutos, en memoria) y **siempre se enlaza a la tienda**; el asesor nunca compra (DP-09).
- Aun así, **cada tienda puede objetarlo**, y los términos de servicio de cada sitio pueden restringir el acceso automatizado aunque `robots.txt` lo permita. **Conviene un acuerdo o afiliación antes de abrir a público.**
- Shopify publica en el `robots.txt` y en `/agents.md` de sus tiendas pautas para agentes: identificarse como tráfico de agente, respetar 429 y `Retry-After`, y —para servidor a servidor— usar **Web Bot Auth**. Este lector se identifica por User-Agent, respeta robots y 429, pero **no implementa Web Bot Auth**; para producción con volumen hay que evaluarlo (o pasar a la integración UCP/Storefront que ofrecen esas tiendas con acuerdo).
- Mercado Libre no se incluye (no permite agentes externos, DT-09).
- Las tiendas que bloquean bots (403) o prohíben la ruta por `robots.txt` (Doite, Tricot) **no se consultan por ningún medio alternativo**.
- Antes de lanzar: A-01 (aprobación formal de DT-09) y una conversación con las tiendas elegidas; la lista definitiva de tiendas la entrega el dueño.
