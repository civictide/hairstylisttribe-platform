# Merge all beauty prospect lists into one person-level master list.
# Same person across lists -> one record (all sources kept). Shared phones/emails between different people -> flagged, never removed.
import pandas as pd, re, json, collections, time
t0 = time.time()
L = lambda k: pd.read_pickle(f'/home/claude/master/{k}.pkl')

SRC = {  # code: (label, file)
    'AR': ('Arkansas Cosmetology workspace', 'Arkansas-Cosmetology-Licensees.xlsx'),
    'KS': ('Kansas Cosmetology workspace', 'Kansas-Cosmetology-Licensees.xlsx'),
    'KB': ('Kansas Board list (May 2)', 'Kansas_Board_May2nd_32k_list.xlsx'),
    'US': ('US beauty licensees + emails (MI, VA, KS, AR)', 'US_beauty_licensees_emails.xlsx'),
    'EM': ('220k emails (clean)', '220k_emails_clean_final.csv'),
    'ME': ('Maine cosmetologists', 'ME_cosmetologists_line_type.xlsx'),
    'RI': ('Rhode Island cosmetologists', 'RI_cosmetologists_line_type.xlsx'),
    'TX': ('Texas mini establishments', 'texas_mini_establishments.csv'),
    'VA': ('Virginia salons & shops', 'VA_salons_with_email.xlsx'),
    'IC': ('Instagram hairstylist master (clean)', 'hairstylist_master_clean.csv'),
    'IG': ('Instagram hairstylist master', 'hairstylist_master_no_flagged.csv'),
    'IB': ('Instagram business accounts (7k)', '7k_Business_Accounts_with_Phone_IG.csv'),
    'II': ('Instagram individual accounts (14k)', '14k_Individual_with_Phone_IG_Accounts.csv'),
}

def dg(p):
    d = re.sub(r'\D', '', str(p or ''))
    if len(d) == 11 and d[0] == '1': d = d[1:]
    return d
def em(e):
    e = str(e or '').strip().lower()
    e = re.sub(r'(\.com|\.net|\.org)http.*$', r'\1', e)  # e.g. info@x.comhttp
    return e if re.fullmatch(r'[^@\s]+@[^@\s]+\.[a-z]{2,}', e) else ''
LTMAP = {'cell': 'cellphone', 'cellphone': 'cellphone', 'cell phone': 'cellphone', 'landline': 'landline', 'voip': 'voip', 'unknown prefix': 'unknown', 'unknown': 'unknown',
         'invalid': 'invalid', 'other': 'other', 'paging': 'other', 'missing': ''}
lt = lambda x: LTMAP.get(str(x or '').strip().lower(), '')
def title(s):
    s = str(s or '').strip()
    return s.title() if s.isupper() or s.islower() else s

R = []  # source records
def add(**k):
    k.setdefault('phones', []); k.setdefault('emails', []); R.append(k)

# --- Arkansas workspace (processed)
for d in L('ar').to_dict('records'):
    add(src='AR', srow=d['row_number'], kind='person', first=d['NAME_FIRST'], last=d['NAME_LAST'], name=(d['NAME_FIRST'] + ' ' + d['NAME_LAST']).strip(),
        lic_state='AR', lic_no='', lic_type=d['LicenseTypeCode'], olic=d['other_license_types'], city=d['ADDR_CITY'], st=d['ADDR_STATE'], zip=d['ADDR_ZIP1'],
        phones=[(dg(d['Phone_Digits'] or d['Primary Phone']), lt(d['Line_Type']), d['Carrier_Holding_Prefix'])], emails=[em(d['Email'])])
# --- Kansas workspace (processed)
for d in L('ks').to_dict('records'):
    add(src='KS', srow=d['column_1'], kind='person', name=d['licensee_name'], lic_state='KS', lic_no=d['license_number'], olic_no=d['other_license_numbers'],
        phones=[(dg(d['primary_phone']), lt(d['primary_line_type']), d['primary_carrier']), (dg(d['other_phone']), lt(d['other_line_type']), d['other_carrier'])],
        emails=[em(d['primary_email'])], rem=d['remarks'])
# --- Kansas board raw
for i, r in enumerate(L('ks32').values.tolist()):
    add(src='KB', srow=str(i + 2), kind='person', name=r[0], lic_state='KS', lic_no=r[1], lic_type=r[2], active=r[3])
# --- US licensees
for i, d in enumerate(L('us').to_dict('records')):
    add(src='US', srow=str(i + 2), kind='person', name=d['full_name'], lic_state=d['state'], lic_no=d['license_number'], lic_type=d['license_type'], city=d['city'], st=d['state'], zip=d['zip'],
        phones=[(dg(d['phone_normalized']), '', '')], emails=[em(d['email_normalized'])])
# --- 220k emails
for i, d in enumerate(L('emails220').to_dict('records')):
    ph = [(dg(d['phone']), lt(d['phone_type']), '')] + [(dg(x), '', '') for x in d['other_phones'].split(';') if x.strip()]
    add(src='EM', srow=str(i + 2), kind='person', name=d['name'], city=d['city'], st=d['state'], phones=ph,
        emails=[em(d['email'])] + [em(x) for x in d['other_emails'].split(';')], sub=d['source'])
# --- Maine, Rhode Island
for code, key in (('ME', 'me2'), ('RI', 'ri2')):
    for i, d in enumerate(L(key).to_dict('records')):
        add(src=code, srow=str(i + 2), kind='person', name=d['full_name'].replace('`', ''), lic_state=code, lic_no=d['license_number'], lic_type=title(d['license_type']),
            city=title(d['city']), st=code, zip=d['zip'], phones=[(dg(d['phone_normalized']), lt(d['line_type']), d['carrier'])])
# --- Texas mini establishments
for i, d in enumerate(L('tx').to_dict('records')):
    m = re.match(r'^(.*)\s+([A-Z]{2})\s+([\d-]+)$', d['business_city_state_zip'].strip())
    city, st = (m.group(1), m.group(2)) if m else (d['business_city_state_zip'], 'TX')
    add(src='TX', srow=str(i + 2), kind='business', name=title(d['owner_name']), bname=title(d['business_name']), lic_state='TXB', lic_no=d['license_number'],
        lic_type=d['license_type'], city=title(city), st=st, zip=d['zip'], addr=title(d['business_address']), county=title(d['county']), exp=d['expiration'].strip(),
        phones=[(dg(d['business_phone']), '', ''), (dg(d['owner_phone']), '', '')])
# --- Virginia salons
for i, d in enumerate(L('va').to_dict('records')):
    add(src='VA', srow=str(i + 2), kind='business', name='', bname=title(d['business_name']), lic_state='VAB', lic_no=d['license_number'], lic_type=d['license_type'],
        city=title(d['city']), st=d['state'], zip=d['zip'], addr=title(d['street']), phones=[(dg(d['phone_normalized']), '', '')], emails=[em(d['email'])])
# --- Instagram (master + 7k business + 14k individual, keyed by handle)
ig = {}
for code, key in (('IC', 'ig_clean'), ('IG', 'ig_master'), ('IB', 'ig_biz'), ('II', 'ig_ind')):
    for d in L(key).to_dict('records'):
        h = d['ig_handle'].strip().lower()
        if not h: continue
        if h in ig: ig[h]['srcs'].add(code); continue
        ig[h] = dict(d, srcs={code})
for h, d in ig.items():
    add(src='IG', srcs=d['srcs'], srow=h, kind='instagram', name=d['display_name'], ig=h, igf=d['followers'], igt=d['account_type'], web=d['website'],
        loc=d['location'], st=d['state'], mx=d.get('email_mx_valid', ''), webst=d.get('website_status', ''), phones=[(dg(d['phone']), lt(d['phone_type']), d['carrier'])],
        emails=[em(x) for x in (d['emails_all'] or d['email']).replace(',', ';').split(';')], igtier=d['viability_tier'], iglive=d['ig_live_status'], bio=d['bio'])
print('source records', len(R), round(time.time() - t0, 1), 's')

# clean phone/email lists
for r in R:
    r['phones'] = [p for p in r['phones'] if p[0]]
    r['emails'] = list(dict.fromkeys(e for e in r['emails'] if e))

# ---------------- union-find ----------------
par = list(range(len(R)))
def find(x):
    while par[x] != x:
        par[x] = par[par[x]]; x = par[x]
    return x
def union(a, b):
    a, b = find(a), find(b)
    if a != b: par[max(a, b)] = min(a, b)

STOP = {'jr', 'sr', 'ii', 'iii', 'iv', 'mrs', 'ms', 'mr', 'dr'}
def toks(n):
    return [t for t in re.findall(r'[a-z]+', str(n or '').lower()) if len(t) > 1 and t not in STOP]
for r in R: r['tk'] = toks(r['name'])
def compat(a, b):
    # same person only when first AND last name agree, or one full name is contained in the other (middle names, initials)
    A, B = a['tk'], b['tk']
    if len(A) < 2 or len(B) < 2: return False
    if A[0] == B[0] and A[-1] == B[-1]: return True
    S, T = (set(A), set(B)) if len(A) <= len(B) else (set(B), set(A))
    return S <= T

# 1) license number within a state
lic = collections.defaultdict(list)
for i, r in enumerate(R):
    # license numbers repeat across license types in some states (VA restarts numbering per type), so the type is part of the key except in Kansas
    if r.get('lic_no') and r.get('lic_state'):
        lt_key = '' if r['lic_state'] == 'KS' else re.sub(r'[^a-z]', '', str(r.get('lic_type') or '').lower())
        lic[(r['lic_state'], lt_key, r['lic_no'].strip().upper())].append(i)
    for x in str(r.get('olic_no') or '').split('|'):
        if x.strip() and r.get('lic_state') == 'KS': lic[('KS', '', x.strip().upper())].append(i)
for v in lic.values():
    for j in v[1:]: union(v[0], j)
# 2) same email or phone with a compatible name (people only)
idx = collections.defaultdict(list)
for i, r in enumerate(R):
    if r['kind'] == 'instagram': continue
    for e in r['emails']: idx['e:' + e].append(i)
    for p in r['phones']:
        if len(p[0]) == 10: idx['p:' + p[0]].append(i)
for k, v in idx.items():
    if len(v) < 2: continue
    v = v[:200]
    for x in range(len(v)):
        for y in range(x + 1, len(v)):
            a, b = R[v[x]], R[v[y]]
            if a['kind'] == 'business' or b['kind'] == 'business': continue  # businesses merge by license number only
            if compat(a, b): union(v[x], v[y])
# 3) Instagram account -> the one person/business that owns its email or phone
# only when the match is one-to-one: several stylists' accounts sharing one salon phone stay separate (flagged as shared)
iglinks = 0; cand = {}
for i, r in enumerate(R):
    if r['kind'] != 'instagram': continue
    ents = set()
    for e in r['emails']: ents |= {find(j) for j in idx.get('e:' + e, [])}
    for p in r['phones']: ents |= {find(j) for j in idx.get('p:' + p[0], [])}
    if len(ents) == 1: cand[i] = ents.pop()
per_ent = collections.Counter(cand.values())
for i, e in cand.items():
    if per_ent[e] == 1: union(i, e); iglinks += 1
print('instagram accounts linked to a licensee/business', iglinks)

groups = collections.defaultdict(list)
for i in range(len(R)): groups[find(i)].append(i)
print('people/businesses after merge', len(groups), round(time.time() - t0, 1), 's')

# ---------------- phone line types ----------------
# number-level hints first (carrier lookups that came with the lists), then the prefix's classification from the AR/KS NANPA lookups
num_lt = {}
pref = collections.defaultdict(collections.Counter); pref_car = collections.defaultdict(collections.Counter)
for r in R:
    for d, t, c in r['phones']:
        if t and t not in ('unknown', 'invalid', ''):
            num_lt.setdefault(d, (t, c or ''))
            if r['src'] in ('AR', 'KS', 'ME', 'RI') and len(d) == 10:
                pref[d[:6]][t] += 1
                if c: pref_car[d[:6]][c] += 1
prefix_lt = {}
for p, c in pref.items():
    (t, n), tot = c.most_common(1)[0], sum(c.values())
    if n / tot >= 0.8: prefix_lt[p] = (t, pref_car[p].most_common(1)[0][0] if pref_car[p] else '')
def classify(d):
    if len(d) != 10 or d[0] in '01' or d[3] in '01': return ('invalid', '', '')
    if d in num_lt: return (num_lt[d][0], num_lt[d][1], 'lookup')
    if d[:6] in prefix_lt: return (prefix_lt[d[:6]][0], prefix_lt[d[:6]][1], 'prefix')
    return ('unknown', '', '')

# ---------------- build master records ----------------
PRI = ['AR', 'KS', 'US', 'EM', 'ME', 'RI', 'KB', 'TX', 'VA', 'IG']
STUDENT = re.compile(r'permit|student|apprentice', re.I)
M = []
for root, members in groups.items():
    rs = sorted((R[i] for i in members), key=lambda r: PRI.index(r['src']))
    first = rs[0]
    def pick(k):
        for r in rs:
            v = str(r.get(k) or '').strip()
            if v: return v
        return ''
    people = [r for r in rs if r['kind'] == 'person']
    biz = [r for r in rs if r['kind'] == 'business']
    igr = [r for r in rs if r['kind'] == 'instagram']
    # name: prefer a properly cased person name
    lic_states = sorted({r['lic_state'][:2] for r in rs if r.get('lic_state')})
    ltypes = list(dict.fromkeys(x.strip() for r in rs for x in [r.get('lic_type') or ''] + str(r.get('olic') or '').split('|') if x.strip()))
    lnos = list(dict.fromkeys(r['lic_no'].strip() for r in rs if r.get('lic_no')))
    st = (lic_states[0] if lic_states else '') or pick('st')
    board = [r for r in people if r['src'] in ('AR', 'KS', 'KB', 'US', 'ME', 'RI') or re.search(r'licensee_emails|arkansas_board', str(r.get('sub') or ''))]
    kind = 'Licensee' if board else 'Business' if biz else 'Instagram' if igr else 'Contact'
    names = [r['name'] for r in board + people + biz if str(r['name']).strip()]
    nm = next((n for n in names if not n.isupper()), names[0] if names else (igr[0]['name'] if igr else ''))
    nm = title(nm)
    phones, seen = [], set()
    for r in rs:
        for d, t, c in r['phones']:
            if d in seen: continue
            seen.add(d); phones.append(d)
    emails = list(dict.fromkeys(e for r in rs for e in r['emails']))
    srcs = []
    for r in rs:
        for s in (sorted(r['srcs']) if r.get('srcs') else [r['src']]):
            if s not in srcs: srcs.append(s)
    ph = [(d,) + classify(d) for d in phones]
    M.append(dict(
        name=nm, bname=pick('bname'), kind=kind, state=st, lic_states=' '.join(lic_states), lic_type=ltypes[0] if ltypes else '', olic=' | '.join(ltypes[1:]),
        lic_no=' | '.join(lnos), active=pick('active'), exp=pick('exp'), city=title(pick('city')) or (igr[0]['loc'].split(',')[0] if igr and igr[0].get('loc') else ''),
        addr_state=pick('st'), zip=pick('zip')[:5], addr=pick('addr'), county=pick('county'),
        phones=ph, emails=emails, srcs=srcs, nsrc=len(members),
        ig=igr[0]['ig'] if igr else '', igf=igr[0]['igf'] if igr else '', igt=igr[0]['igt'] if igr else '', web=igr[0]['web'] if igr else '',
        igloc=igr[0]['loc'] if igr else '', webst=igr[0].get('webst', '') if igr else '', igtier=igr[0]['igtier'] if igr else '', iglive=igr[0]['iglive'] if igr else '', bio=(igr[0]['bio'] or '')[:400] if igr else '',
        sub=pick('sub'), rem=pick('rem'), student=bool(any(STUDENT.search(x) for x in ltypes[:1])),
        refs=[(r['src'], r['srow']) for r in rs], ar_row=next((r['srow'] for r in rs if r['src'] == 'AR'), ''), ks_row=next((r['srow'] for r in rs if r['src'] == 'KS'), '')))
print('built', len(M), round(time.time() - t0, 1), 's')

# best phone, contactability
for m in M:
    valid = [p for p in m['phones'] if p[1] != 'invalid']
    cells = [p for p in valid if p[1] == 'cellphone']
    best = cells[0] if cells else (valid[0] if valid else None)
    m['best'] = best[0] if best else ''; m['blt'] = best[1] if best else ''; m['bcar'] = best[2] if best else ''; m['bsrc'] = best[3] if best else ''
    m['hasCell'] = bool(cells); m['hasPhone'] = bool(valid); m['hasEmail'] = bool(m['emails'])
    land = any(p[1] in ('landline', 'voip', 'unknown', 'other') for p in valid)
    m['tier'] = 0 if (cells and m['emails']) else 1 if (cells or (land and m['emails'])) else 2 if (land or m['emails']) else 3

# shared contacts between different master records
usage = collections.defaultdict(list)
for i, m in enumerate(M):
    if m['best']: usage['p:' + m['best']].append(i)
    for e in m['emails'][:3]: usage['e:' + e].append(i)
gp = list(range(len(M)))
def gf(x):
    while gp[x] != x:
        gp[x] = gp[gp[x]]; x = gp[x]
    return x
for v in usage.values():
    for j in v[1:]:
        a, b = gf(v[0]), gf(j)
        if a != b: gp[max(a, b)] = min(a, b)
gsz = collections.Counter(gf(i) for i in range(len(M)))
for i, m in enumerate(M):
    g = gf(i); m['gsz'] = gsz[g]; m['grp'] = g if gsz[g] > 1 else ''
    m['bsh'] = len(usage['p:' + m['best']]) if m['best'] else 0
    m['esh'] = len(usage['e:' + m['emails'][0]]) if m['emails'] else 0
    fl = []
    if not m['hasPhone']: fl.append('missing_phone')
    if not m['hasEmail']: fl.append('missing_email')
    if any(p[1] == 'invalid' for p in m['phones']): fl.append('invalid_phone')
    if not m['hasPhone'] and not m['hasEmail'] and not m['ig']: fl.append('no_contact')
    if m['bsh'] > 1: fl.append('shared_phone')
    if m['esh'] > 1: fl.append('shared_email')
    if not m['name'] and not m['bname']: fl.append('missing_name')
    if m['nsrc'] > 1: fl.append('merged')
    m['flags'] = fl

# stable order: state, then name
US = set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR'.split())
KORD = {'Licensee': 0, 'Business': 1, 'Instagram': 2, 'Contact': 3}
M.sort(key=lambda m: (0 if m['state'] in US else 1 if m['state'] else 2, m['state'], KORD[m['kind']], not m['hasCell'], (m['name'] or m['bname'] or m['ig']).lower()))
for i, m in enumerate(M): m['id'] = 'P' + str(i + 1)
pd.to_pickle(M, '/home/claude/master/M.pkl')
pd.to_pickle(SRC, '/home/claude/master/SRC.pkl')
c = collections.Counter
print('kinds', c(m['kind'] for m in M))
print('states', c(m['state'] for m in M).most_common(20))
print('tiers', c(m['tier'] for m in M), 'cell', sum(m['hasCell'] for m in M), 'phone', sum(m['hasPhone'] for m in M), 'email', sum(m['hasEmail'] for m in M))
print('best line src', c(m['bsrc'] for m in M), 'best lt', c(m['blt'] for m in M))
print('merged', sum(m['nsrc'] > 1 for m in M), 'shared groups', sum(1 for m in M if m['gsz'] > 1))
print('sources', c(s for m in M for s in m['srcs']))
print('done', round(time.time() - t0, 1), 's')
