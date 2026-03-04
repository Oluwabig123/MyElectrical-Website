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
This script creates/updates the products table, policies, grants, realtime publication, and a public Storage bucket (`product-images`) for image uploads.

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

If you deploy on Netlify, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in:
`Site configuration -> Environment variables`, then redeploy.
Security headers are managed in `public/_headers`.

### 6) Verify end-to-end

1. Open `/products` and click `Open manager`.
2. Sign in with the admin user you created.
3. Add one test product and save.
4. Add an image URL or upload an image, then save.
5. Refresh the page (or open from another phone/browser) and confirm it appears in the right category with its image.

### Troubleshooting

- If cloud actions fail in production only: confirm hosting env vars are set and redeployed.
- If cloud actions fail in production only on Netlify: confirm `public/_headers` includes Supabase in `connect-src`.
- If product images do not display: confirm your CSP `img-src` allows `https:` and re-deploy.
- If products load but live updates do not appear instantly: re-run `supabase/admin_products.sql` and check Realtime is enabled for `public.admin_products`.
- If login fails: create/reset the user in `Authentication -> Users` and test again.
