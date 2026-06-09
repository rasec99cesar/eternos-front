# sempre-web

Frontend da plataforma Sempre — React + TypeScript + Vite.

## Stack

- React 18 + TypeScript
- Vite
- React Router v6
- TanStack Query
- CSS Modules
- Umami Analytics

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha VITE_API_URL
npm run dev            # http://localhost:5173
```

## Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build estático em `dist/` |
| `npm run preview` | Preview do build |
| `npm run typecheck` | Verifica tipos |

## Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3000        # URL do backend
VITE_APP_URL=http://localhost:5173
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_UMAMI_SRC=                          # opcional
VITE_UMAMI_WEBSITE_ID=                   # opcional
```

## Deploy (Cloudflare Pages)

| Campo | Valor |
|-------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output | `dist` |

O arquivo `public/_redirects` já configura o fallback SPA:
```
/*    /index.html   200
```
