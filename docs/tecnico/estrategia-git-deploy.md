# Estrategia de git y deploy — ai-personal-stylist

**Fecha:** 2026-11-14 · **Estado:** decisiones tomadas al arrancar con `project-inception`

> Documento operativo. Las decisiones vienen de la doctrina del toolkit
> (`project-inception/knowledge/repo-setup.md`); acá quedan con los nombres de este proyecto.

## 1. Arquitectura

Un solo repo: `pipoandre05/ai-personal-stylist` (privado). Raíz = docs, marca, hooks; `web/` = Next.js, Root Directory de Vercel. Proyecto Vercel: `pendiente (A-04)`.

## 2. Ramas

Trunk-based, sin `develop`. `main` = producción en cada merge. `feat/`, `fix/`, `chore/` ≤ 3 días → PR → Preview. `hotfix/` en horas. Slug en español describiendo el resultado. Ramas actualizadas con merge desde `main`, nunca rebase.

## 3. Pull Requests

Obligatorio para todo cambio que no sea docs-only. Squash siempre. ≤ 400 líneas. Sección `## Humo` cuando se estrena integración externa. Migración aplicada en Supabase por Felipe antes del merge. Revisión visual de Felipe antes de mergear UI.

## 4. Protección

GitHub Free: sin branch protection. Sustituto: `web/.githooks/pre-push` (`git config core.hooksPath .githooks`) + `permissions.deny` en `.claude/settings.json`. ⚠️ `hooksPath` reemplaza `.git/hooks/`: el `post-commit` de Graphify vive en `.githooks/`.

## 5. Vercel

| Entorno | Rama | Base |
|---|---|---|
| Production | `main` | producción |
| Preview | toda rama con PR | producción, **solo lectura** (`preview_readonly`) |
| Development | local | producción o local |

## 6. Variables de entorno

Toda variable nueva va a los 3 entornos. Matriz en `runbook.md` §1.

## 7. Rollback

`git revert <sha>` + push. Ensayo: pendiente.
