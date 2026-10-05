# Writes the workspace's data files: meta.json (dictionaries, sources, counts) + rows-N.json chunks.
import pandas as pd, json, os, collections
M = pd.read_pickle('/home/claude/master/M.pkl'); SRC = pd.read_pickle('/home/claude/master/SRC.pkl')
OUT = '/home/claude/master/site/data'; os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
LT = ['', 'cellphone', 'landline', 'voip', 'unknown', 'other', 'invalid']
KIND = ['Licensee', 'Business', 'Instagram', 'Contact']
SCODES = ['AR', 'KS', 'KB', 'US', 'EM', 'ME', 'RI', 'TX', 'VA', 'IC', 'IG', 'IB', 'II']
FLAGS = ['missing_phone', 'missing_email', 'invalid_phone', 'no_contact', 'shared_phone', 'shared_email', 'missing_name', 'merged']
dicts = {'lic': [''], 'car': ['']}; di = {k: {'': 0} for k in dicts}
def code(k, v):
    v = v or ''
    if v not in di[k]: di[k][v] = len(dicts[k]); dicts[k].append(v)
    return di[k][v]
def n(x):
    try: return int(float(x))
    except: return ''
rows = []
for m in M:
    others = ';'.join(f"{p[0]}:{LT.index(p[1])}" for p in m['phones'] if p[0] != m['best'])
    bits = 0
    for s in m['srcs']: bits |= 1 << SCODES.index(s)
    fb = 0
    for f in m['flags']: fb |= 1 << FLAGS.index(f)
    rows.append([int(m['id'][1:]), m['name'], m['bname'] if m['bname'] != m['name'] else '', KIND.index(m['kind']), m['state'], code('lic', m['lic_type']), m['olic'], m['lic_no'],
                 m['city'], m['zip'], m['best'], LT.index(m['blt']), code('car', m['bcar']), ['', 'lookup', 'prefix'].index(m['bsrc']), others, ' '.join(m['emails']),
                 bits, m['ig'], n(m['igf']), {'business': 'b', 'individual': 'i'}.get(m['igt'], ''), m['web'], m['tier'], m['gsz'], m['grp'], m['bsh'], m['esh'], fb, int(m['student']),
                 m['addr'], m['county'], m['exp'], ' '.join(f'{a}:{b}' for a, b in m['refs']), (m['bio'] or '')[:160], m['active'], m['addr_state'] if m['addr_state'] != m['state'] else ''])
CH = 30000
files = []
for i in range(0, len(rows), CH):
    fn = f'rows-{i // CH + 1}.json'
    txt = json.dumps(rows[i:i + CH], separators=(',', ':'), ensure_ascii=False).replace('\ufffd', '')
    with open(os.path.join(OUT, fn), 'w') as f: f.write(txt)
    files.append(fn)
meta = {'lt': LT, 'kind': KIND, 'src': [[c, SRC[c][0], SRC[c][1]] for c in SCODES], 'flags': FLAGS, 'lic': dicts['lic'], 'car': dicts['car'], 'files': files, 'total': len(rows),
        'built': '2026-10-04', 'source_records': 610923}
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), separators=(',', ':'))
tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(len(rows), 'rows', len(files), 'files', round(tot / 1e6, 1), 'MB', 'largest', max(os.path.getsize(os.path.join(OUT, f)) for f in files) / 1e6, 'MB', 'lic types', len(dicts['lic']), 'carriers', len(dicts['car']))
