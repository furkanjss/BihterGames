# Bihter Games — Studio Hub

Internal team board at `https://bihtergames.com/studio/`.

## Setup

1. Create a free [Supabase](https://supabase.com) project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor.
3. Copy `.env.example` → `.env.local` and fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In Supabase Auth → Users, create 2–3 email/password accounts.
5. On Vercel, add the same `VITE_SUPABASE_*` env vars and redeploy.

## Local

```bash
cd todo
npm install
npm run dev
```

Opens on port 5174 with base `/studio/`.

## Build (from repo root)

```bash
npm run build
```

Landing → `dist/`, Studio Hub → `dist/studio/`.
