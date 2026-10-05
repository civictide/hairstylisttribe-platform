# Turns the Arkansas workspace into the all-states Beauty Prospects workspace (data loaded from files).
import re
s = open('/home/claude/master/site/ar_base.html').read()
n_edits = 0
def rep(old, new, count=1):
    global s, n_edits
    c = s.count(old)
    assert c >= 1, 'NOT FOUND: ' + old[:120]
    if count == 1: assert c == 1, f'NOT UNIQUE ({c}): ' + old[:120]
    s = s.replace(old, new); n_edits += 1

# ---------------- head / markup ----------------
rep('<title>Arkansas Cosmetology</title>', '<title>All Beauty Prospects</title>')
rep('/* ---------- Arkansas workspace ---------- */', '''/* ---------- workspace ---------- */
.loader{position:fixed;inset:0;z-index:80;background:var(--bg);display:grid;place-items:center;padding:24px}
.loader .in{max-width:460px;width:100%;display:flex;flex-direction:column;gap:12px}
.loader h2{font:400 2rem/1.1 var(--display);margin:0}
.loader .pbar{height:8px}
.srcl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;font-size:.86rem}
.srcl li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed var(--line);padding:3px 0}
.chip.ig{background:var(--voip-soft);color:var(--voip)}
.chip.biz{background:var(--b-soft);color:var(--b)}
.phl{display:flex;flex-direction:column;gap:3px}''')
rep('<p class="eyebrow">Civic Tide · Prospect workspace</p>', '<p class="eyebrow">Hairstylist Tribe · Prospect workspace</p>')
rep('<h1>Arkansas <span>Cosmetology</span></h1>', '<h1>All Beauty <span>Prospects</span></h1>')
rep('<p class="sub" id="sub">28,906 Arkansas cosmetology licensees and student permit holders. These are licensees, not confirmed salon owners. Pick a queue, work through people one at a time, and every text, call, note and follow-up is saved.</p>',
    '<p class="sub" id="sub">Every beauty prospect list in one place: state board licensees, Texas and Virginia salons, and Instagram stylists. The same person found on several lists is one record, with every source kept. Pick a queue, work through people one at a time, and every text, call, note and follow-up is saved.</p>')
rep('''    <input type="search" id="q" placeholder="Search name, license type, city, ZIP, phone, email, carrier or your notes" aria-label="Search">''',
    '''    <input type="search" id="q" placeholder="Search name, business, license, city, ZIP, phone, email, Instagram or your notes" aria-label="Search">''')
rep('''    <select id="fStatus" aria-label="Status"></select>''', '''    <select id="fState" aria-label="State"></select>
    <select id="fKind" aria-label="Record type"></select>
    <select id="fSrc" aria-label="Source list"></select>
    <select id="fStatus" aria-label="Status"></select>''')
# footer
i = s.index('  <footer>'); j = s.index('  </footer>') + len('  </footer>')
s = s[:i] + '''  <footer>
    <span><b>Sources.</b> <span id="srcFoot"></span> 610,923 source records were combined into one record per person or business. Records were merged only when they had the same license number in the same state, or the same email or phone <i>and</i> the same first and last name. Instagram accounts were attached to a person only when exactly one person matched the account’s email or phone. Different people who share a phone or email (often a salon front desk) are kept separate and flagged “Shared”, never removed.</span>
    <span><b>Phone type.</b> “Lookup” means the line type came with the list (a carrier lookup on that number). “By prefix” means it was inferred from the Arkansas, Kansas, Maine and Rhode Island prefix classifications and can be wrong for ported numbers. Most Texas and Michigan numbers have no line type yet and show as Unknown.</span>
    <span><b>Contactability</b> only measures how many ways you can reach someone, not how likely they are to buy. High = cellphone + email, Medium = cellphone only or landline + email, Low = one landline or email only.</span>
    <span>Texts and calls are never sent automatically. The TCPA requires prior express consent for autodialed or prerecorded calls and texts to cellphones, and the National Do Not Call Registry applies to personal numbers.</span>
  </footer>''' + s[j:]
rep('<div class="toast" id="toast" hidden></div>', '''<div class="toast" id="toast" hidden></div>
<div class="loader" id="loader"><div class="in"><p class="eyebrow" style="color:var(--gold-text)">Hairstylist Tribe · Prospect workspace</p><h2>Loading all beauty prospects…</h2><div class="pbar"><i class="p2" id="ldBar" style="width:0%"></i></div><span class="sm" id="ldTxt">Starting</span></div></div>''')

# ---------------- script: wrap everything after the helpers in main() ----------------
rep('const IN_FILE=location.protocol===\'file:\';', '''const IN_FILE=location.protocol==='file:';
async function loadAll(){
  const ld=(t,p)=>{document.getElementById('ldTxt').textContent=t;document.getElementById('ldBar').style.width=p+'%'};
  const get=async f=>{const r=await fetch('data/'+f);if(!r.ok)throw new Error(f+' '+r.status);return r.json()};
  ld('Loading list details',2);const m=await get('meta.json');let done=0;
  const parts=await Promise.all(m.files.map(f=>get(f).then(x=>{done++;ld(`Loading prospects · ${done} of ${m.files.length} parts`,Math.round(5+done/m.files.length*85));return x})));
  ld('Preparing the workspace',95);m.rows=[].concat(...parts);return m}
async function main(){
let D;try{D=await loadAll()}catch(e){document.getElementById('ldTxt').textContent='The prospect data didn’t load. Reload the page to try again.';return}''')
# end of script
rep('''function boot(){wireSettings();fillTags();drawHeader();computeStats();drawDash();refreshList(false);if(!storageOk)toast('This browser blocks saving. Use “Back up my work”.')}
start();''', '''function boot(){wireSettings();fillTags();drawHeader();computeStats();drawDash();refreshList(false);$('loader').hidden=true;if(!storageOk)toast('This browser blocks saving. Use “Back up my work”.')}
start();
}
main();''')

# ---------------- source records ----------------
i = s.index('/* ================= source records (never modified) ================= */'); j = s.index('/* ================= your work (operational data) ================= */')
s = s[:i] + r'''/* ================= source records (never modified) ================= */
const LT=D.lt, CAR=D.car, LIC=D.lic, KIND=D.kind, SRCS=D.src, TIERS=['High','Medium','Low','None'], FLAGS=D.flags;
const LTLABEL={cellphone:'Cell',landline:'Landline',voip:'VoIP',unknown:'Unknown',other:'Other',invalid:'Invalid','':'—'};
const LTCHIP={cellphone:'cell',landline:'land',voip:'voip',unknown:'none',other:'none',invalid:'none','':'none'};
const FLAGLABEL={missing_phone:'No phone',missing_email:'No email',invalid_phone:'Invalid phone number',no_contact:'No contact info at all',shared_phone:'Phone shared with another prospect',shared_email:'Email shared with another prospect',missing_name:'Missing name',merged:'Merged from several lists'};
const BSRC=['','lookup','by prefix'];
const srcNames=b=>SRCS.filter((x,k)=>b&(1<<k)).map(x=>x[1]);
const rows=new Array(D.rows.length);
for(let i=0;i<D.rows.length;i++){const a=D.rows[i];
  const oph=a[14]?a[14].split(';').map(x=>{const k=x.lastIndexOf(':');return {d:x.slice(0,k),t:LT[+x.slice(k+1)]}}):[];
  const emails=a[15]?a[15].split(' '):[];
  const r={i,num:a[0],id:'P'+a[0],name:a[1]||a[2]||(a[17]?'@'+a[17]:''),bname:a[1]?a[2]:'',kind:a[3],st:a[4],lic:LIC[a[5]]||'',olic:a[6],licno:a[7],city:a[8],zip:a[9],
    bestPhone:a[10],bestType:a[10]?LT[a[11]]:'',bestCar:CAR[a[12]]||'',bsrc:a[13],oph,emails,email:emails[0]||'',srcb:a[16],ig:a[17],igf:a[18],igt:a[19],web:a[20],
    tier:a[21],gsz:a[22],grp:a[23],bsh:a[24],esh:a[25],fl:a[26],student:!!a[27],addr:a[28],county:a[29],exp:a[30],refs:a[31],bio:a[32],active:a[33],ast:a[34]};
  r.d1=r.bestPhone;r.hasPhone=!!r.bestPhone;r.hasEmail=emails.length>0;
  const valid=[r.bestPhone&&r.bestType].concat(oph.filter(p=>p.t!=='invalid').map(p=>p.t)).filter(Boolean);
  r.has2=valid.length>1;r.hasCell=r.bestType==='cellphone';
  r.allCell=valid.length&&valid.every(t=>t==='cellphone');r.allLand=valid.length&&valid.every(t=>t==='landline');r.allVoip=valid.length&&valid.every(t=>t==='voip');r.unkLt=valid.some(t=>t==='unknown'||t==='other');
  r.method=r.hasCell?'Text':r.hasPhone?'Call':r.hasEmail?'Email':r.ig?'Instagram DM':'None';
  r.first=a[1]&&(a[3]!==2||a[19]==='i')?((a[1].trim().split(/\s+/)[0]||'').replace(/[^A-Za-z'-]/g,'')):'';
  r.loc=[r.city,[r.st,r.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  rows[i]=r}
D.rows=null;
const keyOf=r=>r._k||(r._k=(r.name+' '+r.bname+' '+r.lic+' '+r.olic+' '+r.licno+' '+r.bestPhone+' '+r.oph.map(p=>p.d).join(' ')+' '+r.emails.join(' ')+' '+r.ig+' '+r.web+' '+r.loc+' '+r.county+' '+r.addr).toLowerCase());
const byId=new Map(rows.map(r=>[r.id,r]));
const groups=new Map();rows.forEach(r=>{if(r.grp!==''&&r.grp!=null){if(!groups.has(r.grp))groups.set(r.grp,[]);groups.get(r.grp).push(r.id)}});
const kindChip=r=>r.kind===1?'<span class="chip biz">Business</span>':r.kind===2?'<span class="chip ig">Instagram</span>':r.kind===3?'<span class="chip">Contact</span>':'';
const igUrl=h=>'https://www.instagram.com/'+encodeURIComponent(h)+'/';
$('srcFoot').textContent=SRCS.map(x=>x[2]).join(', ')+'.';

''' + s[j:]

# ---------------- storage keys / app ids ----------------
rep("const OPS_KEY='ar-ops-v1',META_KEY='ar-meta-v1',UI_KEY='ar-ui-v1';", "const OPS_KEY='bp-ops-v1',META_KEY='bp-meta-v1',UI_KEY='bp-ui-v1';")
rep("indexedDB.open('ar-workspace',1)", "indexedDB.open('bp-workspace',1)", count=2)
s = s.replace("app:'ar-cosmetology-workspace'", "app:'beauty-prospects-workspace'").replace("d.app!=='ar-cosmetology-workspace'", "d.app!=='beauty-prospects-workspace'")
s = s.replace('Arkansas-Cosmetology-', 'Beauty-Prospects-')
rep("source:'arkansas_phone_line_types.xlsx, Classified sheet (33,455 rows)',", "source:'All beauty prospect lists combined ('+fmt(rows.length)+' people and businesses from 610,923 source records)',")
rep("readme:'Backup from the Arkansas Cosmetology workspace. “Restore from backup” loads it. “leads” is a readable copy; “ops” is what the page restores from, keyed by row id (A + row_number).',",
    "readme:'Backup from the All Beauty Prospects workspace. “Restore from backup” loads it. “leads” is a readable copy; “ops” is what the page restores from, keyed by prospect id (P + number).',")
rep("const leads=Object.keys(ops).map(id=>{const r=byId.get(id);const o=getOp(id);return {row:r?r.num:id,name:r?dispName(r):'',license:r?r.lic:'',",
    "const leads=Object.keys(ops).map(id=>{const r=byId.get(id);const o=getOp(id);return {id,name:r?dispName(r):'',business:r?r.bname:'',state:r?r.st:'',license:r?r.lic:'',instagram:r?r.ig:'',")
s = s.replace('worked licensees', 'worked prospects').replace('Restored ${fmt(k)} licensees.', 'Restored ${fmt(k)} prospects.')

# ---------------- wording ----------------
s = s.replace('other licensee(s)', 'other prospect(s)').replace('No licensees match these filters.', 'No prospects match these filters.')
rep("this number is listed for ${r.bsh} licensees", "this number is listed for ${r.bsh} prospects")
rep("<small>${linked.length} other licensee${linked.length>1?'s':''}</small>", "<small>${linked.length} other prospect${linked.length>1?'s':''}</small>")
rep('Skip numbers already contacted through another licensee', 'Skip numbers already contacted through another prospect')
rep("`<span class=\"chip shr\">Number listed for ${r.bsh} licensees</span>`", "`<span class=\"chip shr\">Number listed for ${r.bsh} prospects</span>`")

# ---------------- filters ----------------
rep("const QF=[['allCell','Cell phone only'],['allLand','Landline only'],['allVoip','VoIP only'],['hasCell','Has cell phone'],['hasEmail','Has email'],['cellEmail','Has cell + email'],['student','Student permits'],['noPhone','No phone'],['noEmail','No email'],['unkLt','Unknown line type']];",
    "const QF=[['hasCell','Has cell phone'],['hasEmail','Has email'],['cellEmail','Has cell + email'],['hasPhone','Has any phone'],['hasIG','Has Instagram'],['allLand','Landline only'],['unkLt','Unknown line type'],['noPhone','No phone'],['noEmail','No email'],['merged','On several lists'],['shared','Shares phone/email'],['student','Students & apprentices']];")
rep("const QFT={allCell:r=>r.allCell,allLand:r=>r.allLand,allVoip:r=>r.allVoip,hasCell:r=>r.hasCell,hasEmail:r=>r.hasEmail,cellEmail:r=>r.hasCell&&r.hasEmail,student:r=>r.student,noPhone:r=>!r.hasPhone,noEmail:r=>!r.hasEmail,unkLt:r=>r.unkLt};",
    "const QFT={allCell:r=>r.allCell,allLand:r=>r.allLand,allVoip:r=>r.allVoip,hasCell:r=>r.hasCell,hasEmail:r=>r.hasEmail,cellEmail:r=>r.hasCell&&r.hasEmail,hasPhone:r=>r.hasPhone,hasIG:r=>!!r.ig,merged:r=>!!(r.fl&(1<<7)),shared:r=>r.gsz>1,student:r=>r.student,noPhone:r=>!r.hasPhone,noEmail:r=>!r.hasEmail,unkLt:r=>r.unkLt};")
rep(" ['bad','Bad contact info',r=>S(r.id)===11||(r.fl&(1<<3))||(r.fl&(1<<6))&&(r.fl&(1<<7))||(r.fl&(1<<8))||(ops[r.id]&&ops[r.id].log.some(l=>l.out==='Bad number'))],",
    " ['instagram','Instagram stylists',r=>!!r.ig],\n ['business','Salons & shops',r=>r.kind===1],\n ['bad','Bad contact info',r=>S(r.id)===11||(r.fl&(1<<2))||(r.fl&(1<<3))||(ops[r.id]&&ops[r.id].log.some(l=>l.out==='Bad number'))],")
rep("const DEF={seg:'all',view:'',q:'',qf:{},fTag:'',", "const DEF={seg:'all',view:'',q:'',qf:{},fState:'',fKind:'',fSrc:'',fTag:'',")
rep("{const lc={};rows.forEach(r=>{lc[r.lic]=(lc[r.lic]||0)+1});fillSel('fLt2','License type: any',Object.keys(lc).sort((a,b)=>lc[b]-lc[a]).map(k=>[k,k+' ('+fmt(lc[k])+')']))}",
    """{const lc={};rows.forEach(r=>{if(r.lic)lc[r.lic]=(lc[r.lic]||0)+1});fillSel('fLt2','License type: any',Object.keys(lc).sort((a,b)=>lc[b]-lc[a]).map(k=>[k,k+' ('+fmt(lc[k])+')']))}
{const sc={};rows.forEach(r=>{const k=r.st||'';sc[k]=(sc[k]||0)+1});fillSel('fState','All states',Object.keys(sc).sort((a,b)=>sc[b]-sc[a]).map(k=>[k||'none',(k||'No state')+' ('+fmt(sc[k])+')']))}
{const kc=[0,0,0,0];rows.forEach(r=>kc[r.kind]++);fillSel('fKind','All record types',KIND.map((k,i)=>[String(i),(k==='Licensee'?'Licensees':k==='Business'?'Salons & shops':k==='Instagram'?'Instagram only':'Other contacts')+' ('+fmt(kc[i])+')']))}
{const xc=SRCS.map(()=>0);rows.forEach(r=>{for(let k=0;k<SRCS.length;k++)if(r.srcb&(1<<k))xc[k]++});fillSel('fSrc','All source lists',SRCS.map((x,k)=>[String(k),x[1]+' ('+fmt(xc[k])+')']))}""")
rep("const SELS=['fStatus',", "const SELS=['fState','fKind','fSrc','fStatus',")
rep("  if(state.fLt1){const v=state.fLt1==='none'?'':state.fLt1;if(r.lt1!==v)return false}",
    """  if(state.fState){const v=state.fState==='none'?'':state.fState;if(r.st!==v)return false}
  if(state.fKind&&String(r.kind)!==state.fKind)return false;
  if(state.fSrc&&!(r.srcb&(1<<+state.fSrc)))return false;
  if(state.fLt1){const v=state.fLt1==='none'?'':state.fLt1;if(r.bestType!==v)return false}""")
rep("  if(state.fCarrier&&r.car1!==state.fCarrier&&r.car2!==state.fCarrier)return false;", "  if(state.fCarrier&&r.bestCar!==state.fCarrier)return false;")
rep("{const c={};rows.forEach(r=>{[r.car1,r.car2].forEach(x=>{if(x)c[x]=(c[x]||0)+1})});", "{const c={};rows.forEach(r=>{if(r.bestCar)c[r.bestCar]=(c[r.bestCar]||0)+1});")
rep("fillSel('fLt1','Primary line: any',ltOpts.map(([v,l])=>[v,'Primary: '+l]));", "fillSel('fLt1','Best phone type: any',ltOpts.map(([v,l])=>[v,'Best phone: '+l]));")
rep("""    if(!r.key.includes(q)&&!(qd.length>=4&&(r.d1.includes(qd)||r.d2.includes(qd)))){""",
    """    if(!keyOf(r).includes(q)&&!(qd.length>=4&&(r.d1.includes(qd)||r.oph.some(p=>p.d.includes(qd))))){""")
rep("  else if(s==='lic')f.sort((a,b)=>a.lic.localeCompare(b.lic)||by(a,b));",
    "  else if(s==='lic')f.sort((a,b)=>a.lic.localeCompare(b.lic)||by(a,b));\n  else if(s==='state')f.sort((a,b)=>(a.st||'~').localeCompare(b.st||'~')||by(a,b));\n  else if(s==='ig')f.sort((a,b)=>(+b.igf||0)-(+a.igf||0)||by(a,b));")
rep('        <option value="lic">Sort: License type</option>', '        <option value="lic">Sort: License type</option>\n        <option value="state">Sort: State</option>\n        <option value="ig">Sort: Instagram followers</option>')

# ---------------- stats / dashboard ----------------
rep("const c={total:rows.length,contactable:0,", "const c={total:rows.length,lic:0,biz:0,igc:0,igonly:0,states:new Set(),contactable:0,")
rep("    if(r.tier<3)c.contactable++;if(r.hasCell)c.cell++;if(r.d1&&r.lt1==='landline'||r.has2&&r.lt2==='landline')c.land++;if(r.d1&&r.lt1==='voip'||r.has2&&r.lt2==='voip')c.voip++;",
    "    if(r.tier<3)c.contactable++;if(r.hasCell)c.cell++;if(r.allLand)c.land++;if(r.bestType==='voip')c.voip++;if(r.kind===0)c.lic++;else if(r.kind===1)c.biz++;else if(r.kind===2)c.igonly++;if(r.ig)c.igc++;if(r.st)c.states.add(r.st);")
rep("  $('stats').innerHTML=[[c.total,'licensees'],[c.cell,'with a cellphone'],[c.cellEmail,'cell + email']]", "  $('stats').innerHTML=[[c.total,'prospects'],[c.cell,'with a cellphone'],[c.email,'with an email'],[c.igc,'on Instagram']]")
rep("  $('kpis').innerHTML=[kpi('Total licensees',c.total,'','all'),kpi('Contactable',c.contactable),kpi('Cellphones',c.cell,'','cellEmail'),kpi('Landlines',c.land,'','landOnly'),kpi('VoIP',c.voip),kpi('Email available',c.email),kpi('Student permits',c.student),",
    "  $('kpis').innerHTML=[kpi('Total prospects',c.total,'','all'),kpi('Licensees',c.lic),kpi('Salons & shops',c.biz,'','business'),kpi('On Instagram',c.igc,'','instagram'),kpi('Contactable',c.contactable),kpi('Cellphones',c.cell,'','cellEmail'),kpi('Landline only',c.land,'','landOnly'),kpi('Email available',c.email),kpi('Students & apprentices',c.student),")

# ---------------- table ----------------
rep(""" ['name','Name','minmax(170px,1.6fr)',true],['lic','License type','150px',true],['phone','Best phone','150px',true],['ptype','Phone type','92px',true],['email','Email','minmax(150px,1.3fr)',true],
 ['status','Status','150px',true],['last','Last contact','118px',true],['follow','Next follow-up','108px',true],['pri','Priority','96px',true],['notes','Notes','minmax(120px,1fr)',true],['act','Actions','128px',true],
 ['other','City','140px',false],['carrier','Carrier','150px',false],['tier','Contactability','108px',false],['rem','Remarks','150px',false],['shared','Shared contact','110px',false],['tags','Tags','140px',false],['row','Row #','64px',false]];""",
 """ ['name','Name','minmax(170px,1.6fr)',true],['state','State','56px',true],['lic','License / type','150px',true],['phone','Best phone','150px',true],['ptype','Phone type','92px',true],['email','Email','minmax(150px,1.3fr)',true],
 ['status','Status','150px',true],['last','Last contact','118px',true],['follow','Next follow-up','108px',true],['notes','Notes','minmax(120px,1fr)',true],['act','Actions','128px',true],
 ['pri','Priority','96px',false],['other','City','140px',false],['ig','Instagram','140px',false],['srcs','Source lists','160px',false],['carrier','Carrier','150px',false],['tier','Contactability','108px',false],['shared','Shared contact','110px',false],['tags','Tags','140px',false],['row','ID','72px',false]];""")
rep("let visCols=(meta.settings.cols)||COLS.filter(c=>c[3]).map(c=>c[0]);", "let visCols=(meta.settings.cols)||COLS.filter(c=>c[3]).map(c=>c[0]);")
rep("""if(r.fl&(1<<9))fl.push('<span class="chip dq">Test?</span>');if(r.olic)fl.push(`<span class="chip" title="Also holds: ${esc(r.olic)}">+${r.olic.split(' | ').length} license type${r.olic.split(' | ').length>1?'s':''}</span>`);""",
    """if(r.kind)fl.push(kindChip(r));if(r.ig&&r.kind!==2)fl.push('<span class="chip ig">IG</span>');if(r.bname)fl.push(`<span class="chip biz">${esc(r.bname)}</span>`);if(r.olic)fl.push(`<span class="chip" title="Also holds: ${esc(r.olic)}">+${r.olic.split(' | ').length} license type${r.olic.split(' | ').length>1?'s':''}</span>`);""")
rep("""    case 'lic':return `<span${r.student?' class="sm"':''}>${esc(r.lic||'—')}</span>`;
    case 'phone':{const p=dispPhone(r);return p?`<span class="mono">${esc(p)}</span>${r.src===2&&!(o&&o.ed&&o.ed.phone)?'<div class="sub2">from other phone</div>':''}`:'<span class="sm">No phone</span>'}""",
    """    case 'state':return r.st?`<span class="mono">${esc(r.st)}</span>`:'<span class="sm">—</span>';
    case 'lic':return r.lic?`<span${r.student?' class="sm"':''}>${esc(r.lic)}</span>`:r.ig?`<span class="sm">@${esc(r.ig)}</span>`:'<span class="sm">—</span>';
    case 'phone':{const p=dispPhone(r);return p?`<span class="mono">${esc(p)}</span>${r.oph.length?`<div class="sub2">+${r.oph.length} more</div>`:''}`:'<span class="sm">No phone</span>'}""")
rep("""    case 'ptype':return r.bestType?`<span class="chip ${LTCHIP[r.bestType]}">${LTLABEL[r.bestType]}</span>`:'<span class="sm">—</span>';""",
    """    case 'ptype':return r.bestType?`<span class="chip ${LTCHIP[r.bestType]}">${LTLABEL[r.bestType]}</span>${r.bsrc===2?'<div class="sub2">by prefix</div>':''}`:'<span class="sm">—</span>';""")
rep("""    case 'other':return r.city?esc(r.city)+(r.st&&r.st!=='AR'?' <span class="sm">'+esc(r.st)+'</span>':''):'<span class="sm">—</span>';""",
    """    case 'other':return r.city?esc(r.city):'<span class="sm">—</span>';
    case 'ig':return r.ig?`<a href="${igUrl(r.ig)}" target="_blank" rel="noopener" data-stop="1">@${esc(r.ig)}</a>${r.igf!==''?`<div class="sub2">${fmt(r.igf)} followers</div>`:''}`:'<span class="sm">—</span>';
    case 'srcs':return `<span class="sm">${esc(SRCS.filter((x,k)=>r.srcb&(1<<k)).map(x=>x[0]).join(' · '))}</span>`;""")
rep("""    case 'rem':return r.rem?esc(r.rem):'<span class="sm">—</span>';
""", "")
rep("""    case 'row':return `<span class="mono">${r.num}</span>`;""", """    case 'row':return `<span class="mono">${r.id}</span>`;""")
rep("""      html+=`<div class="vr m${r.id===selId?' sel':''}" data-open="${r.id}" style="top:${i*h}px"><div class="m1">${esc(dispName(r))}</div>`+""",
    """      html+=`<div class="vr m${r.id===selId?' sel':''}" data-open="${r.id}" style="top:${i*h}px"><div class="m1">${esc(dispName(r))}${r.st?' <span class="sm">'+esc(r.st)+'</span>':''}</div>`+""")
rep("  if(e.target.closest('select'))return;", "  if(e.target.closest('select')||e.target.closest('[data-stop]'))return;", count=1)

# ---------------- profile ----------------
rep("""    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>${esc(r.lic||'—')}${r.loc?' · '+esc(r.loc):''}</span>${stBadge(o.s)}<span class="chip ${r.tier===0?'cell':'none'}">Contactability: ${TIERS[r.tier]}</span>${r.gsz>1?`<span class="chip shr">Shared contact ×${r.gsz}</span>`:''}</div>""",
    """    ${r.bname?`<div class="sm">${esc(r.bname)}</div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>${esc(r.lic||(r.ig?'Instagram account':'—'))}${r.loc?' · '+esc(r.loc):''}</span>${kindChip(r)}${stBadge(o.s)}<span class="chip ${r.tier===0?'cell':'none'}">Contactability: ${TIERS[r.tier]}</span>${r.gsz>1?`<span class="chip shr">Shared contact ×${r.gsz}</span>`:''}</div>""")
rep("""${em?`<button type="button" data-copy="${esc(em)}">Copy email</button>`:''}</div>""",
    """${em?`<button type="button" data-copy="${esc(em)}">Copy email</button>`:''}${r.ig?`<a href="${igUrl(r.ig)}" target="_blank" rel="noopener">Instagram</a>`:''}</div>""")
rep("""      <dt>Best phone</dt><dd>${p?`<span class="mono">${esc(p)}</span> <span class="chip ${LTCHIP[r.bestType]}">${LTLABEL[r.bestType]||'—'}</span>${r.src===2?' <span class="sm">(the other phone on file)</span>':''}${!r.hasPhone&&r.p1?` <span class="sm">${esc(r.p1)} isn’t a usable number</span>`:''}`:'—'}</dd>
      <dt>Location</dt><dd>${r.loc?esc(r.loc):'—'}${r.fl&(1<<10)?' <span class="chip dq">out of state</span>':''}</dd>""",
    """      <dt>Best phone</dt><dd>${p?`<span class="mono">${esc(p)}</span> <span class="chip ${LTCHIP[r.bestType]}">${LTLABEL[r.bestType]||'—'}</span> <span class="sm">${esc(r.bestCar||'')}${r.bsrc?' · '+BSRC[r.bsrc]:''}</span>`:'—'}</dd>
      ${r.oph.length?`<dt>Other phones</dt><dd class="phl">${r.oph.map(x=>`<span><span class="mono">${esc(fmtPh(x.d))}</span> <span class="chip ${LTCHIP[x.t]}">${LTLABEL[x.t]}</span> <button type="button" class="copy" data-copy="${esc(fmtPh(x.d))}">Copy</button></span>`).join('')}</dd>`:''}
      ${r.emails.length>1?`<dt>Other emails</dt><dd class="phl">${r.emails.slice(1).map(x=>`<span>${esc(x)} <button type="button" class="copy" data-copy="${esc(x)}">Copy</button></span>`).join('')}</dd>`:''}
      ${r.ig?`<dt>Instagram</dt><dd><a href="${igUrl(r.ig)}" target="_blank" rel="noopener">@${esc(r.ig)}</a>${r.igf!==''?' · '+fmt(r.igf)+' followers':''}${r.igt?' · '+(r.igt==='b'?'business account':'personal account'):''}</dd>`:''}
      ${r.web?`<dt>Website</dt><dd><a href="${esc(/^https?:/.test(r.web)?r.web:'https://'+r.web)}" target="_blank" rel="noopener">${esc(r.web.replace(/^https?:\\/\\//,'').slice(0,60))}</a></dd>`:''}
      <dt>Location</dt><dd>${r.addr?esc(r.addr)+', ':''}${r.loc?esc(r.loc):'—'}${r.county?' · '+esc(r.county)+' County':''}${r.ast?` <span class="sm">(address in ${esc(r.ast)})</span>`:''}</dd>
      ${r.licno?`<dt>License number</dt><dd class="mono">${esc(r.licno)}</dd>`:''}
      ${r.exp?`<dt>License expires</dt><dd>${esc(r.exp)}</dd>`:''}""")
# source panel
i = s.index("""    <section class="src"><span class="flabel">Source record · never changed</span>"""); j = s.index('    </section>', i) + len('    </section>')
s = s[:i] + """    <section class="src"><span class="flabel">Where this record came from · never changed</span>
      <ul class="srcl">${r.refs.split(' ').filter(Boolean).map(x=>{const k=x.indexOf(':');const c=x.slice(0,k);const sx=SRCS.find(y=>y[0]===c);return `<li><span>${esc(sx?sx[1]:c)}</span><span class="mono">${c==='IG'?'@'+esc(x.slice(k+1)):'row '+esc(x.slice(k+1))}</span></li>`}).join('')}</ul>
      ${r.bio?`<p class="sm" style="margin-top:8px">Instagram bio: ${esc(r.bio)}</p>`:''}
    </section>""" + s[j:]
rep("""      <div class="field"><label for="ePhone">Phone</label><input id="ePhone" value="${esc(o.ed.phone||'')}" placeholder="${esc(r.bestPhone)}"></div>""",
    """      <div class="field"><label for="ePhone">Phone</label><input id="ePhone" value="${esc(o.ed.phone||'')}" placeholder="${esc(fmtPh(r.bestPhone))}"></div>""")
rep("""return `<button type="button" data-pnav="${x}">${esc(dispName(lr))} · ${esc(lr.lic)} · ${STATUSES[S(x)]}</button>`""",
    """return `<button type="button" data-pnav="${x}">${esc(dispName(lr))} · ${esc(lr.lic||(lr.ig?'@'+lr.ig:''))}${lr.st?' · '+esc(lr.st):''} · ${STATUSES[S(x)]}</button>`""")

# ---------------- outreach mode card ----------------
rep("""      ${p?`<div class="bigphone">📱 ${esc(p)}</div><div><span class="chip ${LTCHIP[r.bestType]}">${LTLABEL[r.bestType]||'—'}</span> <span class="sm">${esc(r.bestCar||'')}${r.src===2?' · from the other phone on file':''}</span></div>`:'<div class="sm">No phone on file</div>'}
      ${r.has2&&r.src===1?`<div class="sm">Other phone: <span class="mono">${esc(r.p2)}</span> (${LTLABEL[r.lt2]})</div>`:''}
      ${r.has2&&r.src===2?`<div class="sm">Primary phone: <span class="mono">${esc(r.p1)}</span> (${LTLABEL[r.lt1]})</div>`:''}""",
    """      ${r.bname?`<div><b>${esc(r.bname)}</b></div>`:''}
      ${p?`<div class="bigphone">📱 ${esc(p)}</div><div><span class="chip ${LTCHIP[r.bestType]}">${LTLABEL[r.bestType]||'—'}</span> <span class="sm">${esc(r.bestCar||'')}${r.bsrc===2?' · type by prefix':''}</span></div>`:'<div class="sm">No phone on file</div>'}
      ${r.oph.length?`<div class="sm">Other phone${r.oph.length>1?'s':''}: ${r.oph.slice(0,3).map(x=>`<span class="mono">${esc(fmtPh(x.d))}</span> (${LTLABEL[x.t]})`).join(', ')}</div>`:''}
      ${r.ig?`<div>📷 <a href="${igUrl(r.ig)}" target="_blank" rel="noopener">@${esc(r.ig)}</a>${r.igf!==''?' <span class="sm">· '+fmt(r.igf)+' followers</span>':''}</div>`:''}""")
rep("""      ${r.rem?`<div class="sm">Remarks: ${esc(r.rem)}</div>`:''}
""", """      <div class="sm">On: ${esc(srcNames(r.srcb).join(' · '))}</div>
""")
rep("""      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>${esc(r.lic||'—')}${r.loc?' · '+esc(r.loc):''}</span>${stBadge(o.s)}${o.pr?""",
    """      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span>${esc(r.lic||(r.ig?'Instagram account':'—'))}${r.loc?' · '+esc(r.loc):''}</span>${kindChip(r)}${stBadge(o.s)}${o.pr?""")
rep("if(meta.settings.tplMode==='rotate')return ts[r.num%ts.length];", "if(meta.settings.tplMode==='rotate')return ts[r.num%ts.length];")
rep("function fillMsg(r){return (pickTpl(r).text||'').replace(/\\{first_name\\}/g,r.first?r.first[0]+r.first.slice(1).toLowerCase():'there')",
    "function fillMsg(r){return (pickTpl(r).text||'').replace(/\\{first_name\\}/g,r.first?r.first[0].toUpperCase()+r.first.slice(1).toLowerCase():'there')")
rep("""  $('resumeLine').innerHTML=r?`Where you left off: <b>${esc(dispName(r))}</b> · ${ago(L.t)}${L.q?""", """  $('resumeLine').innerHTML=r?`Where you left off: <b>${esc(dispName(r))}</b> · ${ago(L.t)}${L.q?""")

# ---------------- export ----------------
i = s.index("const D_COLS=["); j = s.index("function timelineHTML(o){")
s = s[:i] + """const D_COLS=[['id','id'],['name','name'],['business_name','business_name'],['record_type','record_type'],['state','state'],['license_type','license_type'],['other_license_types','other_license_types'],['license_number','license_number'],['address','address'],['city','city'],['zip','zip'],['county','county'],['best_phone','best_phone'],['best_phone_type','best_phone_type'],['best_phone_carrier','best_phone_carrier'],['phone_type_basis','phone_type_basis'],['other_phones','other_phones'],['email','email'],['other_emails','other_emails'],['instagram','instagram'],['instagram_followers','instagram_followers'],['website','website'],['source_lists','source_lists'],['source_rows','source_rows']];
function rawVal(r,k){return {id:r.id,name:r.name,business_name:r.bname,record_type:KIND[r.kind],state:r.st,license_type:r.lic,other_license_types:r.olic,license_number:r.licno,address:r.addr,city:r.city,zip:r.zip,county:r.county,best_phone:fmtPh(r.bestPhone),best_phone_type:r.bestType,best_phone_carrier:r.bestCar,phone_type_basis:BSRC[r.bsrc],other_phones:r.oph.map(x=>fmtPh(x.d)+' ('+(LTLABEL[x.t]||'')+')').join('; '),email:r.email,other_emails:r.emails.slice(1).join('; '),instagram:r.ig,instagram_followers:r.igf,website:r.web,source_lists:srcNames(r.srcb).join('; '),source_rows:r.refs}[k]}
""" + s[j:]
rep("""  const head=D_COLS.map(c=>c[0]).concat(['best_contact_phone','best_phone_type','best_phone_source','best_contact_method','has_phone','has_cellphone','has_email','student_permit','contactability','contactability_score','shared_group','shared_group_size','dq_flags',""",
    """  const head=D_COLS.map(c=>c[0]).concat(['best_contact_method','has_phone','has_cellphone','has_email','student_or_apprentice','contactability','shared_group','shared_group_size','dq_flags',""")
rep("""    lines.push(D_COLS.map(c=>rawVal(r,c[0])).concat([r.bestPhone,r.bestType,['','primary','other'][r.src],r.method,r.hasPhone,!!r.hasCell,r.hasEmail,r.student,TIERS[r.tier],r.score,r.grp||'',r.gsz,FLAGS.filter((f,i)=>r.fl&(1<<i)).join(' '),""",
    """    lines.push(D_COLS.map(c=>rawVal(r,c[0])).concat([r.method,r.hasPhone,!!r.hasCell,r.hasEmail,r.student,TIERS[r.tier],r.grp===''?'':r.grp,r.gsz,FLAGS.filter((f,i)=>r.fl&(1<<i)).join(' '),""")
rep("""    const lines=['time,name,license,phone,channel,direction,outcome,message_version,details'].concat(es.map(({id,l})=>{const r=byId.get(id);return [fmtStamp(l.t),r?dispName(r):id,r?r.lic:'',r?dispPhone(r):'',""",
    """    const lines=['time,name,state,license,phone,channel,direction,outcome,message_version,details'].concat(es.map(({id,l})=>{const r=byId.get(id);return [fmtStamp(l.t),r?dispName(r):id,r?r.st:'',r?r.lic:'',r?dispPhone(r):'',""")
# guard large export to clipboard
rep("$('copyCsv').onclick=()=>copyText(csv(current),`Copied ${fmt(current.length)} rows. Paste them into a spreadsheet.`);",
    "$('copyCsv').onclick=()=>{if(current.length>20000){toast('That’s '+fmt(current.length)+' rows, too many to copy. Narrow the filters or use Export CSV.');return}copyText(csv(current),`Copied ${fmt(current.length)} rows. Paste them into a spreadsheet.`)};")
rep("startOM').onclick", "startOM').onclick")
rep("""'Start with “Cellphones — not contacted”. Everyone you work on is saved as you go.'""", """'Pick a state with the filters, then start with “Cellphones — not contacted”. Everyone you work on is saved as you go.'""")
# rotate uses r.num ok; quick count of current for count label
rep("""  $('count').innerHTML=`<b>${fmt(current.length)}</b> matching · ${fmt(current.filter(r=>r.hasCell).length)} with a cellphone · ${fmt(current.filter(r=>!isContacted(r.id)).length)} not contacted`;
  $('omThese')""", """  drawCount();
  $('omThese')""")
s = s.replace("""$('count').innerHTML=`<b>${fmt(current.length)}</b> matching · ${fmt(current.filter(r=>r.hasCell).length)} with a cellphone · ${fmt(current.filter(r=>!isContacted(r.id)).length)} not contacted`;""", "drawCount();")
rep("function computeList(){current=sortList(rows.filter(r=>passes(r)))}",
    "function computeList(){current=sortList(rows.filter(r=>passes(r)))}\nfunction drawCount(){let c=0,n=0,e=0;for(const r of current){if(r.hasCell)c++;if(r.hasEmail)e++;if(!isContacted(r.id))n++}$('count').innerHTML=`<b>${fmt(current.length)}</b> matching · ${fmt(c)} with a cellphone · ${fmt(e)} with an email · ${fmt(n)} not contacted`}")
open('/home/claude/master/site/index.html', 'w').write(s)
print('edits', n_edits, 'size', len(s))
for bad in ['r.p1', 'r.p2', 'r.lt1', 'r.lt2', 'r.car1', 'r.car2', 'r.src===', 'r.rem', 'r.key', 'r.mrows', 'r.score', 'D.r', 'licensee']:
    if bad in s: print('LEFT:', bad, s.count(bad))
