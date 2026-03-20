# AITORTILLA — flavor-fest-votes

Plataforma de votación y bases del concurso (Vite + React + Supabase).

## Versión

`1.0.0` — ver `package.json`.

## Variables de entorno

Copia `.env.example` a `.env` y rellena con el proyecto de Supabase (Dashboard → Settings → API). En **Vercel**, define las mismas variables en el proyecto (Settings → Environment Variables).

## Supabase (migraciones)

Las migraciones SQL están en `supabase/migrations/`. Para aplicarlas al proyecto remoto:

1. **Supabase CLI** (recomendado): `supabase link` y luego `supabase db push`, o
2. **Dashboard**: SQL Editor → ejecutar el contenido de las migraciones pendientes en orden.

Si el esquema ya está al día en producción, no hace falta repetir migraciones antiguas.

## Despliegue (Vercel)

Con el repo conectado a Vercel, un `git push` a `main` despliega la build de producción automáticamente.
