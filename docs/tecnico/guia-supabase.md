# Guía: crear el proyecto de Supabase y conectar la app

Tiempo: unos 10 minutos. Al terminar, la app puede crear cuentas, guardar datos y fotos, y hablar con Claude.

> Los nombres de menú de Supabase cambian de vez en cuando. Si algo no está donde dice acá, usa el buscador del panel (`Cmd + K`).

## 1. Crear el proyecto

1. Entra a <https://supabase.com/dashboard> e inicia sesión.
2. **New project**.
3. Completa:
   - **Name:** `ai-personal-stylist`
   - **Database password:** genera una y guárdala en tu gestor de contraseñas (hoy no la usamos, pero no se puede recuperar).
   - **Region:** South America (São Paulo).
4. **Create new project** y espera a que termine de aprovisionar (1 a 2 minutos).

## 2. Permitir entrar sin confirmar el correo (solo para el piloto)

1. Menú lateral: **Authentication**.
2. **Sign In / Providers** → **Email**.
3. Deja **Enable Email provider** activado.
4. **Desactiva "Confirm email"**.
5. **Save**.

Por qué: el correo de confirmación de Supabase sin SMTP propio permite muy pocos envíos por hora. Para el piloto entramos con email y contraseña directo (decisión DT-03). Se vuelve a activar con SMTP propio antes de abrir a testers.

## 3. Crear las tablas (dos archivos, en orden)

1. Menú lateral: **SQL Editor** → **New query**.
2. Abre en tu editor el archivo `web/supabase/migrations/20261114000000_esquema_inicial.sql`, copia **todo** el contenido, pégalo y presiona **Run**.
   - Resultado esperado: `Success. No rows returned`.
3. **New query** otra vez. Repite con `web/supabase/migrations/20261114010000_integridad_y_borrado.sql`.
   - Resultado esperado: `Success. No rows returned`.

Para copiar cada archivo al portapapeles desde la terminal (en la carpeta del proyecto):

```bash
pbcopy < web/supabase/migrations/20261114000000_esquema_inicial.sql
```

```bash
pbcopy < web/supabase/migrations/20261114010000_integridad_y_borrado.sql
```

Si Supabase muestra una advertencia de "destructive operation" es por los `drop policy if exists`; es esperado, confirma.

### Comprobar que quedó bien

- **Table Editor**: deben aparecer 12 tablas (`profiles`, `style_profiles`, `color_analyses`, `garments`, `conversations`, `messages`, `outfits`, `outfit_items`, `outfit_feedback`, `memory_facts`, `consents`, `analytics_events`), todas con la etiqueta de RLS activado.
- **Storage**: debe existir el bucket `user-media`, marcado como **privado**.

## 4. Copiar las claves a la app

1. En Supabase, botón **Connect** (arriba) o **Project Settings → API Keys**. Necesitas dos valores:
   - **Project URL** — se ve como `https://xxxxxxxx.supabase.co`
   - **Publishable key** — empieza con `sb_publishable_…` (si tu proyecto solo muestra claves antiguas, usa la **anon public**).
   - **No copies** la `service_role` / secret key: este proyecto no la usa.
2. En la terminal, en la carpeta del proyecto, crea tu archivo local de variables:

```bash
cp web/.env.local.example web/.env.local
```

3. Abre `web/.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODE=live
```

- `ANTHROPIC_API_KEY`: una clave de <https://console.anthropic.com> → **API Keys**. Puedes usar la misma de Prendie o crear una nueva llamada `ai-personal-stylist` (recomendado: así ves el gasto de este proyecto por separado).
- `AI_MODE=live` usa Claude de verdad. Con `AI_MODE=mock` la app funciona con respuestas simuladas y no gasta.
- El resto de las variables déjalas como vienen.

`web/.env.local` está ignorado por git: nunca se sube al repo.

## 5. Avisarme

Escribe **"Supabase listo"** en el chat. Con eso verifico el flujo completo: crear cuenta, subir una prenda, paleta y primer look.

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El segundo SQL da error `relation "public.garments" does not exist` | No se ejecutó el primero | Ejecuta primero `…000000_esquema_inicial.sql` |
| Error `permission denied for schema storage` | Rol del editor sin permisos | Ejecuta el SQL desde el SQL Editor del panel (no desde un cliente externo) |
| Al crear cuenta pide confirmar correo | Paso 2 no guardado | Revisa que "Confirm email" esté desactivado y guardado |
| La app dice que faltan variables | `.env.local` en otra carpeta | Debe estar en `web/.env.local`; reinicia el servidor de desarrollo |

Cualquier error, pégame el mensaje tal cual.
