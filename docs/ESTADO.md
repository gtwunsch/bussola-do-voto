# Bússola do Voto — Estado do Projeto
> Atualizado em 2026-06-10. Este arquivo é a memória do projeto: qualquer nova conversa/sessão deve começar lendo-o.

## Visão
Match eleitoral 100% baseado em votações nominais reais do Congresso (dados abertos oficiais), com transparência (gastos, presença, registros judiciais) como contexto — **o foco é o voto**, não juízos derivados.

## Arquitetura
- **Front**: Vite vanilla JS, neste repositório. Deploy automático: push na `main` → Vercel (https://bussola-do-voto.vercel.app).
- **Dados estáticos**: `public/dados/*.json` (votações, votos individuais, parlamentares, argumentos, presença, registros judiciais).
- **Dados dinâmicos**: tabela `bussola_dados` (chave→jsonb) no Supabase projeto Cartana `hiripppzlvlmoujlusey` — chaves `ceap` (gastos deputados), `ceaps` (gastos senadores), `ceap_ids`. Lidas pelo front via REST com anon key.
- **Coletor**: Edge Function `bussola-coletor` (Cartana): `/ceap-next` (lote incremental, foi guiado por pg_cron job "bussola-ceap", hoje desligado), `/ceaps` (CSV oficial do Senado, roda em background), `/status`.
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
- [ ] Fase 3a: login Google (aguarda cliques do usuário no Google Cloud + painel Supabase), respostas salvas/editáveis, tela "minhas respostas".
- [ ] Fase 3b: +20-40 votações por tema (usar PROTOCOLO acima; proxy wintz para votos da Câmara), subtemas, blocos de perguntas por tema com pesos opcionais do usuário.
- [ ] Comparador lado a lado (2-3 parlamentares), página/deep-link por parlamentar, "pautas que mais dividem" no onboarding, busca por nome no início (não só no resultado).
- [ ] Atualização periódica automatizada (pg_cron mensal para CEAP/CEAPS; recoleta de presença; reverificação de registros judiciais com data).
- [ ] Vereadores/dep. estaduais (SP primeiro), eleições: mapear candidatos↔histórico.

## Como retomar o trabalho
Nova conversa → clonar/ler este repo (gtwunsch/bussola-do-voto) → ler docs/ESTADO.md → pedir tokens necessários ao usuário (GitHub fine-grained para push; Supabase já conectado via MCP no Cowork). Commits: sempre mensagens descritivas; push = deploy.
