# 🧭 Bússola do Voto

Match eleitoral baseado em votações nominais reais do Congresso Nacional — 100% dados abertos oficiais (Câmara dos Deputados e Senado Federal).

- Front: Vite (vanilla JS), dados estáticos em `public/dados/`
- Gastos CEAP: coletados server-side (Supabase Edge Function + pg_cron) e lidos via REST
- Deploy: Vercel

`npm install && npm run dev`
