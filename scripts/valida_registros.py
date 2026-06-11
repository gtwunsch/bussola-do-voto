# -*- coding: utf-8 -*-
"""Pipeline v2 — Fase 1: validações determinísticas (V1-V9) sobre a base atual (schema v3).
Saídas: relatório + fila_auditoria.json (prioridade para verificação adversarial Fable)."""
import json, io, re, sys
from urllib.parse import urlparse
from collections import Counter

BASE = 'data/registros_judiciais.json'
reg = json.load(io.open(BASE, encoding='utf-8'))
deps = {str(p['id']): p for p in json.load(io.open('data/camara_deputados.json', encoding='utf-8'))}
sens = {str(p['id']): p for p in json.load(io.open('data/senado_senadores.json', encoding='utf-8'))}
nomes = {'camara': deps, 'senado': sens}

ALLOW = ('.jus.br', '.mp.br', '.gov.br', '.leg.br', 'agenciabrasil.ebc.com.br')
GRANDE_IMPRENSA = ('g1.globo.com','oglobo.globo.com','folha.uol.com.br','www1.folha.uol.com.br','estadao.com.br','poder360.com.br','cnnbrasil.com.br','metropoles.com','uol.com.br','noticias.uol.com.br','conjur.com.br','congressoemfoco.com.br','gazetadopovo.com.br','correiobraziliense.com.br','cartacapital.com.br','agenciapublica.org','apublica.org','em.com.br','otempo.com.br','istoe.com.br','veja.abril.com.br','opovo.com.br','jota.info')
LEXICO_PROIBIDO = re.compile(r'inelegível|ficha\s+suja|primeir[ao] d[ao] história|na história d|inédit[ao]|escândalo|corrupt[oa]\b|bandid|vergonh', re.I)
TRANSITO = re.compile(r'transitad[ao] em julgado|trânsito em julgado', re.I)
ENCERRADO_OK = re.compile(r'arquivad|absolvid|rejeitad|prescri|extint|improcedente|anulad|trancad|revertid|cassação.*anulada|mantido o mandato|sem indiciamento|encerrad[ao] por', re.I)
DESC_INDEFINIDO = re.compile(r'não localizado|não confirmado|incerto|não foi possível|desfecho final não', re.I)

fila = []           # cards p/ Fable, com falhas anotadas
corrigiveis = []    # V9: corrigível por código com revisão
stats = Counter()

for casa in ('camara', 'senado'):
    for pid, entry in reg[casa].items():
        itens = entry.get('itens')
        if not isinstance(itens, list): continue
        falhas = []
        for ix, i in enumerate(itens):
            txt = ' '.join(str(i.get(k, '')) for k in ('tipo','desc','desfecho','defesa'))
            # V9 léxico
            m = LEXICO_PROIBIDO.search(txt)
            if m: falhas.append(f'V9:lexico[{m.group(0)}]@item{ix}'); stats['V9_lexico'] += 1; corrigiveis.append((casa,pid,ix,m.group(0)))
            # V3 domínio da fonte
            host = urlparse(str(i.get('fonte',''))).netloc.lower()
            prim = any(host.endswith(a) for a in ALLOW)
            imprensa = any(host.endswith(g) or g in host for g in GRANDE_IMPRENSA)
            if not prim and not imprensa: falhas.append(f'V3:fonte_fraca[{host}]@item{ix}'); stats['V3_fonte_fraca'] += 1
            elif not prim: stats['fonte_imprensa'] += 1
            else: stats['fonte_primaria'] += 1
            # V1 badge: condenado sem trânsito marcado como encerrado
            if i.get('st') == 'encerrado':
                if 'condena' in txt.lower() and not TRANSITO.search(txt) and not ENCERRADO_OK.search(txt):
                    falhas.append(f'V1:condenacao_sem_transito_como_encerrado@item{ix}'); stats['V1_badge'] += 1
                elif not ENCERRADO_OK.search(txt) and DESC_INDEFINIDO.search(txt):
                    falhas.append(f'V1:desfecho_nao_localizado_como_encerrado@item{ix}'); stats['V1_indefinido'] += 1
            # V2 gate de confiança: desfecho não localizado publicado
            if DESC_INDEFINIDO.search(txt) and i.get('st') == 'ativo':
                stats['V2_ativo_incerto'] += 1  # menor: ativo incerto é aceitável com ressalva
        if falhas:
            p = nomes[casa].get(pid, {})
            fila.append({'casa': casa, 'id': pid, 'nome': p.get('nome'), 'partido': p.get('partido'), 'uf': p.get('uf'),
                         'falhas': falhas, 'itens': itens})
        # prioridade extra: condenações e réus sempre auditar (gate de curadoria 1)
        elif any(i.get('st') == 'ativo' and ('réu' in str(i.get('tipo','')).lower() or 'conden' in (str(i.get('tipo',''))+str(i.get('desc',''))).lower()) for i in itens):
            p = nomes[casa].get(pid, {})
            fila.append({'casa': casa, 'id': pid, 'nome': p.get('nome'), 'partido': p.get('partido'), 'uf': p.get('uf'),
                         'falhas': ['GATE:condenacao_ou_reu_ativo'], 'itens': itens})

json.dump(fila, io.open('data/fila_auditoria.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
total_cards = sum(1 for c in ('camara','senado') for e in reg[c].values() if isinstance(e.get('itens'), list) and e['itens'])
print('=== RELATÓRIO V1-V9 (base atual) ===')
for k, v in sorted(stats.items()): print(f'  {k}: {v}')
print(f'cards com itens: {total_cards} | cards na fila de auditoria Fable: {len(fila)}')
print('\nexemplos da fila:')
for f in fila[:8]: print(' -', f['nome'], f['falhas'][:2])
