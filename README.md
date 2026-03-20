# AITORTILLA — flavor-fest-votes

Plataforma de votación y bases del concurso (Vite + React + Supabase).

## Versión

Ver `package.json` (p. ej. `1.0.7`).

## Variables de entorno

Copia `.env.example` a `.env` y rellena con el proyecto de Supabase (Dashboard → Settings → API). En **Vercel**, define las mismas variables en el proyecto (Settings → Environment Variables).

## Supabase (migraciones)

Las migraciones SQL están en `supabase/migrations/`.

### Con Supabase CLI (recomendado)

Desde la raíz del repo:

```bash
# Si no tienes el CLI instalado globalmente:
npx supabase db push
```

La primera vez en un ordenador:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
```

(`TU_PROJECT_REF` está en Supabase → **Settings** → **General** → *Reference ID*.)

Luego, cada vez que añadas migraciones nuevas:

```bash
npx supabase db push
```

Confirma con `Y` cuando pregunte si quieres aplicar las migraciones pendientes.

### Sin CLI (Dashboard)

**SQL Editor** → pega y ejecuta el contenido de las migraciones pendientes **en orden** (por nombre de archivo).

Si el esquema ya está al día en producción, no hace falta repetir migraciones antiguas.

### Tabla `suggestions` (buzón de sugerencias)

Si al enviar una sugerencia aparece **`could not find the table 'public.suggestions'`**, aplica la migración con **`npx supabase db push`** o ejecuta manualmente el archivo **`supabase/migrations/20260320120000_suggestions.sql`** en el SQL Editor.

## Bases del concurso

Ruta SPA: **`/bases`** (ej. `https://www.aitortilla.com/bases`). Si no ves cambios, prueba recarga forzada o ventana privada (caché del navegador).

Dominio canónico en Vercel: **`www.aitortilla.com`** (añade el dominio en el proyecto y DNS). `aitortilla.com` sin `www` redirige a `www` vía `vercel.json`.

## Publicar la web (GitHub + Vercel + Supabase)

Flujo habitual:

1. **Código en GitHub**  
   Haz commit de los cambios y súbelos a la rama `main`:
   ```bash
   git add -A
   git commit -m "descripción del cambio"
   git push origin main
   ```

2. **Frontend (Vercel u otro host)**  
   Con el repositorio conectado a **Vercel**, cada push a `main` suele lanzar un **deploy de producción** solo. Revisa en el dashboard de Vercel → *Deployments* que el build sea correcto y que las variables de entorno estén definidas.

3. **Base de datos (Supabase)**  
   Los cambios de esquema van en `supabase/migrations/`. Tras un push **solo de frontend** no suele hacer falta tocar la base. Si incorporas o modificas migraciones:
   - Con **Supabase CLI** (proyecto enlazado): `supabase link` y `supabase db push`, o  
   - En el **Dashboard** de Supabase → SQL Editor, aplicar manualmente las migraciones pendientes **en orden**.  
   Si producción ya tiene el esquema al día, no repitas migraciones antiguas.

4. **Comprobar**  
   Abre la URL pública (p. ej. `https://www.aitortilla.com`), recarga forzada o ventana privada si no ves cambios (caché).

En la práctica, el paso 2 es el despliegue automático en Vercel cuando `main` recibe el push.
