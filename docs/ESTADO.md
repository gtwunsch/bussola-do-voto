# Bússola do Voto — Estado do Projeto
> Atualizado em 2026-06-10. Este arquivo é a memória do projeto: qualquer nova conversa/sessão deve começar lendo-o.

## Visão
Match eleitoral 100% baseado em votações nominais reais do Congresso (dados abertos oficiais), com transparência (gastos, presença, registros judiciais) como contexto — **o foco é o voto**, não juízos derivados.

## Arquitetura
- **Front**: Vite vanilla JS, neste repositório. Deploy automático: push na `main` → Vercel (https://bussola-do-voto.vercel.app).
- **Dados estáticos**: `public/dados/*.json` (votações, votos individuais, parlamentares, argumentos, presença, registros judiciais).
- **Dados dinâmicos**: tabela `bussola_dados` (chave→jsonb) no Supabase projeto DEDICADO `psxqsmjopeyzydruafub` (org gratuita `bussola` — isolado dos outros apps; antes era compartilhado com o Cartana, migrado em 10/06/2026) — chaves `ceap` (gastos deputados), `ceaps` (gastos senadores), `ceap_ids`. Lidas pelo front via REST com anon key.
- **Coletor**: Edge Function `bussola-coletor` (projeto Bussola): `/ceap-next` (lote incremental, foi guiado por pg_cron job "bussola-ceap", hoje desligado), `/ceaps` (CSV oficial do Senado, roda em background), `/status`.
- **Auxiliares no projeto wintz** `ecnqcsnbcdpaqvoxexjs` (podem ser apagadas ou reusadas): `camara-votos-compact` (proxy para votos nominais sem truncamento), `coleta-presenca` (presença oficial por deputado/ano).
- **Auth (fase 3, em andamento)**: tabela `bussola_respostas` (user_id, casa, votacao_id, resposta S/N/A) com RLS por usuário — criada, aguardando front + Google OAuth (usuário precisa criar OAuth Client e habilitar no painel Supabase).

## Fontes
Câmara: dadosabertos.camara.leg.br (votações, votos, despesas CEAP, lista). Presença: páginas oficiais /deputados/{id}/presenca-plenario/{ano}. Senado: legis.senado.leg.br/dadosabertos (lista, /votacao) e CSV CEAPS senado.gov.br/transparencia/LAI/verba/despesa_ceaps_{ano}.csv. Registros judiciais: verificação editorial com fonte linkada (STF/STJ/grande imprensa citando processo), estados: ativo (réu/condenado/inquérito/denúncia) ⚠️, histórico encerrado ℹ️, nada ativo encontrado ✅.

## Decisões metodológicas
- Afinidade: só votos explícitos Sim/Não contam; abstenção/ausência fora do numerador e denominador.
- Ranking: ajuste bayesiano (iguais+2)/(comparáveis+4) para evitar 3/3 > 7/8; aviso "base pequena" <5.
- Temas: cada votação tem `tema` e flag `central` (temas centrais de projeto de país pesam 2× no índice). Subtemas a criar quando a base crescer.
- Gastos: SEM nota (decisão de produto: gasto alto ≠ desperdício; gasto baixo não compensa voto ruim). Apenas comparativo factual vs mediana da Casa, por categoria.
- Perguntas: "sim" do usuário = voto "Sim" na matéria; linguagem leiga; argumentos dos dois lados com fontes da época.

## PROTOCOLO DE COLETA INCREMENTAL (obrigatório — lições de duas perdas totais)
1. NUNCA "tudo ou nada": antes de coletar, gravar uma FILA (lista de candidatas) em arquivo/DB.
2. Processar UM item por vez e PERSISTIR imediatamente (arquivo data/*.json parcial válido, ou upsert na bussola_dados) — JSON deve ser válido a cada passo (reescrever o arquivo inteiro a cada item, nunca append cru).
3. Retomada idempotente: ao iniciar, ler o que já existe e pular feitos.
4. Trabalho server-side > agente: preferir Edge Function + pg_cron (padrão usado no CEAP) quando for repetitivo.
5. Agentes de pesquisa: limitar escopo (≤10 itens por agente), salvar a cada item, reportar parciais.

## Roadmap
- [x] Fase 3a: conta por E-MAIL/SENHA (decisão: sem Google), respostas salvas/editáveis, sessão persistente, recuperação de senha. Pendente do usuário: Site URL no painel Supabase + (opcional) desativar Confirm email.
- [x] Fase 3b (parcial): +27 votações por tema (Câmara 19, Senado 8; total 29+17), com tema/central/pergunta/argumentos embutidos em *_extra.json. Pendentes: subtemas, pesos por usuário, saúde no Senado (não há nominal aberta no período).
- [x] Comparador lado a lado, deep-link #/p/{casa}/{id}, perguntas ordenadas por centrais+divisão, busca por nome na home.
- [x] pg_cron mensal (dia 1: reset+recoleta CEAP 4h-7h UTC; CEAPS 7h30). Pendentes: recoleta de presença e reverificação periódica de registros judiciais.
- [ ] Vereadores/dep. estaduais (SP primeiro), eleições: mapear candidatos↔histórico.

## Como retomar o trabalho
Nova conversa → clonar/ler este repo (gtwunsch/bussola-do-voto) → ler docs/ESTADO.md → pedir tokens necessários ao usuário (GitHub fine-grained para push; Supabase já conectado via MCP no Cowork). Commits: sempre mensagens descritivas; push = deploy.
