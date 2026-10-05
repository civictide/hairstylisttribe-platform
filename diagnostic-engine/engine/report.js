// Beauty Business Growth Diagnostic — FINAL REPORT + ADMIN RECORD
// Report order (fixed): Here’s what I would look at first → Your business model → Your business as an equation
// → Top 3 opportunities → What appears to be working → What I wouldn’t spend money on right now
// → If this were my business… → Want to walk through this together? (Morning / Afternoon)

const T = require('./taxonomy');
const { QMAP, resolveText, optionsFor } = require('./engine');
const { money, pct, num } = require('./model');

const SEVERITY = { HIGH_PRIORITY: 5, OPPORTUNITY: 4, WATCH: 3, HEALTHY: 2, STRONG: 1 };
const worst = (dims, ids) => {
  const list = ids.map((i) => dims[i]).filter((d) => d && SEVERITY[d.status]);
  if (!list.length) return { status: 'INSUFFICIENT', statusLabel: 'Not enough information' };
  return list.sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])[0];
};

const GOAL_LABEL = {
  more_new: 'more new clients', social: 'a bigger social media following', earn_more: 'to earn more from the clients you already have', come_back: 'clients coming back more consistently',
  fewer_cxl: 'fewer cancellations and no-shows', raise_prices: 'to feel confident raising prices', fewer_hours: 'the same income in fewer hours', organized: 'less admin and more organization',
  hire: 'to hire or keep good stylists', step_back: 'to step back from your own chair', profit: 'a more profitable salon',
};
const GOAL_DIMS = {
  more_new: ['ACQ', 'DISC'], social: ['BRAND', 'ACQ'], earn_more: ['TICKET', 'PRICE', 'RETAIL', 'MIX'], come_back: ['RET', 'REBOOK', 'REACT'],
  fewer_cxl: ['CXL'], raise_prices: ['PRICE'], fewer_hours: ['PRICE', 'MIX', 'TICKET'], organized: ['AUTO', 'FIN', 'OPS'],
  hire: ['RECRUIT', 'STAFF_RET', 'CHAIR_UTIL'], step_back: ['OWNER_DEP'], profit: ['STYLIST_PROD', 'OPS', 'CHAIR_UTIL', 'RETAIL', 'PRICE'],
};

const STEP = {
  ACQ: { default: 'Build one or two dependable sources of new clients that already produce returning clients.', CS: 'Turn the salon’s first-time clients into your request clients — book them with you by name before they leave.' },
  DISC: { default: 'Fix how you show up on Google: complete profile, right categories, real photos, and reviews.' },
  BRAND: { default: 'Decide what you want to be known for and make your profile and portfolio say it.', CS: 'Pick a specialty to be known for inside the salon, and make it visible in your work and your photos.' },
  CONV: { default: 'Answer every inquiry fast with a direct booking link and visible prices.' },
  UTIL: { default: 'Reshape your schedule around when demand actually exists.' },
  CXL: { default: 'Protect booked time: deposits or card on file, automated confirmations, and a waitlist.', CS: 'Confirm your own appointments personally, keep a short list of clients who want earlier times, and raise the salon’s policy with your manager.' },
  REBOOK: { default: 'Fix rebooking: recommend and book the next visit before every client leaves.' },
  RET: { default: 'Build a second-visit system for every new client.', SO: 'Make retention a salon system: salon-owned follow-up, overdue outreach, and retention tracked by stylist.' },
  REACT: { default: 'Reactivate past clients who have gone quiet.' },
  PRICE: { default: 'Review pricing service by service against your demand and time — then raise it.', CS: 'Learn exactly what moves you to the next level and bring your numbers to that conversation.' },
  TICKET: { default: 'Raise revenue per appointment with add-ons that genuinely improve results.' },
  RETAIL: { default: 'Make a specific home-care recommendation part of every relevant visit.', SO: 'Make the home-care recommendation a checkout standard, tracked by stylist.' },
  MIX: { default: 'Work out what each service earns per hour and stop letting low-value work fill prime time.' },
  REF: { default: 'Ask your best clients for referrals — specifically and consistently.' },
  REP: { default: 'Ask every happy client for a Google review, automatically.' },
  DIGITAL: { default: 'Create one link that shows your work, your prices and books immediately.' },
  AUTO: { default: 'Turn on the reminders and follow-ups your booking software already has.' },
  FIN: { default: 'Start tracking five numbers monthly so the next decision is easier.' },
  CHAIR_UTIL: { default: 'Decide what each empty station should be — a new stylist, a renter, or something else.' },
  STYLIST_PROD: { default: 'See each stylist’s numbers weekly — booked %, revenue, rebooking — and coach to them.' },
  RECRUIT: { default: 'Build a recruiting pipeline that runs before you need someone.' },
  STAFF_RET: { default: 'Give strong stylists a visible path that beats leaving for a suite.' },
  LEAD_DIST: { default: 'Define how inquiries are answered and how new clients are matched to stylists.' },
  OWNER_DEP: { default: 'Set a target for how much revenue comes from your chair in 12 months, and plan the transition.' },
  OPS: { default: 'Write down the five routines that matter most and make them the standard.' },
};
const stepFor = (dim, persona) => (STEP[dim] && (STEP[dim][persona] || STEP[dim].default)) || '';

const WHY_OVERRIDE = {
  CS: {
    PRICE: 'On commission, your income rises when your level, your ticket or your retail rises. If none of those have moved, your pay hasn’t either — however busy you are.',
    ACQ: 'Inside a salon, the clients you’ll keep are the ones who ask for you by name. Assigned clients come and go with the front desk.',
  },
  BR: { UTIL: 'Your rent is the same whether the chair is full or empty, so every unbooked hour is paid for and earns nothing.' },
  SR: { UTIL: 'A suite carries the highest fixed cost of any solo model. Every unbooked hour is rent you’ve paid for nothing.' },
  IP: { REBOOK: 'Your clients come back every few weeks. When they don’t leave with a date, a 3-week client easily becomes a 6-week client — half the visits from the same person.', CXL: 'Your appointments are long and your clients are few per day. One no-show can be a large share of a day’s income.' },
  SO: { ACQ: 'Customer demand only becomes revenue if there are productive stylists to serve it.' },
};

function headlineFor(top, tags, persona) {
  const main = top.filter((t) => !t.refinement);
  if (!main.length) return { headline: 'The fundamentals look strong.', sub: 'Nothing here looks broken. What’s left are refinements, not fixes.' };
  const g = main[0].group;
  if (tags.includes('CS_BUILDING')) return { headline: 'The opportunity is turning salon clients into your clients.', sub: 'You don’t control the salon’s marketing. You do control whether the clients it sends you become clients who ask for you.' };
  if (tags.includes('SUPPLY_CONSTRAINT')) return { headline: 'The constraint looks like stylists, not customers.', sub: 'Demand is there. The salon needs more productive chairs — and less dependence on any one of them.' };
  if (tags.includes('ACQ_NOT_CONSTRAINT')) return { headline: 'You don’t appear to have a client-acquisition problem.', sub: 'Your time is already spoken for. The bigger opportunity is what each appointment and each hour earns.' };
  if (tags.includes('NEEDS_DEMAND') && g === 'demand') return { headline: 'You genuinely appear to need more of the right clients.', sub: 'Clients who find you tend to stay. The gap is how many find you in the first place.' };
  if (persona === 'SO' && g === 'owner') return { headline: 'The salon still runs through your chair.', sub: 'The next stage of growth depends on revenue and decisions that don’t require you.' };
  if (persona === 'SO' && g === 'people') return { headline: 'The constraint is people and chairs.', sub: 'The salon’s output depends on how many productive stylists it has — not on how many customers it advertises to.' };
  const H = {
    retention: { headline: 'You’re earning first visits. The opportunity is the second and third.', sub: 'Too much of the demand you’ve already earned doesn’t turn into a recurring book.' },
    capacity: { headline: 'Your schedule loses time after clients book.', sub: 'Before adding demand, I’d protect the appointments you’ve already filled.' },
    conversion: { headline: 'People are reaching out. Too many don’t end up booked.', sub: 'The demand exists. The path from “interested” to “booked” is where it leaks.' },
    demand: { headline: 'You genuinely appear to need more of the right clients.', sub: 'There’s room in your schedule, and the inflow isn’t enough to fill it.' },
    monetization: { headline: 'The opportunity is what each appointment earns.', sub: 'Revenue per appointment and per hour is where I’d look first.' },
    systems: { headline: 'You’re working without the numbers that would guide you.', sub: 'The first step is seeing the business clearly.' },
    people: { headline: 'The constraint is people and chairs.', sub: '' },
    owner: { headline: 'The salon still runs through your chair.', sub: '' },
  };
  return H[g] || { headline: 'Here’s where the leverage is.', sub: '' };
}

function beliefCheck(run, top) {
  const goal = run.answers.Q05;
  if (!goal) return null;
  const goalLabel = GOAL_LABEL[goal];
  const gd = GOAL_DIMS[goal] || [];
  const main = top.filter((t) => !t.refinement);
  if (!main.length) return { kind: 'healthy', text: `You said the change you most want is ${goalLabel}. The fundamentals look strong, so treat that as a refinement rather than a fix.` };
  if (main.some((t) => gd.includes(t.id))) {
    const hit = main.find((t) => gd.includes(t.id));
    return { kind: 'confirm', text: `You said the change you most want is ${goalLabel}. The evidence agrees: ${hit.label.toLowerCase()} is one of the biggest opportunities below.` };
  }
  const f = run.fmt;
  const tags = run.tags;
  let reason;
  if (['more_new', 'social'].includes(goal) && tags.includes('SUPPLY_CONSTRAINT')) reason = 'Your stylists are already mostly 80%+ booked. More customers would wait for stylists you don’t have yet.';
  else if (['more_new', 'social'].includes(goal) && tags.includes('ACQ_NOT_CONSTRAINT')) reason = `You’re already about ${f.U} booked. More clients would be competing for time you don’t have.`;
  else if (['more_new', 'social'].includes(goal) && tags.includes('LEAKY') && f.F10 != null) reason = `About ${f.F10} out of 10 first-time clients come back. More new clients would mostly mean more first visits that don’t turn into regulars.`;
  else if (['more_new', 'social'].includes(goal) && tags.includes('CONVERSION_FIRST')) reason = `People already reach out — about ${f.conv10} of 10 end up booked. The gap is after they find you.`;
  else if (tags.includes('LEAKAGE') && f.lostHours) reason = `Late cancellations remove about ${f.lostHours} hours a week from a schedule you’ve already filled.`;
  else reason = `The bigger lever appears to be ${main[0].label.toLowerCase()}.`;
  return { kind: 'challenge', text: `You said the change you most want is ${goalLabel}. Based on your answers, that may not be where the biggest opportunity is. ${reason}` };
}

function equation(run) {
  const { model: m, dims, persona, fmt } = run;
  const d = (ids) => worst(dims, ids);
  const f = (label, value, ids, extra) => ({ factor: label, value: value || '—', ...pick(d(ids)), ...(extra || {}) });
  const pick = (x) => ({ status: x.status, statusLabel: x.statusLabel });
  if (m.kind === 'salon') {
    const i = m.inputs;
    return {
      formula: 'Demand × People × Chairs × Productivity × Retention × Systems = Salon output',
      factors: [
        f('Demand', i.newMo != null ? `≈ ${num(i.newMo)} new clients/month` : null, ['ACQ', 'DISC', 'REP']),
        f('People', i.C != null ? `${i.C} commission · ${i.Rn || 0} renting${i.tenure != null ? ` · strong stylists stay ${i.tenure >= 5 ? '5+' : num(i.tenure, 1)} yrs` : ''}` : null, ['RECRUIT', 'STAFF_RET']),
        f('Chairs', i.S != null ? `${i.P} of ${i.S} producing` : null, ['CHAIR_UTIL']),
        f('Productivity', run.answers.Q48 ? optionLabel('Q48', run.answers.Q48, persona) : null, ['STYLIST_PROD', 'TICKET', 'RETAIL']),
        f('Retention', i.F != null ? `≈ ${Math.round(i.F * 10)} of 10 first-timers return` : null, ['RET', 'REBOOK']),
        f('Systems', [m.independentShare != null ? `${pct(m.independentShare)} of revenue without your chair` : null].filter(Boolean).join(' · ') || null, ['OPS', 'LEAD_DIST', 'OWNER_DEP']),
      ],
      output: m.salonGross != null ? `≈ ${money(m.salonGross)}/week in services and rent` : 'Not enough numbers to estimate',
    };
  }
  const i = m.inputs;
  return {
    formula: 'Demand × Conversion × Capacity utilization × Revenue per appointment × Retention = Economic output',
    factors: [
      f('Demand', i.newMo != null ? `≈ ${num(i.newMo)} new clients/month` : null, ['ACQ', 'DISC', 'REF']),
      persona === 'CS'
        ? { factor: 'Conversion', value: 'Handled by the salon', status: 'NA', statusLabel: 'Salon-controlled' }
        : f('Conversion', i.conv != null ? `≈ ${Math.round(i.conv * 10)} of 10 inquiries book` : run.answers.Q18 ? optionLabel('Q18', run.answers.Q18, persona) : null, ['CONV', 'DIGITAL']),
      f('Capacity utilization', [i.U != null ? `${pct(i.U)} booked` : null, m.leakRate != null ? `${pct(m.leakRate)} late-cancel` : null].filter(Boolean).join(' · ') || null, ['UTIL', 'CXL']),
      f('Revenue per appointment', [i.T != null ? `${money(i.T)} ticket` : null, m.rphBooked != null ? `${money(m.rphBooked)}/booked hr` : null].filter(Boolean).join(' · ') || null, ['PRICE', 'TICKET', 'MIX', 'RETAIL']),
      f('Retention', [i.F != null ? `${Math.round(i.F * 10)}/10 return` : null, i.prebook != null ? `${pct(i.prebook)} prebook` : null].filter(Boolean).join(' · ') || null, ['RET', 'REBOOK']),
    ],
    output: m.weeklyService != null ? `≈ ${money(m.weeklyService)}/week in services${m.ceilingShare != null ? ` · ${pct(Math.min(1, m.ceilingShare))} of your practical ceiling at current prices` : ''}` : 'Not enough numbers to estimate',
  };
}

function optionLabel(qid, v, persona, row) {
  const qq = QMAP[qid];
  if (!qq) return String(v);
  const node = row ? qq.rows.find((r) => r.id === row) : qq;
  if (node.type === 'count') return String(v);
  const opts = optionsFor(node, persona);
  if (Array.isArray(v)) return v.map((x) => (opts.find((o) => o.v === x) || {}).label || x).join(', ');
  return (opts.find((o) => o.v === v) || {}).label || String(v);
}

const CAVEAT = 'before considering changes in client behavior, costs or capacity.';
function moneyFor(dim, run) {
  const m = run.model;
  const i = m.inputs;
  if (m.kind === 'salon') {
    if (['CHAIR_UTIL', 'RECRUIT'].includes(dim) && m.empty) {
      const out = [];
      if (m.emptyValueCommission) out.push({ text: `Each empty station filled by a stylist producing like your current team would represent roughly ${money(m.emptyValueCommission / m.empty)} a week in gross services — ${m.empty} empty stations ≈ ${money(m.emptyValueCommission)}/week`, math: `${m.empty} × ${money(i.Vs)}${m.adj && m.adj < 1 ? ` × ${pct(m.adj)}` : ''}`, caveat: 'before commission, product costs and the months it takes a new stylist to build a book.' });
      if (m.emptyValueRent) out.push({ text: `Renting the empty stations instead would represent about ${money(m.emptyValueRent)} a week`, math: `${m.empty} × ${money(i.rent)}`, caveat: 'with no ramp-up, but no service revenue for the salon.' });
      return out;
    }
    if (dim === 'STYLIST_PROD' && m.adj && m.adj < 1 && m.commissionRev) {
      const gain = m.commissionRev * (0.9 / m.adj - 1);
      return [{ text: `If the average commission stylist moved from about ${pct(m.adj)} to about 90% of a busy stylist’s production, that would represent roughly ${money(gain)} more a week in services`, math: `${money(m.commissionRev)} × (90% ÷ ${pct(m.adj)} − 1)`, caveat: CAVEAT }];
    }
    if (dim === 'RETAIL' && m.totalService && i.retailWk != null) {
      const target = m.totalService * 0.08;
      if (target > i.retailWk) return [{ text: `Retail at 8% of service revenue would be about ${money(target)} a week, versus about ${money(i.retailWk)} now`, math: `8% × ${money(m.totalService)}`, caveat: 'in sales, before product cost. 8% is an illustrative target, not a benchmark claim.' }];
    }
    if (dim === 'OWNER_DEP' && m.independentShare != null) return [{ text: `Today about ${pct(m.independentShare)} of salon revenue (≈ ${money(m.independent)}/week) happens without your chair. Your chair is about ${money(m.ownerRev)}/week`, math: 'Commission revenue + rental income vs. your share', caveat: 'This is the number to move, not a loss figure.' }];
    return [];
  }
  const A = i.A, Tk = i.T;
  if (dim === 'PRICE' && A && Tk) {
    return [{ text: `An 8% price increase at your current volume would represent approximately ${money(A * Tk * 0.08)} more per week`, math: `${num(A)} visits × ${money(Tk * 0.08)}`, caveat: `${CAVEAT} At 8% higher prices, you could see about 7% fewer visits and still earn the same in fewer hours.` }];
  }
  if (dim === 'TICKET' && A && Tk) {
    return [{ text: `A 10% improvement in average ticket at your current appointment volume would represent approximately ${money(A * Tk * 0.1)} in additional weekly revenue`, math: `${num(A)} visits × ${money(Tk * 0.1)}`, caveat: CAVEAT }];
  }
  if (dim === 'CXL' && m.lostAppts && Tk) {
    return [{ text: `Recovering half of the late cancellations that currently go unfilled would represent approximately ${money(m.lostAppts * 0.5 * Tk)} a week`, math: `${num(m.lostAppts, 1)} unfilled × 50% × ${money(Tk)}`, caveat: CAVEAT }];
  }
  if (['UTIL', 'ACQ', 'DISC'].includes(dim) && m.openHours && m.rphBooked && i.U < 0.82) {
    return [{ text: `Filling a quarter of your open hours at your current revenue per hour would represent approximately ${money(m.openHours * 0.25 * m.rphBooked)} a week`, math: `${num(m.openHours)} open hrs × 25% × ${money(m.rphBooked)}/hr`, caveat: CAVEAT }];
  }
  if (dim === 'RET' && m.regularValue && !m.eventBased) {
    const out = [{ text: `One more first-time client who becomes a regular represents roughly ${money(m.regularValue)} a year at your current ticket`, math: `${num(m.visitsPerYear, 1)} visits/yr × ${money(Tk + (m.retailPerVisit || 0))}`, caveat: 'assuming they stay a full year.' }];
    if (i.newMo) out.push({ text: `If 2 more of every 10 first-timers returned, that would be about ${num(i.newMo * 0.2, 1)} more regulars every month`, math: `${num(i.newMo)} new/month × 20%`, caveat: '' });
    return out;
  }
  if (dim === 'REBOOK' && i.I && Tk && !m.eventBased) {
    const lost = 52 / i.I - 52 / (i.I * 1.5);
    return [{ text: `A client who drifts from every ${num(i.I, 1)} weeks to every ${num(i.I * 1.5, 1)} weeks makes about ${num(lost, 1)} fewer visits a year — about ${money(lost * Tk)} at your current ticket`, math: `52 ÷ ${num(i.I, 1)} − 52 ÷ ${num(i.I * 1.5, 1)}`, caveat: 'per client. Prebooking is what keeps the cycle from stretching.' }];
  }
  if (dim === 'REACT' && i.dbSize && Tk) {
    return [{ text: `If 5% of about ${num(i.dbSize)} past clients booked one visit, that would represent roughly ${money(i.dbSize * 0.05 * Tk)}`, math: `${num(i.dbSize)} × 5% × ${money(Tk)}`, caveat: 'one-time, before any of them become regulars again. 5% is illustrative.' }];
  }
  if (dim === 'RETAIL' && A) {
    return [{ text: `If one in five clients took home a $28 product, that would represent approximately ${money(A * 0.2 * 28)} a week in retail sales`, math: `${num(A)} visits × 20% × $28 (illustrative)`, caveat: 'before product cost.' }];
  }
  return [];
}

function buildReport(run) {
  const persona = run.persona;
  const P = T.PERSONAS[persona];
  const { headline, sub } = headlineFor(run.top, run.tags, persona);
  const used = new Set();
  const usedMoney = new Set();
  const top = run.top.map((t, idx) => {
    const def = T.DIM[t.id];
    const d = run.dims[t.id];
    const all = [...(d.evidence || [])].filter((x, k, arr) => arr.indexOf(x) === k);
    let noticed = all.filter((x) => !used.has(x)).slice(0, 3);
    if (!noticed.length && all.length) noticed = all.slice(0, 1);
    if (t.refinement && t.status !== 'WATCH') noticed = [T.DIM[t.id].healthyText, 'This is a refinement, not a problem to fix.'];
    noticed.forEach((x) => used.add(x));
    const mny = moneyFor(t.id, run).filter((x) => !usedMoney.has(x.text));
    mny.forEach((x) => usedMoney.add(x.text));
    (d.notes || []).forEach((n) => noticed.length < 4 && noticed.push(n));
    return {
      rank: idx + 1, id: t.id, label: t.label, status: t.refinement ? 'WATCH' : t.status,
      statusLabel: t.refinement ? 'Refinement' : t.statusLabel, refinement: t.refinement,
      noticed, whyMatters: (WHY_OVERRIDE[persona] && WHY_OVERRIDE[persona][t.id]) || def.whyMatters,
      investigate: def.investigate, nextStep: stepFor(t.id, persona),
      interventions: (run.interventions.find((x) => x.dim === t.id) || { items: [] }).items,
      money: mny, confidence: d.conf >= 0.7 ? 'Good' : d.conf >= 0.5 ? 'Moderate' : 'Limited',
    };
  });
  const working = run.working.map((d) => ({ id: d.id, label: d.label, status: d.status, statusLabel: d.statusLabel, text: (d.notes && d.notes.find((n) => /Not (your|the) primary constraint/.test(n))) || T.DIM[d.id].healthyText }));
  const main = run.top.filter((t) => !t.refinement);
  const steps = main.map((t) => stepFor(t.id, persona));
  const tags = run.tags;
  if (!main.length) steps.push(...run.top.map((t) => stepFor(t.id, persona)), 'Keep measuring, and revisit in six months.');
  else if (tags.includes('SUPPLY_CONSTRAINT')) steps.push('Only then revisit customer marketing — once new stylists need their books filled.');
  else if (tags.includes('ACQ_NOT_CONSTRAINT') && !main.find((t) => t.group === 'demand')) steps.push('Only then decide whether you need more clients. Right now your schedule says you don’t.');
  else if ((tags.includes('LEAKY') || tags.includes('LEAKAGE') || tags.includes('CONVERSION_FIRST')) && !main.find((t) => t.group === 'demand')) steps.push('Only then evaluate whether additional acquisition is necessary.');
  else if (tags.includes('NEEDS_DEMAND')) steps.push('Keep doing what you’re doing once clients arrive — that part is working.');
  if (tags.includes('CS_CONTROL')) steps.push('Bring your numbers to a conversation with your salon about the things only they control.');

  const em = run.model;
  const summaryBits = [];
  if (em.kind === 'individual') {
    if (em.inputs.U != null) summaryBits.push(`your schedule is about ${pct(em.inputs.U)} booked`);
    if (em.inputs.T != null) summaryBits.push(`a typical visit is about ${money(em.inputs.T)}`);
    if (em.inputs.F != null) summaryBits.push(`about ${Math.round(em.inputs.F * 10)} of 10 first-time clients come back`);
  } else {
    if (em.inputs.S != null) summaryBits.push(`${em.inputs.P} of ${em.inputs.S} stations are producing`);
    if (run.answers.Q48) summaryBits.push(`stylists’ books are ${({ full: 'mostly 80%+ full', mixed: 'mixed', low: 'mostly under 60%', unsure: 'not clearly known' })[run.answers.Q48]}`);
    if (em.inputs.s != null) summaryBits.push(`about ${pct(em.inputs.s)} of service revenue comes from your chair`);
  }
  const summary = summaryBits.length ? `From your answers: ${summaryBits.join(', ')}.` : '';

  return {
    title: main.length ? 'Here’s what I would look at first.' : 'Here’s what I found.',
    headline, sub, summary,
    belief: beliefCheck(run, run.top),
    businessModel: { label: P.label, description: P.description, controls: P.controls, doesNotControl: P.doesNotControl, objective: P.objective, equationNote: P.equationNote },
    equation: equation(run),
    economicModel: { rows: em.rows, assumptions: em.assumptions, flags: em.flags },
    top, working, dontBuy: run.dontBuy, ifThisWere: steps.slice(0, 5),
    cta: { title: 'Want to walk through this together?', body: ['I’ll look at your answers with you, explain what stood out, and help you decide what I’d work on first.', 'If there’s something I can help implement, I’ll explain that too.'], options: ['Morning', 'Afternoon'] },
  };
}

function buildAdmin(run, report, meta = {}) {
  const persona = run.persona;
  const qa = run.shown.map((id) => {
    const qq = QMAP[id];
    const a = run.answers[id];
    let answer = '—';
    if (a != null) {
      if (qq.type === 'composite') answer = qq.rows.map((r) => `${resolveText(r.label, persona)} → ${a[r.id] != null ? optionLabel(id, a[r.id], persona, r.id) : '—'}`).join(' | ');
      else answer = optionLabel(id, a, persona);
    }
    return { id, domain: qq.domain, question: resolveText(qq.text, persona), answer, answered: a != null };
  });
  return {
    prospect: { id: meta.prospectId || null, name: meta.prospectName || null, source: meta.source || null },
    persona: T.PERSONAS[persona].label,
    completion: { shown: qa.length, answered: qa.filter((x) => x.answered).length, complete: qa.every((x) => x.answered) },
    completedAt: meta.completedAt || null,
    callRequested: meta.callRequested || null,
    headline: report.headline,
    belief: report.belief,
    topFindings: report.top.map((t) => ({ rank: t.rank, dimension: t.label, status: t.statusLabel, evidence: t.noticed, interventions: t.interventions.map((i) => i.name) })),
    dimensions: Object.values(run.dims).map((d) => ({ id: d.id, label: d.label, status: d.statusLabel, concern: d.concern, base: d.base, confidence: d.conf, notes: d.notes })),
    recommendedInterventions: report.top.flatMap((t) => t.interventions.map((i) => ({ dimension: t.label, ...i }))),
    healthyAreas: report.working.map((w) => `${w.label} — ${w.statusLabel}`),
    doNotRecommend: report.dontBuy.map((x) => ({ title: x.title, reason: x.reason, rule: x.rule })),
    economicModel: report.economicModel,
    tags: run.tags, rulesFired: run.firedRules, qa,
  };
}

module.exports = { buildReport, buildAdmin, optionLabel };
