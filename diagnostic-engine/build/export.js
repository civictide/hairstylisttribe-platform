// Exports the matrix, maps, rules and simulation results as one JSON blob for the inspection page.
const fs = require('fs');
const path = require('path');
const T = require('../engine/taxonomy');
const { QUESTIONS, SEQUENCE_DEFAULT, SEQUENCE_SO } = require('../engine/questions');
const { INTERVENTIONS, DONT_BUY } = require('../engine/interventions');
const { RULES } = require('../engine/rules');
const { followUps, QMAP, VERSION } = require('../engine/engine');
const sims = require('../sim/sims.json');

const short = (s) => (s.length > 34 ? s.slice(0, 32) + '…' : s);
function optLabel(qid, row, v) {
  const q = QMAP[qid];
  if (!q) return v;
  const node = row ? q.rows.find((r) => r.id === row) : q;
  const all = [...(node.options || []), ...Object.values(node.optionsBy || {}).flat()];
  const o = all.find((x) => x.v === v);
  return o ? short(o.label) : v;
}
function condText(c) {
  if (!c) return 'Always (core for listed personas)';
  if (c.all) return c.all.map((x) => wrap(x)).join(' AND ');
  if (c.any) return c.any.map((x) => wrap(x)).join(' OR ');
  if (c.not) return 'NOT ' + wrap(c.not);
  if (c.persona) return `persona is ${c.persona.join('/')}`;
  if (c.tag) return `tag ${c.tag}`;
  const cmp = ['gte', 'lte', 'gt', 'lt'].filter((k) => c[k] != null).map((k) => `${{ gte: '≥', lte: '≤', gt: '>', lt: '<' }[k]} ${c[k]}`).join(' ');
  if (c.m) return `${c.m} ${cmp}`;
  if (c.dim) return `${c.dim} concern ${cmp}`;
  const ref = c.q + (c.row ? '.' + c.row : '');
  if (c.has) return `${ref} includes “${optLabel(c.q, c.row, c.has)}”`;
  if (c.hasAny) return `${ref} includes any of “${c.hasAny.map((v) => optLabel(c.q, c.row, v)).join('”, “')}”`;
  if (c.countLte != null) return `${ref} has ≤ ${c.countLte} selected`;
  if (c.rowLt) return `${c.q}.${c.rowLt[0]} < ${c.q}.${c.rowLt[1]}`;
  if (c.in) return `${ref} = “${c.in.map((v) => optLabel(c.q, c.row, v)).join('” or “')}”`;
  return `${ref} ${cmp}`;
}
const wrap = (x) => (x.all || x.any ? `(${condText(x)})` : condText(x));

const fu = followUps();
const textOf = (t) => (typeof t === 'string' ? { default: t } : t);
const questions = QUESTIONS.map((q) => ({
  id: q.id, domain: q.domain, text: textOf(q.text), help: q.help || null, personas: q.personas, core: !!q.core, coreBy: q.coreBy || null,
  type: q.type, weight: q.weight, conf: q.conf, trigger: q.trigger ? condText(q.trigger) : null, triggerText: q.trigger_text || null,
  options: q.options || null, optionsBy: q.optionsBy || null,
  rows: q.rows ? q.rows.map((r) => ({ id: r.id, label: textOf(r.label), type: r.type || 'single', options: r.options || null, optionsBy: r.optionsBy || null, weight: r.weight })) : null,
  followUps: fu[q.id], dims: q.dims, interventions: q.interventions, tests: q.tests, healthy: q.healthy, warning: q.warning, critical: q.critical,
  interpretation: q.interpretation, reasoning: q.reasoning, model: q.model || null,
}));

// which questions feed each dimension (via option signals)
const feeds = {};
QUESTIONS.forEach((q) => {
  const nodes = q.type === 'composite' ? q.rows : [q];
  nodes.forEach((n) => [...(n.options || []), ...Object.values(n.optionsBy || {}).flat()].forEach((o) => Object.keys(o.sig || {}).forEach((d) => { (feeds[d] = feeds[d] || new Set()).add(q.id); })));
});
const DERIVED = {
  ACQ: 'Demand vs open capacity (U, new clients/month); stylist books full (owners)', CXL: 'Leakage rate = late cancels ÷ scheduled; effective utilization after leakage',
  TICKET: 'Revenue per booked hour (calibration placeholders: ≥$110 strong · $80 healthy · $60 watch · $45 warning · below critical)',
  UTIL: 'Rent as share of service revenue', REACT: '700+ past clients with no outreach', CHAIR_UTIL: 'Producing ÷ total stations', RETAIL: 'Salon retail ÷ service revenue',
  OPS: 'Count of per-stylist metrics visible', STYLIST_PROD: 'Per-stylist visibility', OWNER_DEP: 'Salon-independent share of revenue', FIN: 'Count of key numbers known; per-stylist visibility (owners)',
};
const dimensions = T.DIMENSIONS.map((d) => ({
  ...d, feeds: [...(feeds[d.id] || [])].sort(), derived: DERIVED[d.id] || null,
  rules: RULES.filter((r) => JSON.stringify(r.effects).includes(`"${d.id}"`)).map((r) => r.id),
  interventions: INTERVENTIONS.filter((i) => i.dims.includes(d.id)).map((i) => i.id),
  impact: Object.fromEntries(Object.entries(T.DIM_IMPACT).map(([p, m]) => [p, m[d.id] ?? null])),
}));
const interventions = INTERVENTIONS.map((i) => ({ ...i, when: i.when ? condText(i.when) : null }));
const rules = RULES.map((r) => ({ id: r.id, pass: r.pass, name: r.name, why: r.why, when: condText(r.when), effects: r.effects }));

const data = {
  version: VERSION, generated: new Date().toISOString().slice(0, 10),
  personas: T.PERSONAS, groups: T.GROUPS, levels: T.LEVELS, statuses: T.STATUSES, minConfidence: T.MIN_CONFIDENCE,
  questions, sequence: { default: SEQUENCE_DEFAULT, SO: SEQUENCE_SO }, dimensions, interventions, dontBuy: DONT_BUY, rules,
  sims: sims.map((s) => ({ scenario: s.scenario, checks: s.checks, persona: s.result.persona, questionCount: s.result.questionCount, tags: s.result.tags, firedRules: s.result.firedRules, report: s.report, admin: s.admin })),
};
fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../dist/data.json'), JSON.stringify(data));
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../dist/beauty-diagnostic-matrix.html'), tpl.replace('/*__DATA__*/null', JSON.stringify(data).replace(/</g, '\\u003c')));
console.log('wrote dist/beauty-diagnostic-matrix.html', (fs.statSync(path.join(__dirname, '../dist/beauty-diagnostic-matrix.html')).size / 1024).toFixed(0) + ' KB');
