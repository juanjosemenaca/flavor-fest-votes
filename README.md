# AITORTILLA — flavor-fest-votes

Plataforma de votación y bases del concurso (Vite + React + Supabase).

## Versión

`1.0.5` — ver `package.json`.

## Variables de entorno

Copia `.env.example` a `.env` y rellena con el proyecto de Supabase (Dashboard → Settings → API). En **Vercel**, define las mismas variables en el proyecto (Settings → Environment Variables).

## Supabase (migraciones)

Las migraciones SQL están en `supabase/migrations/`. Para aplicarlas al proyecto remoto:

1. **Supabase CLI** (recomendado): `supabase link` y luego `supabase db push`, o
2. **Dashboard**: SQL Editor → ejecutar el contenido de las migraciones pendientes en orden.

Si el esquema ya está al día en producción, no hace falta repetir migraciones antiguas.

## Bases del concurso

Ruta SPA: **`/bases`** (ej. `https://www.aitortilla.com/bases`). Si no ves cambios, prueba recarga forzada o ventana privada (caché del navegador).

Dominio canónico en Vercel: **`www.aitortilla.com`** (añade el dominio en el proyecto y DNS). `aitortilla.com` sin `www` redirige a `www` vía `vercel.json`.

## Despliegue (Vercel)

Con el repo conectado a Vercel, un `git push` a `main` despliega la build de producción automáticamente.
