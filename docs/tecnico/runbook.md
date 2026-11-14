# Runbook — ai-personal-stylist

Procedimientos operativos. Cada sección es un comando o una lista que se sigue sin pensar. Se llena la primera vez que cada cosa ocurre de verdad; una sección vacía es un pendiente, no un placeholder.

## 1. Verificación de variables de entorno

Lista de variables requeridas y en qué entornos de Vercel (Production / Preview / Development):

| Variable | Prod | Preview | Dev | Para qué |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ⛔ (usar credencial `preview_readonly`) | ✅ | |
| `ADMIN_EMAILS` | ✅ | ✅ | ✅ | allowlist de admin; ausente = acceso cerrado |
| `RESEND_API_KEY` | ✅ | ⛔ | ✅ | |

Comando: `vercel env ls` desde `web/`.

## 2. Rollback

```bash
cd web && git revert <sha-del-squash> && git push origin main
```

Vercel redeploya `main`. Ensayado el: pendiente.

## 3. Rotación de claves

Orden: crear la nueva → ponerla en los 3 entornos → redeploy → verificar → revocar la vieja. Nunca revocar primero.

## 4. QA del primer disparo real de un cron

- [ ] Agenda en `vercel.json` correcta (hora UTC)
- [ ] Ruta protegida por `CRON_SECRET`
- [ ] Primer envío verificado en Resend (destinatario, asunto, enlaces)
- [ ] Log en Vercel sin errores

## 5. Cómo entrar a un Preview

Primero sesión en vercel.com con la cuenta dueña, después el link. Un 404 o 302 antes de que el app reciba la petición es la puerta de Vercel, no el app.
