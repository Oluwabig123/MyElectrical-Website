# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Cloud Product Manager (Supabase)

The Products page supports cloud updates from phone/desktop with auto category placement.

### 1) Add environment variables

Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 2) Create table + RLS policies

Run SQL from:

`supabase/admin_products.sql`

in Supabase SQL Editor.

### 3) Create admin users

In Supabase dashboard:

`Authentication -> Users -> Add user`

Only authenticated users can add/edit/delete cloud products.

### 4) Run locally

```bash
npm install
npm run dev
```

### 5) Deploy

Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting environment (Vercel/Netlify), then redeploy.
