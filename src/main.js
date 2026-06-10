import './style.css'

// ---------- carga de dados ----------
const SUPA = 'https://hiripppzlvlmoujlusey.supabase.co'
let SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpcmlwcHB6bHZsbW91amx1c2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTk1MjYsImV4cCI6MjA2NjA3NTUyNn0.crVGxKs8mwGFP3LUPhMLRZjXxgw_p25TbsoExvNYiow' // injetada no build via env VITE_SUPABASE_ANON_KEY se disponível
try { if (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY } catch (e) {}

const D = { camara: {}, senado: {}, registros: { camara: {}, senado: {} }, presenca: { camara: {}, senado: {} }, ceap: null, ceaps: null }

async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(url); return r.json() }

async function carregar() {
  const [cd, cv, cvo, ca, cp, sd, sv, svo, sa, sp, reg] = await Promise.all([
    j('/dados/camara_deputados.json'), j('/dados/camara_votacoes.json'), j('/dados/camara_votos.json'),
    j('/dados/camara_argumentos.json'), j('/dados/camara_presenca.json'),
    j('/dados/senado_senadores.json'), j('/dados/senado_votacoes.json'), j('/dados/senado_votos.json'),
    j('/dados/senado_argumentos.json'), j('/dados/senado_presenca.json'), j('/dados/registros_judiciais.json'),
  ])
  D.camara = { parlamentares: cd, votacoes: PERG.camara.map(p => ({ ...cv.find(v => v.id === p.id), pergunta: p.q, arg: ca[p.id] })), votos: cvo }
  D.senado = { parlamentares: sd, votacoes: PERG.senado.map(p => ({ ...sv.find(v => v.id === p.id), pergunta: p.q, arg: sa[p.id] })), votos: svo }
  D.presenca.camara = cp; D.presenca.senado = sp
  D.registros = reg
  // CEAP (dinâmico — pode ainda estar em coleta)
  try {
    const r = await fetch(SUPA + '/rest/v1/bussola_dados?chave=in.(ceap,ceaps)&select=chave,valor', { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } })
    if (r.ok) { const rows = await r.json(); for (const row of rows) D[row.chave] = row.valor }
  } catch (e) { /* segue sem gastos */ }
  if (D.ceap) prepCeap()
  if (D.ceaps) prepCeaps()
}

// perguntas curadas (ordem cronológica)
const PERG = {
  camara: [
    { id: '2357053-47', q: 'Você é a favor do arcabouço fiscal — as regras que limitam o crescimento dos gastos públicos?' },
    { id: '345311-270', q: 'Você é a favor do marco temporal, que limita a demarcação de terras indígenas às áreas ocupadas em 1988?' },
    { id: '2196833-373', q: 'Você é a favor da Reforma Tributária que unificou os impostos sobre o consumo (criando CBS e IBS)?' },
    { id: '2374400-110', q: 'Você é a favor da legalização e regulamentação das apostas online (bets), com taxação do setor?' },
    { id: '2383019-54', q: 'Você é a favor de aumentar o número de deputados federais de 513 para 531?' },
    { id: '2515648-44', q: 'Você é a favor de derrubar o decreto do governo que aumentava o IOF (imposto sobre operações financeiras)?' },
    { id: '257161-454', q: 'Você é a favor de simplificar e flexibilizar as regras de licenciamento ambiental para obras e empreendimentos?' },
    { id: '2270800-135', q: "Você é a favor de exigir aval prévio do próprio Congresso para que parlamentares sejam processados criminalmente (a chamada 'PEC da Blindagem')?" },
    { id: '2562149-7', q: 'Você é a favor de dar urgência ao projeto de anistia aos envolvidos nos atos de 8 de janeiro de 2023?' },
    { id: '2579832-62', q: 'Você é a favor do PL Antifacção, que endurece penas contra facções criminosas (na versão alterada pelo relator)?' },
  ],
  senado: [
    { id: '6714', q: 'Você é a favor do arcabouço fiscal — as regras que limitam o crescimento dos gastos públicos?' },
    { id: '6756', q: 'Você é a favor do marco temporal, que limita a demarcação de terras indígenas às áreas ocupadas em 1988?' },
    { id: '6773', q: 'Você é a favor da Reforma Tributária que unificou os impostos sobre o consumo (criando CBS e IBS)?' },
    { id: '6781', q: 'Você é a favor de limitar as decisões individuais (monocráticas) de ministros do STF?' },
    { id: '6824', q: 'Você é a favor de colocar na Constituição a criminalização do porte de drogas, mesmo para consumo pessoal?' },
    { id: '6935', q: 'Você é a favor de simplificar e flexibilizar as regras de licenciamento ambiental para obras e empreendimentos?' },
    { id: '6951', q: 'Você é a favor de aumentar o número de deputados federais de 513 para 531?' },
    { id: '7007', q: 'Você é a favor de unificar em 8 anos — e mudar a contagem — dos prazos de inelegibilidade da Lei da Ficha Limpa?' },
    { id: '7032', q: 'Você é a favor de incluir o marco temporal das terras indígenas na Constituição?' },
  ],
}

// ---------- CEAP ----------
const CAT = { '1': 'Escritório de apoio', '2': 'Locomoção/alim./hosp.', '3': 'Combustíveis', '4': 'Consultorias', '5': 'Divulgação do mandato', '6': 'Material de escritório', '7': 'Software/postais/assin.', '8': 'Segurança', '9': 'Passagem aérea (reemb.)', '10': 'Telefonia', '11': 'Serviços postais', '12': 'Assinaturas', '13': 'Alimentação', '14': 'Hospedagem', '15': 'Locação de veículos', '119': 'Fretamento de aeronaves', '120': 'Locação de veículos', '121': 'Fretamento de embarcações', '122': 'Táxi/pedágio/estac.', '123': 'Passagens terrestres', '137': 'Cursos e eventos', '145': 'Certificados digitais', '998': 'Passagem aérea (SIGEPA)', '999': 'Passagem aérea (RPA)' }
const SENSIVEIS = ['3', '5', '14', '15', '119', '120', '121', '122']
const LBLS = (k) => {
  if (!k) return 'Não classificado'
  if (k.startsWith('Contratação')) return 'Consultorias e assessorias'
  if (k.startsWith('Locomoção')) return 'Locomoção, hosped., alim. e combustíveis'
  if (k.startsWith('Divulgação')) return 'Divulgação do mandato'
  if (k.startsWith('Aluguel')) return 'Aluguel de escritório'
  if (k.startsWith('Passagens')) return 'Passagens'
  if (k.startsWith('Aquisição')) return 'Material de escritório/software'
  if (k.toLowerCase().includes('segurança')) return 'Segurança privada'
  return k.slice(0, 40)
}
const sensS = k => /^(Divulgação|Locomoção)/.test(k || '')
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
const ceapCalc = {}, ceapsCalc = {}
let ceapMed = {}, ceapsMed = {}
function median(arr) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const md = Math.floor(s.length / 2); return s.length % 2 ? s[md] : (s[md - 1] + s[md]) / 2 }
function sensAbs(d, senado) { let s = 0; for (const k of Object.keys(d.c)) if (senado ? sensS(k) : SENSIVEIS.includes(k)) s += d.c[k]; return s }
const prank = (arr, v) => arr.length > 1 ? arr.filter(x => x <= v).length / arr.length : 0.5
function prepCeap() {
  const ids = Object.keys(D.ceap).filter(k => !k.startsWith('_') && D.ceap[k] && typeof D.ceap[k].t === 'number')
  const tot = ids.map(id => D.ceap[id].t).sort((a, b) => a - b)
  const sab = ids.map(id => sensAbs(D.ceap[id], false)).sort((a, b) => a - b)
  const cats = new Set(); ids.forEach(id => Object.keys(D.ceap[id].c).forEach(c => cats.add(c)))
  ceapMed = { _t: median(tot), _s: median(sab) }
  for (const c of cats) ceapMed[c] = median(ids.map(id => D.ceap[id].c[c] || 0))
  for (const id of ids) {
    const d = D.ceap[id], rT = prank(tot, d.t), sa = sensAbs(d, false), rS = prank(sab, sa)
    const nota = Math.max(0, Math.min(10, 10 - 5 * rT - 5 * rS))
    ceapCalc[id] = { nota: Math.round(nota * 10) / 10, total: d.t, rT: Math.round(rT * 100), sa, rS: Math.round(rS * 100), top: Object.entries(d.c).sort((a, b) => b[1] - a[1]).slice(0, 4) }
  }
}
function prepCeaps() {
  const ks = Object.keys(D.ceaps).filter(k => !k.startsWith('_') && D.ceaps[k] && typeof D.ceaps[k].t === 'number')
  const tot = ks.map(k => D.ceaps[k].t).sort((a, b) => a - b)
  const sab = ks.map(k => sensAbs(D.ceaps[k], true)).sort((a, b) => a - b)
  const cats = new Set(); ks.forEach(k => Object.keys(D.ceaps[k].c).forEach(c => cats.add(c)))
  ceapsMed = { _t: median(tot), _s: median(sab) }
  for (const c of cats) ceapsMed[c] = median(ks.map(k => D.ceaps[k].c[c] || 0))
  for (const k of ks) {
    const d = D.ceaps[k], rT = prank(tot, d.t), sa = sensAbs(d, true), rS = prank(sab, sa)
    const nota = Math.max(0, Math.min(10, 10 - 5 * rT - 5 * rS))
    ceapsCalc[norm(k)] = { nota: Math.round(nota * 10) / 10, total: d.t, rT: Math.round(rT * 100), sa, rS: Math.round(rS * 100), top: Object.entries(d.c).sort((a, b) => b[1] - a[1]).slice(0, 4) }
  }
}
function ceapsLookup(nome) {
  const n = norm(nome)
  if (ceapsCalc[n]) return ceapsCalc[n]
  const hits = Object.keys(ceapsCalc).filter(k => k.startsWith(n + ' ') || n.startsWith(k + ' '))
  return hits.length === 1 ? ceapsCalc[hits[0]] : null
}
const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR')

// ---------- app ----------
const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']
const S = { casa: null, uf: '', i: 0, ans: {}, shownBanner: false, filtUF: false, filtP: '', filtQ: '', shown: 30 }
const app = document.getElementById('app')
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const cfgs = {
  camara: { nome: 'Deputados Federais', singular: 'deputado federal', foto: id => `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`, perfil: id => `https://www.camara.leg.br/deputados/${id}`, perfilLabel: 'Perfil oficial na Câmara (gastos detalhados, salário, presença)' },
  senado: { nome: 'Senadores', singular: 'senador', foto: id => `https://www.senado.leg.br/senadores/img/fotos-oficiais/senador${id}.jpg`, perfil: id => `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${id}`, perfilLabel: 'Perfil oficial no Senado (transparência, gastos CEAPS, presença)' },
}
const voteN = v => v === 'Sim' ? 'S' : (v === 'Não' ? 'N' : null)
window.S = S

function home() {
  S.casa = null; S.i = 0; S.ans = {}; S.shownBanner = false; S.shown = 30
  app.innerHTML = `
  <div class="hero fade">
    <h1>Vote em quem<br>vota como você.</h1>
    <p class="sub">Responda perguntas simples — sim ou não — e descubra quais parlamentares mais votaram de acordo com as suas opiniões, usando apenas <b>votações reais e públicas</b> do Congresso Nacional. Com transparência de gastos, presença e registros públicos.</p>
    <div class="cards">
      <button class="pick" id="pk-camara">
        <span class="em">🏛️</span><h3>Deputados Federais</h3>
        <p>${D.camara.votacoes.length} votações marcantes · ${D.camara.parlamentares.length} deputados em exercício</p>
      </button>
      <button class="pick" id="pk-senado">
        <span class="em">⚖️</span><h3>Senadores</h3>
        <p>${D.senado.votacoes.length} votações marcantes · ${D.senado.parlamentares.length} senadores</p>
      </button>
    </div>
    <div class="row">
      <select id="uf"><option value="">Seu estado (opcional)</option>${UFS.map(u => `<option ${S.uf === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
      <button class="btn btn-p" id="start" disabled>Começar →</button>
    </div>
    <div class="note">ℹ️ Deputados federais e senadores são eleitos por estado, mas votam leis que valem para o país inteiro — vale a pena conhecê-los. Vereadores e deputados estaduais chegam numa próxima versão.</div>
  </div>`
  document.getElementById('pk-camara').onclick = () => pick('camara')
  document.getElementById('pk-senado').onclick = () => pick('senado')
  document.getElementById('start').onclick = () => { S.uf = document.getElementById('uf').value; S.i = 0; S.ans = {}; S.shownBanner = false; quiz(); scrollTo({ top: 0 }) }
}
function pick(c) { S.casa = c; document.querySelectorAll('.pick').forEach(b => b.classList.remove('sel')); document.getElementById('pk-' + c).classList.add('sel'); document.getElementById('start').disabled = false }

function ctxHTML(v) {
  const a = v.arg || {}
  const bullets = (arr) => (arr || []).map(x => `<li>${esc(x)}</li>`).join('')
  return `<div class="ctxbody">
    <div class="muda"><b>O que muda:</b> ${esc(a.oQueMuda || v.resumo)}</div>
    ${a.aFavor ? `<h5 class="sim">👍 Quem votou SIM defendia</h5><ul>${bullets(a.aFavor)}</ul>` : ''}
    ${a.contra ? `<h5 class="nao">👎 Quem votou NÃO defendia</h5><ul>${bullets(a.contra)}</ul>` : ''}
    <div class="fontes"><b>Resultado real:</b> ${esc(v.resultado)} (${esc(v.placar)}) · ${[v.linkFonte, ...(a.fontes || [])].filter(Boolean).slice(0, 3).map((f, i) => `<a href="${esc(f)}" target="_blank" rel="noopener">${i === 0 ? 'matéria oficial' : 'fonte ' + (i + 1)} ↗</a>`).join(' · ')}</div>
  </div>`
}

function quiz() {
  const vs = D[S.casa].votacoes
  if (S.i >= vs.length) return results()
  const v = vs[S.i]
  const n = Object.keys(S.ans).length
  const showBanner = n >= 5 && !S.shownBanner
  app.innerHTML = `
  <div class="fade">
    <div class="qtop"><span>Pergunta ${S.i + 1} de ${vs.length}</span><span>${n} respondida${n === 1 ? '' : 's'}</span></div>
    <div class="bar"><i style="width:${(S.i / vs.length) * 100}%"></i></div>
    ${showBanner ? `<div class="banner"><span><b>Você já pode ver seu resultado.</b> Mais respostas = match mais preciso.</span><button class="btn btn-o" id="verAgora" style="padding:9px 16px;font-size:13.5px">Ver resultados agora</button></div>` : ''}
    <div class="qcard">
      <span class="tag">📋 ${esc(v.proposicao)} · votada em ${v.data.split('-').reverse().join('/')}</span>
      <div class="q">${esc(v.pergunta)}</div>
      <details class="ctx"><summary>Entenda o que estava em jogo</summary>${ctxHTML(v)}</details>
      <div class="ans">
        <button class="btn btn-g" id="bN">👎 Não, sou contra</button>
        <button class="btn btn-p" id="bS">👍 Sim, sou a favor</button>
      </div>
      <button class="btn btn-t skip" id="bP">Me abster neste tema →</button>
    </div>
  </div>`
  if (showBanner) document.getElementById('verAgora').onclick = () => { S.shownBanner = true; results() }
  document.getElementById('bN').onclick = () => answer('N')
  document.getElementById('bS').onclick = () => answer('S')
  document.getElementById('bP').onclick = () => answer(null)
}
function answer(a) {
  const v = D[S.casa].votacoes[S.i]
  if (a) S.ans[v.id] = a; else delete S.ans[v.id]
  S.i++
  if (S.i >= D[S.casa].votacoes.length) results(); else quiz()
  scrollTo({ top: 0, behavior: 'smooth' })
}

function compute() {
  const c = D[S.casa]
  return c.parlamentares.map(p => {
    let m = 0, cmp = 0; const det = []
    for (const v of c.votacoes) {
      const raw = c.votos[v.id] ? c.votos[v.id][String(p.id)] : undefined
      const ans = S.ans[v.id]
      if (!ans) continue
      const pv = raw === undefined ? null : voteN(raw)
      if (pv) { cmp++; if (pv === ans) m++ }
      det.push({ v, ans, raw: raw === undefined ? 'não registrado' : raw, match: pv ? (pv === ans) : null })
    }
    return { p, m, cmp, det, score: cmp > 0 ? m / cmp : 0, adj: (m + 2) / (cmp + 4) }
  })
}

function presHTML(pid) {
  if (S.casa === 'camara') {
    const pr = D.presenca.camara[pid]
    if (!pr) return ''
    const cls = pr.pct >= 85 ? 'good' : pr.pct >= 70 ? 'mid' : 'bad'
    return `<div class="tcell"><b class="lbl">Presença em plenário (oficial, desde 2023)</b><div class="big ${cls}">${String(pr.pct).replace('.', ',')}%</div><div class="sm">${pr.pres} presenças · ${pr.ausJust} ausências justificadas · ${pr.ausNaoJust} não justificadas · <a href="${esc(pr.fonte)}" target="_blank" rel="noopener">fonte ↗</a></div></div>`
  }
  const pr = D.presenca.senado[pid]
  if (!pr) return ''
  const cls = pr.pct >= 85 ? 'good' : pr.pct >= 70 ? 'mid' : 'bad'
  return `<div class="tcell"><b class="lbl">Presença nas ${pr.tot} votações analisadas</b><div class="big ${cls}">${String(pr.pct).replace('.', ',')}%</div><div class="sm">presente em ${pr.pres} de ${pr.tot} votações nominais</div></div>`
}
function ceapHTML(p) {
  const senado = S.casa === 'senado'
  const cc = senado ? ceapsLookup(p.nome) : ceapCalc[String(p.id)]
  const med = senado ? ceapsMed : ceapMed
  const lbl = senado ? LBLS : (k => CAT[k] || k)
  if (!cc) return `<div class="tcell wide"><b class="lbl">Uso da cota (jun/2025–mai/2026)</b><div class="big">—</div><div class="sm">${senado ? 'sem despesas CEAPS registradas no período (licença, posse recente) — confira no perfil oficial' : 'dados em coleta — recarregue em instantes'}</div></div>`
  const cls = cc.nota >= 7 ? 'good' : cc.nota >= 4 ? 'mid' : 'bad'
  return `<div class="tcell wide"><b class="lbl">Uso da cota — nota comparativa (jun/2025–mai/2026)</b>
    <div class="big ${cls}">${String(cc.nota).replace('.', ',')}/10</div>
    <div class="sm" style="margin:4px 0 8px"><b>Por que ${String(cc.nota).replace('.', ',')}?</b> Gastou <b>${brl(cc.total)}</b> — mais que ${cc.rT}% dos colegas (mediana da Casa: ${brl(med._t)}) · <b>${cc.sens}%</b> foi em categorias sensíveis — fatia maior que a de ${cc.rS}% dos colegas${cc.fl ? ' · combustível acima do percentil 90 (−2 pontos)' : ''}. Fórmula: 10 − ${senado ? '5' : '4'}×percentil(gasto total) − ${senado ? '5' : '4'}×percentil(% sensíveis)${senado ? '' : ' − 2×(combustível>p90)'}.</div>
    ${cc.top.map(t => `<div class="medrow"><span>${esc(lbl(t[0]))}</span><span><b>${brl(t[1])}</b> <span style="color:var(--mut)">· mediana da Casa ${brl(med[t[0]] || 0)}</span></span></div>`).join('')}
    <div class="sm" style="margin-top:8px">Categorias sensíveis: ${senado ? 'divulgação e locomoção/hospedagem/combustíveis' : 'combustíveis, divulgação, locações/fretamentos, hospedagem e táxi'}. Fonte: ${senado ? 'CSV oficial CEAPS do Senado' : 'API oficial de despesas da Câmara'}. Usar a cota é legal — a nota apenas compara padrões entre colegas da mesma Casa.</div>
  </div>`
}
const GLOSS = { 'réu': 'réu = a Justiça aceitou a denúncia e há ação penal em curso; não é condenação.', 'condenado': 'condenado = há decisão judicial condenatória; veja a instância e os recursos na descrição.', 'inquérito': 'inquérito = investigação formal em andamento; não é acusação nem condenação.', 'denúncia pendente': 'a PGR apresentou acusação; a Justiça ainda não decidiu se aceita.' }
function seloHTML(pid) {
  const reg = (D.registros[S.casa] || {})[pid]
  if (reg && reg.status === 'histórico') return `<div class="tcell"><b class="lbl">Registros públicos (verificado em ${esc(reg.verificadoEm.split('-').reverse().join('/'))})</b><span class="selo info">ℹ️ histórico — casos encerrados</span><div class="sm" style="margin-top:6px">${esc(reg.desc)}</div><div class="sm" style="margin-top:4px">Casos encerrados (arquivamento, prescrição ou absolvição) também são fatos públicos — o desfecho está descrito acima. <a href="${esc(reg.fonte)}" target="_blank" rel="noopener">fonte ↗</a></div></div>`
  if (reg) return `<div class="tcell"><b class="lbl">Registros públicos (verificado em ${esc(reg.verificadoEm.split('-').reverse().join('/'))})</b><span class="selo alerta">⚠️ ${esc(reg.status)}</span><div class="sm" style="margin-top:6px">${esc(reg.desc)}</div><div class="sm" style="margin-top:4px;color:var(--mut)">${GLOSS[reg.status] || ''} <a href="${esc(reg.fonte)}" target="_blank" rel="noopener">fonte ↗</a></div></div>`
  return `<div class="tcell"><b class="lbl">Registros públicos (verificado em 09/06/2026)</b><span class="selo ok">✅ sem processos ativos encontrados</span><div class="sm" style="margin-top:6px">nas fontes verificadas (réu, condenação, denúncia ou inquérito no STF/STJ); não é atestado de idoneidade — processos sob sigilo não aparecem. Confira sempre as fontes oficiais.</div></div>`
}

function results() {
  const c = D[S.casa], cfg = cfgs[S.casa]
  const nAns = Object.keys(S.ans).length
  if (nAns === 0) { app.innerHTML = `<div class="empty fade">Você não respondeu nenhuma pergunta.<br><br><button class="btn btn-p" id="re">Recomeçar</button></div>`; document.getElementById('re').onclick = home; return }
  const all = compute()
  const MIN = Math.min(3, nAns)
  const pt = {}
  for (const r of all) { if (r.cmp === 0) continue; const k = r.p.partido; pt[k] = pt[k] || { m: 0, c: 0, n: 0 }; pt[k].m += r.m; pt[k].c += r.cmp; pt[k].n++ }
  const ptArr = Object.entries(pt).filter(([k, v]) => v.c >= MIN * 3).map(([k, v]) => ({ sigla: k, pct: v.m / v.c, n: v.n })).sort((a, b) => b.pct - a.pct)
  const partidos = [...new Set(c.parlamentares.map(p => p.partido))].sort()
  let list = all.filter(r => r.cmp >= MIN)
  if (S.filtUF && S.uf) list = list.filter(r => r.p.uf === S.uf)
  if (S.filtP) list = list.filter(r => r.p.partido === S.filtP)
  if (S.filtQ) { const q = S.filtQ.toLowerCase(); list = list.filter(r => r.p.nome.toLowerCase().includes(q)) }
  list.sort((a, b) => b.adj - a.adj || b.cmp - a.cmp || a.p.nome.localeCompare(b.p.nome))
  const insuf = all.filter(r => r.cmp < MIN).length
  app.innerHTML = `
  <div class="fade">
    <div class="rhead">
      <h2>Seu resultado · ${cfg.nome}</h2>
      <p>Comparamos suas ${nAns} resposta${nAns > 1 ? 's' : ''} com os votos registrados em plenário. Afinidade = % de votações em que o parlamentar votou igual a você (entre as comparáveis).</p>
    </div>
    ${S.i < c.votacoes.length ? `<div class="banner"><span><b>Quer um match mais preciso?</b> Ainda há perguntas sem resposta.</span><button class="btn btn-o" id="cont" style="padding:9px 16px;font-size:13.5px">Continuar respondendo</button></div>` : ''}
    <div class="sec">Partidos mais alinhados a você</div>
    <div class="pty">${ptArr.slice(0, 8).map(x => `
      <div class="pr"><span class="nm">${esc(x.sigla)}</span><span class="tr"><i style="width:${Math.round(x.pct * 100)}%"></i></span><span class="pc">${Math.round(x.pct * 100)}%</span><span class="ct">${x.n} parlam.</span></div>`).join('')}
    </div>
    <div class="sec">Parlamentares</div>
    <div class="filters">
      ${S.uf ? `<button class="chip ${S.filtUF ? 'on' : ''}" id="fUF">📍 Só ${S.uf}</button>` : ''}
      <select id="fP"><option value="">Todos os partidos</option>${partidos.map(p => `<option ${S.filtP === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
      <input id="fQ" placeholder="Buscar por nome…" value="${esc(S.filtQ)}">
    </div>
    <div class="plist" id="plist">${list.slice(0, S.shown).map((r, i) => card(r, i, cfg, c)).join('') || `<div class="empty">Nenhum parlamentar encontrado com esses filtros.</div>`}</div>
    ${list.length > S.shown ? `<button class="btn btn-o more" id="mais">Mostrar mais (${list.length - S.shown} restantes)</button>` : ''}
    ${insuf ? `<p style="color:var(--mut);font-size:13px;margin-top:14px">${insuf} parlamentar(es) fora do ranking por terem menos de ${MIN} votos comparáveis com suas respostas (ausências, licenças ou mandato recente).</p>` : ''}
    <div class="meth">
      <h3>Como funciona (metodologia e fontes)</h3>
      <p>· Cada pergunta corresponde a uma votação nominal real em plenário. Sua resposta é comparada ao voto registrado de cada parlamentar — direto das APIs oficiais da <a href="https://dadosabertos.camara.leg.br" target="_blank" rel="noopener">Câmara</a> e do <a href="https://legis.senado.leg.br/dadosabertos/" target="_blank" rel="noopener">Senado</a>. Abstenções, obstruções e ausências não contam nem a favor nem contra. Para evitar que pouca base infle o ranking (ex.: 3 de 3 acima de 7 de 8), a ORDEM usa ajuste bayesiano — (iguais+2)/(comparáveis+4), prior neutro de 50% — enquanto o % exibido é o real; menos de 5 votos comparáveis ganham o aviso "base pequena".</p>
      <p>· <b>Nota de uso da cota (0–10)</b>: dados oficiais de jun/2025 a mai/2026 (Câmara: CEAP via API oficial; Senado: CEAPS via CSV oficial de transparência). Fórmula nas duas Casas: nota = 10 − 5×percentil(gasto total entre colegas da Casa) − 5×percentil(gasto ABSOLUTO em categorias sensíveis — Câmara: combustíveis, divulgação, locações/fretamentos, hospedagem, táxi; Senado: divulgação + locomoção/hospedagem/combustíveis). Usamos valores absolutos comparados aos colegas, não frações: quem gasta pouco no total não é punido pela composição do pouco que gasta. O cartão mostra o comparativo com a mediana da Casa, categoria por categoria. Régua comparativa objetiva, não acusação: gastar a cota é legal.</p>
      <p>· <b>Presença</b>: Câmara = relatório oficial de presença em sessões deliberativas do plenário (Ato da Mesa 191/2017) somado de 2023 a 2026; o % considera ausências justificadas e não justificadas — licenças médicas e missões oficiais contam como justificadas. Senado = presença nas ${D.senado.votacoes.length} votações nominais analisadas (não há relatório oficial consolidado por API).</p>
      <p>· <b>Registros públicos</b>: ⚠️ = processo ATIVO (réu, condenação, denúncia pendente ou inquérito formal no STF/STJ), confirmado em fonte oficial ou grande imprensa citando o caso. ℹ️ = histórico relevante já ENCERRADO (arquivado, prescrito ou absolvição), com desfecho explícito — arquivamento também é fato público. ✅ = nada ativo encontrado nas fontes verificadas em 09/06/2026; não é atestado de idoneidade. No Senado a varredura cobre ativos e históricos; na Câmara, históricos ainda parcialmente. Este site não acusa ninguém: confira sempre a fonte primária.</p>
      <p>· Votações usadas: ${c.votacoes.map(v => `<a href="${esc(v.linkFonte)}" target="_blank" rel="noopener">${esc(v.proposicao)}</a>`).join(' · ')}.</p>
    </div>
    <div class="row" style="justify-content:center"><button class="btn btn-o" id="re2">↺ Recomeçar do zero</button></div>
  </div>`
  const cont = document.getElementById('cont'); if (cont) cont.onclick = quiz
  const fUF = document.getElementById('fUF'); if (fUF) fUF.onclick = () => { S.filtUF = !S.filtUF; S.shown = 30; results() }
  document.getElementById('fP').onchange = e => { S.filtP = e.target.value; S.shown = 30; results() }
  document.getElementById('fQ').oninput = e => { S.filtQ = e.target.value; S.shown = 30; results() }
  const mais = document.getElementById('mais'); if (mais) mais.onclick = () => { S.shown += 30; results() }
  document.getElementById('re2').onclick = home
  document.getElementById('plist').onclick = e => { const h = e.target.closest('.phead'); if (h) h.parentElement.classList.toggle('open') }
}

function card(r, i, cfg, c) {
  const pct = Math.round(r.score * 100)
  const ini = r.p.nome.split(' ').map(x => x[0]).slice(0, 2).join('')
  const regAll = (D.registros[S.casa] || {})[r.p.id]; const reg = regAll && regAll.status !== 'histórico' ? regAll : null
  const newsQ = encodeURIComponent('"' + r.p.nome + '" ' + cfg.singular)
  return `
  <div class="pcard">
    <div class="phead">
      <span class="rank">${i + 1}º</span>
      <img class="ava" loading="lazy" src="${cfg.foto(r.p.id)}" alt="" onerror="this.outerHTML='<span class=ava>${ini}</span>'">
      <div class="pinfo"><div class="n">${esc(r.p.nome)}${reg ? '<span class="flag" title="há registro público ativo — abra o cartão">⚠️</span>' : ''}</div><div class="m">${esc(r.p.partido)} · ${esc(r.p.uf)}</div></div>
      <div class="aff"><div class="v">${pct}%</div><div class="c">${r.m} de ${r.cmp} iguais${r.cmp < 5 ? ' · base pequena' : ''}</div><div class="affbar"><i style="width:${pct}%"></i></div></div>
      <span class="chev">▾</span>
    </div>
    <div class="pbody">
      <div class="secmini">🔎 Transparência</div>
      <div class="tgrid" style="margin-top:0">
        ${ceapHTML(r.p)}
        ${presHTML(String(r.p.id))}
        ${seloHTML(String(r.p.id))}
        <div class="tcell wide"><b class="lbl">Confira na fonte</b>
          <div class="links" style="display:flex;gap:18px;flex-wrap:wrap;margin-top:4px">
            <a href="${cfg.perfil(r.p.id)}" target="_blank" rel="noopener">🏛️ ${cfg.perfilLabel} ↗</a>
            <a href="https://portal.stf.jus.br/processos/" target="_blank" rel="noopener">⚖️ Processos no STF ↗</a>
            <a href="https://news.google.com/search?q=${newsQ}" target="_blank" rel="noopener">📰 Notícias ↗</a>
          </div>
        </div>
      </div>
      <div class="secmini" style="margin-top:18px">🗳️ Voto a voto nas pautas que você respondeu</div>
      <div class="cmp">${r.det.map(d => {
        const ic = d.match === true ? '<span class="ic ok">✓</span>' : d.match === false ? '<span class="ic no">✕</span>' : '<span class="ic nn">—</span>'
        return `<div class="ci">${ic}<div><div class="tt">${esc(d.v.titulo)}</div><div class="dd">Você: ${d.ans === 'S' ? 'a favor' : 'contra'} · ${esc(r.p.nome.split(' ')[0])}: ${esc(d.raw)} · <a href="${esc(d.v.linkFonte)}" target="_blank" rel="noopener">fonte ↗</a></div></div></div>`
      }).join('')}</div>
    </div>
  </div>`
}

document.getElementById('logo').onclick = () => home()
carregar().then(home).catch(e => { app.innerHTML = `<div class="empty">Erro ao carregar dados (${esc(e.message)}). Recarregue a página.</div>` })
