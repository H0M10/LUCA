# Luca

> Construye tu árbol genealógico con historial clínico. Conoce y reconoce tu origen ancestral.

App web responsiva (React + Vite + TypeScript) con backend en Node + Express + Prisma sobre PostgreSQL.

---

## Stack

- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, TanStack Query, React Router, Zod
- **Backend:** Node 22, Express, TypeScript, Prisma, JWT, bcrypt, Helmet
- **BD:** PostgreSQL (local 5433 / Supabase en prod)
- **Monorepo:** pnpm workspaces

## Estructura

```
luca/
├── apps/
│   ├── api/        Backend Express + Prisma
│   └── web/        Frontend React + Vite
└── packages/
    └── shared/     Schemas zod y tipos compartidos
```

## Desarrollo local

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Variables de entorno
Copy-Item .env.example apps/api/.env
Copy-Item .env.example apps/web/.env

# 3. Aplicar schema en tu Postgres local (puerto 5433 por defecto)
# Pide el archivo schema.sql al mantenedor o consulta _local/db/ en tu copia

# 4. Generar cliente Prisma
pnpm db:pull
pnpm db:generate

# 5. Arrancar todo en paralelo
pnpm dev
```

- API → <http://localhost:3000>
- Web → <http://localhost:5173>

## Scripts

```
pnpm dev            arranca api + web
pnpm api:dev        solo backend
pnpm web:dev        solo frontend
pnpm -r typecheck   verifica tipos
pnpm -r build       compila todo para producción
pnpm db:pull        introspecta la BD y actualiza prisma/schema.prisma
pnpm db:generate    regenera el cliente Prisma
```

## Despliegue

- Frontend → GitHub Pages (vía `.github/workflows/deploy-pages.yml`)
- Backend → Render (free tier)
- BD → Supabase (free tier)

Los detalles paso a paso están en la guía privada de `_local/docs/` (no se incluye en este repo público).

---

Desarrollado por **3gm** · © 2026
