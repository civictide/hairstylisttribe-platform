// Beauty Business Growth Diagnostic — ENGINE
// routing → per-answer signals → economic model → derived signals → cross-answer rules → dimension statuses
// → top-3 selection → interventions → “wouldn’t spend money on” → report (report.js)

const T = require('./taxonomy');
const { QUESTIONS, SEQUENCE_DEFAULT, SEQUENCE_SO } = require('./questions');
const { INTERVENTIONS, INT, DONT_BUY } = require('./interventions');
const { RULES } = require('./rules');
const { individualModel, salonModel, money, pct, num } = require('./model');

const QMAP = Object.fromEntries(QUESTIONS.map((x) => [x.id, x]));
const VERSION = 'beauty-1.0.0';

// ---------------------------------------------------------------- helpers
const resolveText = (t, persona) => (typeof t === 'string' ? t : t ? t[persona] || t.default : '');
const optionsFor = (node, persona) => (node.optionsBy && node.optionsBy[persona]) || node.options || [];

function resolvePersona(answers) {
  const p = answers.Q01;
  if (p !== 'OT') return p;
  const r = answers.Q02;
  if (r === 'SR') return 'SR';
  if (r === 'BR') return 'BR';
  return 'IP';
}

function makeGetter(answers, persona) {
  const opt = (qid, row) => {
    const qq = QMAP[qid];
    if (!qq) return null;
    const a = answers[qid];
    if (a == null) return null;
    if (qq.type === 'composite') {
      const r = qq.rows.find((x) => x.id === row);
      if (!r || a[row] == null) return null;
      if (r.type === 'count') return { v: a[row], n: a[row] };
      return optionsFor(r, persona).find((x) => x.v === a[row]) || null;
    }
    if (qq.type === 'multi') return null;
    return optionsFor(qq, persona).find((x) => x.v === a) || null;
  };
  return {
    opt,
    n: (qid, row) => { const x = opt(qid, row); return x && x.n != null ? x.n : null; },
    v: (qid, row) => { if (QMAP[qid] && QMAP[qid].type === 'multi') return answers[qid] || null; const x = opt(qid, row); return x ? x.v : null; },
    multi: (qid) => (Array.isArray(answers[qid]) ? answers[qid] : null),
  };
}

// ---------------------------------------------------------------- condition DSL
function evalCond(c, ctx) {
  if (!c) return true;
  if (c.all) return c.all.every((x) => evalCond(x, ctx));
  if (c.any) return c.any.some((x) => evalCond(x, ctx));
  if (c.not) return !evalCond(c.not, ctx);
  if (c.persona) return c.persona.includes(ctx.persona);
  if (c.tag) return ctx.tags ? ctx.tags.has(c.tag) : false;
  const cmp = (val) => {
    if (val == null) return false;
    if (c.gte != null && !(val >= c.gte)) return false;
    if (c.lte != null && !(val <= c.lte)) return false;
    if (c.gt != null && !(val > c.gt)) return false;
    if (c.lt != null && !(val < c.lt)) return false;
    return true;
  };
  if (c.m) return cmp(ctx.metrics ? ctx.metrics[c.m] : null);
  if (c.dim) { const d = ctx.dimScores && ctx.dimScores[c.dim]; return d && d.hasData ? cmp(d.concern) : false; }
  if (c.q) {
    const g = ctx.get;
    if (c.has) { const m = g.multi(c.q); return !!m && m.includes(c.has); }
    if (c.hasAny) { const m = g.multi(c.q); return !!m && c.hasAny.some((x) => m.includes(x)); }
    if (c.countLte != null) { const m = g.multi(c.q); return !!m && m.filter((x) => x !== 'unsure').length <= c.countLte; }
    if (c.rowLt) { const a = g.n(c.q, c.rowLt[0]); const b = g.n(c.q, c.rowLt[1]); return a != null && b != null && a < b; }
    if (c.in) return c.in.includes(g.v(c.q, c.row));
    return cmp(g.n(c.q, c.row));
  }
  return false;
}

// ---------------------------------------------------------------- routing
function shouldAsk(qq, persona, ctx) {
  if (qq.id === 'Q01') return true;
  if (qq.id === 'Q02') return ctx.rawPersona === 'OT';
  if (!qq.personas.includes(persona)) return false;
  const core = qq.core && !(qq.coreBy && qq.coreBy[persona] === false);
  if (core) return true;
  return qq.trigger ? evalCond(qq.trigger, ctx) : false;
}

function route(allAnswers) {
  const rawPersona = allAnswers.Q01;
  const persona = resolvePersona(allAnswers);
  const seq = persona === 'SO' ? SEQUENCE_SO : SEQUENCE_DEFAULT;
  const given = {};
  const shown = [];
  for (const id of seq) {
    const qq = QMAP[id];
    const ctx = { persona, rawPersona, get: makeGetter(given, persona) };
    if (!shouldAsk(qq, persona, ctx)) continue;
    shown.push(id);
    if (allAnswers[id] !== undefined) given[id] = allAnswers[id];
  }
  return { persona, shown, answers: given };
}

// follow-ups are derived from triggers so the matrix can never disagree with routing
function referencedQuestions(c, out = new Set()) {
  if (!c) return out;
  ['all', 'any'].forEach((k) => c[k] && c[k].forEach((x) => referencedQuestions(x, out)));
  if (c.not) referencedQuestions(c.not, out);
  if (c.q) out.add(c.q);
  return out;
}
function followUps() {
  const map = {};
  QUESTIONS.forEach((x) => (map[x.id] = []));
  QUESTIONS.forEach((x) => { if (x.trigger) referencedQuestions(x.trigger).forEach((src) => map[src] && map[src].push(x.id)); });
  return map;
}

// ---------------------------------------------------------------- scoring
const levelConcern = (l) => T.LEVELS[String(l)].concern;

function collectSignals(route_, get) {
  const { persona, shown, answers } = route_;
  const sig = {}; // dim → [{src, level, weight, conf, ev}]
  let unknowns = 0;
  const push = (dim, s) => (sig[dim] = sig[dim] || []).push(s);
  const fill = (tpl, label) => {
    if (!tpl) return null;
    const lead = tpl.startsWith('{label}');
    return tpl.replace('{label}', lead ? label.charAt(0).toUpperCase() + label.slice(1) : label.charAt(0).toLowerCase() + label.slice(1)).replace('{labels}', label);
  };

  for (const id of shown) {
    const qq = QMAP[id];
    const a = answers[id];
    if (a == null) continue;
    const handle = (o, w, conf, tpl, src) => {
      if (!o || !o.sig) return;
      for (const [dim, level] of Object.entries(o.sig)) {
        if (level === 'U') { unknowns++; push(dim, { src, level: 'U', weight: 0, conf: 0 }); continue; }
        push(dim, { src, level, weight: w, conf, ev: o.ev || (level >= 1 ? fill(tpl, o.label) : null), label: o.label });
      }
    };
    if (qq.type === 'single') handle(optionsFor(qq, persona).find((x) => x.v === a), qq.weight, qq.conf, qq.ev, id);
    else if (qq.type === 'multi') {
      const opts = optionsFor(qq, persona).filter((x) => a.includes(x.v));
      const w = qq.weight / Math.max(1, Math.sqrt(opts.length));
      opts.forEach((o) => handle(o, w, qq.conf, null, id));
    } else if (qq.type === 'composite') {
      for (const r of qq.rows) {
        if (r.type === 'count' || a[r.id] == null) continue;
        const o = optionsFor(r, persona).find((x) => x.v === a[r.id]);
        handle(o, qq.weight * (r.weight || 1), qq.conf, r.ev, `${id}.${r.id}`);
      }
    }
  }
  return { sig, unknowns, push };
}

function derivedSignals(ctx, push) {
  const { persona, get, model: m } = ctx;
  const d = (dim, level, weight, conf, ev, src) => push(dim, { src: 'derived:' + src, level, weight, conf, ev, derived: true });
  if (m.kind === 'individual') {
    const U = m.inputs.U;
    // ACQ: demand relative to open capacity, never raw volume alone
    if (U != null) {
      const nm = m.inputs.newMo;
      let lvl;
      if (U >= 0.82) lvl = -1;
      else if (nm == null) lvl = U <= 0.6 ? 2 : 1;
      else if (U <= 0.6) lvl = nm <= 2 ? 3 : nm <= 5 ? 2 : 1;
      else lvl = nm <= 2 ? 2 : nm <= 5 ? 1 : 0;
      d('ACQ', lvl, 3, 0.8, lvl >= 2 ? `There’s open time in your schedule (${pct(1 - U)} unbooked) and ${nm != null ? `about ${num(nm)} new clients a month` : 'few new clients'} to fill it.` : null, 'demand_vs_capacity');
    }
    if (m.leakRate != null) {
      const r = m.leakRate;
      const lvl = r < 0.03 ? -1 : r < 0.06 ? 0 : r < 0.1 ? 1 : r < 0.15 ? 2 : 3;
      d('CXL', lvl, 3, 0.8, lvl >= 1 ? `About ${pct(r)} of scheduled appointments cancel late or no-show${m.lostHours >= 0.5 ? ` — roughly ${num(m.lostHours, 1)} hours a week that don’t get refilled` : ''}.` : null, 'leak_rate');
      if (lvl >= 2 && m.effUtil != null && U != null && U - m.effUtil >= 0.08) d('CXL', lvl, 0.5, 0.3, `You’re about ${pct(U)} booked, but after late cancellations only about ${pct(m.effUtil)} of your available time is actually used.`, 'effective_utilization');
    }
    if (m.rphBooked != null) {
      const r = m.rphBooked; // calibration placeholders — tune against local data
      const lvl = r >= 110 ? -1 : r >= 80 ? 0 : r >= 60 ? 1 : r >= 45 ? 2 : 3;
      d('TICKET', lvl, 2, 0.6, lvl >= 1 ? `Each booked hour earns about ${money(r)} in services.` : null, 'revenue_per_booked_hour');
    }
    if (m.dbSize != null && get.v('Q29') === 'nothing' && m.dbSize >= 700) d('REACT', 3, 2, 0.7, `About ${num(m.dbSize)} past clients and no process for inviting back the ones who stop coming.`, 'dormant_db');
    if (m.rentShare != null) {
      const r = m.rentShare;
      const lvl = r < 0.15 ? -1 : r < 0.25 ? 0 : r < 0.35 ? 2 : 3;
      if (lvl >= 2) d('UTIL', lvl, 1, 0.5, `Rent takes about ${pct(r)} of your service revenue — ${num(m.apptsForRent, 1)} appointments a week.`, 'rent_share');
    }
  } else {
    // salon
    if (m.chairUtil != null) {
      const r = m.chairUtil;
      const lvl = r >= 0.9 ? -1 : r >= 0.75 ? 1 : r >= 0.6 ? 2 : 3;
      d('CHAIR_UTIL', lvl, 3, 0.9, lvl >= 1 ? `${m.inputs.P} of ${m.inputs.S} stations are producing revenue most days.` : null, 'chair_util');
    }
    const fullness = get.v('Q48');
    if (fullness === 'full') d('ACQ', -1, 3, 0.8, null, 'stylist_books_full');
    if (m.retailShare != null) {
      const r = m.retailShare;
      const lvl = r >= 0.12 ? -1 : r >= 0.07 ? 0 : r >= 0.04 ? 2 : 3;
      d('RETAIL', lvl, 1.5, 0.6, lvl >= 2 ? `Retail is ${r < 0.01 ? 'under 1%' : 'about ' + pct(r)} of service revenue.` : null, 'retail_share');
    }
    const vis = get.multi('Q49');
    if (vis) {
      const c = vis.filter((x) => x !== 'none').length;
      const lvl = c >= 4 ? -1 : c >= 2 ? 1 : c === 1 ? 2 : 3;
      d('OPS', lvl, 2, 0.7, lvl >= 2 ? (c === 0 ? 'You can’t currently see revenue, rebooking, retention or retail by stylist.' : 'You can see only one performance number by stylist.') : null, 'visibility');
      d('STYLIST_PROD', lvl >= 2 ? 1 : 0, 0.8, 0.4, null, 'visibility');
      d('FIN', lvl, 1.5, 0.6, null, 'visibility');
    }
    if (m.independentShare != null) {
      const r = m.independentShare;
      const lvl = r >= 0.8 ? -1 : r >= 0.65 ? 0 : r >= 0.5 ? 2 : 3;
      d('OWNER_DEP', lvl, 1.5, 0.6, lvl >= 2 ? `Only about ${pct(r)} of salon revenue happens without your own chair.` : null, 'independent_share');
    }
  }
  // FIN for everyone
  const fin = get.multi('Q41');
  if (fin) {
    const c = fin.filter((x) => x !== 'none').length;
    const lvl = c >= 5 ? -1 : c >= 3 ? 0 : c === 2 ? 1 : c === 1 ? 2 : 3;
    d('FIN', lvl, 2, 0.8, lvl >= 2 ? (c === 0 ? 'None of the key numbers are readily at hand yet.' : 'Only one of the key numbers is readily at hand.') : null, 'known_numbers');
  }
}

function scoreDims(sig) {
  const out = {};
  for (const [dim, list] of Object.entries(sig)) {
    const real = list.filter((s) => s.level !== 'U' && s.weight > 0);
    const unknown = list.filter((s) => s.level === 'U').length;
    if (!real.length) { out[dim] = { hasData: false, unknown, concern: null, conf: 0, signals: list }; continue; }
    const wsum = real.reduce((a, s) => a + s.weight, 0);
    const avg = real.reduce((a, s) => a + s.weight * levelConcern(s.level), 0) / wsum;
    const max = Math.max(...real.map((s) => levelConcern(s.level)));
    const concern = 0.65 * avg + 0.35 * max;
    const confRaw = real.reduce((a, s) => a + s.weight * s.conf, 0);
    out[dim] = { hasData: true, unknown, concern, base: concern, confRaw, signals: list };
  }
  return out;
}

function statusFor(concern, conf, hasData) {
  if (!hasData || conf < T.MIN_CONFIDENCE) return T.STATUS_INSUFFICIENT;
  return T.STATUSES.find((s) => concern <= s.max);
}

// ---------------------------------------------------------------- rules
function applyRules(pass, ctx, dims, state) {
  const fired = [];
  const pending = { scale: {}, floor: {}, cap: {} };
  for (const r of RULES.filter((x) => x.pass === pass)) {
    if (!evalCond(r.when, { ...ctx, tags: state.tags, dimScores: dims })) continue;
    fired.push(r.id);
    const e = r.effects;
    if (e.tag) state.tags.add(e.tag);
    if (e.gateDemand) state.gateDemand = true;
    (e.suppress || []).forEach((x) => state.suppress.add(x));
    (e.demote || []).forEach((x) => state.demote.add(x));
    Object.entries(e.scale || {}).forEach(([k, f]) => (pending.scale[k] = (pending.scale[k] || 1) * f));
    Object.entries(e.floor || {}).forEach(([k, f]) => (pending.floor[k] = Math.max(pending.floor[k] || 0, f)));
    Object.entries(e.cap || {}).forEach(([k, f]) => (pending.cap[k] = Math.min(pending.cap[k] || 101, f)));
    Object.entries(e.impact || {}).forEach(([k, f]) => (state.impact[k] = (state.impact[k] || 1) * f));
    Object.entries(e.note || {}).forEach(([k, txt]) => (state.notes[k] = state.notes[k] || []).push(fillTpl(txt, ctx.fmt)));
    (e.dontBuy || []).forEach((x) => { if (!state.dontBuy.find((y) => y.id === x.id)) state.dontBuy.push({ id: x.id, reason: fillTpl(x.reason, ctx.fmt), rule: r.id }); });
  }
  for (const [k, d] of Object.entries(dims)) {
    if (!d.hasData) continue;
    if (pending.scale[k] && d.concern > 22) d.concern = Math.min(Math.max(d.concern, 90), 22 + (d.concern - 22) * pending.scale[k]);
    if (pending.floor[k]) d.concern = Math.max(d.concern, pending.floor[k]);
    if (pending.cap[k]) d.concern = Math.min(d.concern, pending.cap[k]);
    d.concern = Math.max(0, Math.min(100, d.concern));
  }
  return fired;
}
function fillTpl(s, fmt) { return s.replace(/\{(\w+)\}/g, (_, k) => (fmt[k] != null ? fmt[k] : '—')); }

// ---------------------------------------------------------------- main
function run(allAnswers, meta = {}) {
  const r = route(allAnswers);
  const { persona } = r;
  const get = makeGetter(r.answers, persona);
  const specialty = get.opt('Q03');
  const model = persona === 'SO' ? salonModel(get) : individualModel(get, persona, specialty);
  const { sig, unknowns, push } = collectSignals(r, get);

  const metrics = {
    U: model.inputs.U, leakRate: model.leakRate, rphBooked: model.rphBooked, rentShare: model.rentShare, dbSize: get.n('Q28', 'count'),
    lostHours: model.lostHours, inquiriesMo: model.inquiriesMo, unknowns, F: get.n('Q25'), conv: get.n('Q20'),
    s: get.n('Q51'), empty: model.empty, chairUtil: model.chairUtil, retailShare: model.retailShare, newMo: get.n('Q13'),
  };
  const fmt = {
    U: pct(metrics.U), rphBooked: metrics.rphBooked != null ? money(metrics.rphBooked) : null, rentShare: pct(metrics.rentShare),
    lostHours: metrics.lostHours != null ? num(metrics.lostHours, 1) : null, F10: metrics.F != null ? Math.round(metrics.F * 10) : null,
    conv10: metrics.conv != null ? Math.round(metrics.conv * 10) : null, empty: metrics.empty, db: metrics.dbSize != null ? num(metrics.dbSize) : null,
  };
  const ctx = { persona, get, model, metrics, fmt };
  derivedSignals(ctx, push);

  const dims = scoreDims(sig);
  const state = { tags: new Set(), notes: {}, impact: {}, dontBuy: [], suppress: new Set(), demote: new Set(), gateDemand: false };
  const firedA = applyRules('answers', ctx, dims, state);
  const firedB = applyRules('dims', ctx, dims, state);

  // statuses
  const dimResults = {};
  for (const def of T.DIMENSIONS) {
    if (!def.personas.includes(persona)) continue;
    const d = dims[def.id];
    const label = (def.labelBy && def.labelBy[persona]) || def.label;
    if (!d) { dimResults[def.id] = { id: def.id, label, group: def.group, status: 'NOT_PROBED', statusLabel: 'Not probed', concern: null, conf: 0, notes: state.notes[def.id] || [] }; continue; }
    const conf = d.hasData ? Math.min(1, d.confRaw / def.confNeeded) : 0;
    const st = statusFor(d.concern, conf, d.hasData);
    dimResults[def.id] = {
      id: def.id, label, group: def.group, status: st.key, statusLabel: st.label,
      concern: d.concern != null ? Math.round(d.concern) : null, base: d.base != null ? Math.round(d.base) : null, conf: Math.round(conf * 100) / 100,
      unknown: d.unknown, notes: state.notes[def.id] || [],
      evidence: d.signals.filter((s) => s.ev && s.level !== 'U' && s.level >= 1).sort((a, b) => b.level - a.level || b.weight - a.weight).map((s) => s.ev),
      positives: d.signals.filter((s) => s.level !== 'U' && s.level <= 0).map((s) => s.label).filter(Boolean),
      signals: d.signals.map((s) => ({ src: s.src, level: s.level, weight: Math.round((s.weight || 0) * 100) / 100 })),
    };
  }
  // dims with only "not sure" answers: insufficient information
  for (const d of Object.values(dimResults)) if (d.status === 'INSUFFICIENT' && !d.notes.length && d.unknown) d.notes.push('You weren’t sure about this one — worth measuring.');

  const top = selectTop(persona, dimResults, state);
  const tags = state.tags;
  if (!top.filter((t) => !t.refinement).length) tags.add('HEALTHY');
  const working = selectWorking(persona, dimResults, state, top);
  const interventions = top.map((t) => ({ dim: t.id, items: pickInterventions(t.id, persona, ctx, state) }));
  finalizeDontBuy(persona, state, dimResults, tags);

  return {
    version: VERSION, persona, rawPersona: allAnswers.Q01, meta,
    shown: r.shown, answers: r.answers, questionCount: r.shown.length,
    model, metrics, fmt, dims: dimResults, tags: [...tags], firedRules: [...firedA, ...firedB],
    top, working, interventions, dontBuy: state.dontBuy.slice(0, 3), gateDemand: state.gateDemand, unknowns,
  };
}

function selectTop(persona, dimResults, state) {
  const impactP = T.DIM_IMPACT[persona] || {};
  const scored = Object.values(dimResults)
    .filter((d) => d.concern != null && d.conf >= T.MIN_CONFIDENCE && !state.demote.has(d.id))
    .map((d) => ({ ...d, priority: d.concern * (impactP[d.id] || 0.6) * (state.impact[d.id] || 1) * (0.55 + 0.45 * d.conf) }));
  const pool = scored.filter((d) => ['OPPORTUNITY', 'HIGH_PRIORITY'].includes(d.status));
  const picked = [];
  const groupCount = {};
  // dimensions that describe the same mechanism don't both take a top slot
  const PAIRS = [['ACQ', 'UTIL'], ['CXL', 'UTIL'], ['DISC', 'REP'], ['CONV', 'DIGITAL'], ['CHAIR_UTIL', 'RECRUIT']];
  const partner = (id) => PAIRS.filter((p) => p.includes(id)).map((p) => p.find((x) => x !== id));
  const take = (list, refinement) => {
    let cand = list.slice();
    while (picked.length < 3 && cand.length) {
      cand.forEach((c) => (c.rank = c.priority * Math.pow(0.8, groupCount[c.group] || 0) * (partner(c.id).some((p) => picked.find((x) => x.id === p)) ? 0.75 : 1)));
      cand.sort((a, b) => b.rank - a.rank);
      const c = cand.shift();
      picked.push({ ...c, refinement });
      groupCount[c.group] = (groupCount[c.group] || 0) + 1;
    }
  };
  take(pool, false);
  if (picked.length < 3) take(scored.filter((d) => d.status === 'WATCH' && !picked.find((p) => p.id === d.id)), true);
  // a healthy business still gets honest secondary refinements — never a manufactured crisis
  const gated = state.gateDemand ? ['ACQ', 'DISC', 'BRAND', 'REF'] : [];
  if (picked.length < 2) take(scored.filter((d) => d.status === 'HEALTHY' && d.concern >= 15 && !gated.includes(d.id) && !picked.find((p) => p.id === d.id)).map((d) => ({ ...d })), true);
  while (picked.filter((p) => p.refinement).length > 2 && picked.length > 2) picked.pop();
  return picked;
}

function selectWorking(persona, dimResults, state, top) {
  const impactP = T.DIM_IMPACT[persona] || {};
  const list = Object.values(dimResults)
    .filter((d) => ['STRONG', 'HEALTHY'].includes(d.status) && !top.find((t) => t.id === d.id))
    .sort((a, b) => (a.status === 'STRONG' ? 0 : 1) - (b.status === 'STRONG' ? 0 : 1) || (impactP[b.id] || 0.5) - (impactP[a.id] || 0.5));
  return list.slice(0, 4);
}

function pickInterventions(dimId, persona, ctx, state) {
  const out = [];
  for (const iv of INTERVENTIONS) {
    if (!iv.dims.includes(dimId) || !iv.personas.includes(persona)) continue;
    if (state.suppress.has(iv.id)) continue;
    if (iv.demandSide && state.gateDemand) continue;
    if (iv.when && !evalCond(iv.when, { ...ctx, tags: state.tags })) continue;
    out.push(iv);
  }
  // primary dimension match first, then lower effort
  out.sort((a, b) => (a.dims[0] === dimId ? 0 : 1) - (b.dims[0] === dimId ? 0 : 1) || a.effort - b.effort);
  // prerequisites come before what depends on them
  const ids = out.map((x) => x.id);
  out.forEach((iv) => iv.prereq.forEach((p) => { if (!ids.includes(p) && INT[p] && INT[p].personas.includes(persona)) { out.unshift(INT[p]); ids.unshift(p); } }));
  return out.slice(0, 3).map((x) => ({ id: x.id, name: x.name, explain: x.explain }));
}

function finalizeDontBuy(persona, state, dims, tags) {
  state.dontBuy = state.dontBuy.filter((x) => DONT_BUY[x.id] && DONT_BUY[x.id].personas.includes(persona)).map((x) => ({ ...x, title: DONT_BUY[x.id].title }));
  if (tags.has('HEALTHY') && !state.dontBuy.find((x) => x.id === 'marketing_overhaul'))
    state.dontBuy.unshift({ id: 'marketing_overhaul', title: DONT_BUY.marketing_overhaul.title, reason: 'The fundamentals are working. Changing several things at once risks breaking what works; refine one thing at a time instead.', rule: 'R08' });
  if (!state.dontBuy.length) {
    const fallback = persona === 'SO' ? { id: 'salon_ads', reason: 'Until the priorities above are addressed, extra customers would land in the same system — I’d fix the system first.' } : { id: 'ads', reason: 'Until the priorities above are addressed, paid demand would land in the same leaks. I’d fix those first.' };
    state.dontBuy.push({ ...fallback, title: DONT_BUY[fallback.id].title, rule: 'fallback' });
  }
}

module.exports = { run, route, evalCond, followUps, QMAP, VERSION, resolveText, optionsFor, shouldAsk, makeGetter, resolvePersona, SEQUENCE_DEFAULT, SEQUENCE_SO };
