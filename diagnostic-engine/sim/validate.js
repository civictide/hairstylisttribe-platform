// Structural validation of the matrix: every reference resolves.
const { QUESTIONS } = require('../engine/questions');
const { INT, INTERVENTIONS } = require('../engine/interventions');
const { RULES } = require('../engine/rules');
const T = require('../engine/taxonomy');
const { QMAP } = require('../engine/engine');

const errs = [];
const optVals = (qid, row) => {
  const q = QMAP[qid];
  if (!q) return null;
  const node = row ? q.rows.find((r) => r.id === row) : q;
  if (!node) return null;
  const all = [...(node.options || []), ...Object.values(node.optionsBy || {}).flat()];
  return new Set(all.map((o) => o.v));
};
function checkCond(c, where) {
  if (!c) return;
  ['all', 'any'].forEach((k) => c[k] && c[k].forEach((x) => checkCond(x, where)));
  if (c.not) checkCond(c.not, where);
  if (c.q) {
    if (!QMAP[c.q]) return errs.push(`${where}: unknown question ${c.q}`);
    const vals = optVals(c.q, c.row);
    if (c.row && !QMAP[c.q].rows.find((r) => r.id === c.row)) errs.push(`${where}: unknown row ${c.q}.${c.row}`);
    [...(c.in || []), ...(c.hasAny || []), ...(c.has ? [c.has] : [])].forEach((v) => vals && !vals.has(v) && errs.push(`${where}: ${c.q}${c.row ? '.' + c.row : ''} has no option '${v}'`));
  }
  if (c.dim && !T.DIM[c.dim]) errs.push(`${where}: unknown dim ${c.dim}`);
}
for (const q of QUESTIONS) {
  q.interventions.forEach((i) => !INT[i] && errs.push(`${q.id}: unknown intervention ${i}`));
  q.dims.forEach((d) => !T.DIM[d] && errs.push(`${q.id}: unknown dim ${d}`));
  checkCond(q.trigger, q.id);
  const nodes = q.type === 'composite' ? q.rows : [q];
  nodes.forEach((n) => [...(n.options || []), ...Object.values(n.optionsBy || {}).flat()].forEach((o) => Object.keys(o.sig || {}).forEach((d) => !T.DIM[d] && errs.push(`${q.id}: option ${o.v} unknown dim ${d}`))));
}
for (const i of INTERVENTIONS) { checkCond(i.when, i.id); i.dims.forEach((d) => !T.DIM[d] && errs.push(`${i.id}: unknown dim ${d}`)); i.prereq.forEach((p) => !INT[p] && errs.push(`${i.id}: unknown prereq ${p}`)); }
for (const r of RULES) { checkCond(r.when, r.id); const e = r.effects; ['scale', 'floor', 'cap', 'impact', 'note'].forEach((k) => Object.keys(e[k] || {}).forEach((d) => !T.DIM[d] && errs.push(`${r.id}: unknown dim ${d}`))); (e.suppress || []).forEach((x) => !INT[x] && errs.push(`${r.id}: unknown intervention ${x}`)); }
// every intervention is reachable from at least one question or dimension
const used = new Set(QUESTIONS.flatMap((q) => q.interventions));
const orphan = INTERVENTIONS.filter((i) => !used.has(i.id)).map((i) => i.id);
console.log(`Questions: ${QUESTIONS.length} · Dimensions: ${T.DIMENSIONS.length} · Interventions: ${INTERVENTIONS.length} · Rules: ${RULES.length}`);
console.log('Interventions not referenced by any question (reachable via dimension only):', orphan.join(', ') || 'none');
if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); process.exit(1); } else console.log('All references resolve.');
