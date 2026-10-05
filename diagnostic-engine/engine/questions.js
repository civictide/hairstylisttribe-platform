// Beauty Business Growth Diagnostic — MASTER QUESTION MATRIX (55 questions)
//
// Signal levels on each option, per dimension:  -1 strong · 0 healthy · 1 watch · 2 warning · 3 critical · 'U' doesn't know
// Trigger DSL (all structured, evaluated against answers given so far; a missing answer makes a leaf false):
//   {q, in:[...]}  {q, gte|lte|gt|lt:n}  {q, row, ...same}  {q, has:'opt'}  {q, hasAny:[...]}  {q, countLte:n}
//   {q, rowLt:['a','b']}  {persona:[...]}  {any:[...]}  {all:[...]}  {not:{...}}
// follow_up_question_ids are generated from these triggers (see engine.js) so the matrix can never disagree with the routing.

const o = (v, label, n, sig, ev) => {
  const x = { v, label };
  if (n !== undefined && n !== null) x.n = n;
  if (sig) x.sig = sig;
  if (ev) x.ev = ev;
  return x;
};
const ALL = ['CS', 'BR', 'SR', 'SO', 'IP'];
const IND = ['CS', 'BR', 'SR', 'IP'];
const SOLO = ['BR', 'SR', 'IP'];
const SOLO_SO = ['BR', 'SR', 'IP', 'SO'];

const Q = [];
const q = (x) => Q.push(x);

// =====================================================================
// 1. BUSINESS MODEL / CAREER STAGE
// =====================================================================
q({
  id: 'Q01', domain: 'Business model', personas: ALL, core: true, type: 'single', weight: 0, conf: 0,
  text: 'Which best describes how you work right now?',
  help: 'This decides which questions make sense for you.',
  options: [
    o('CS', 'Commission or employee stylist', null, null),
    o('BR', 'Booth or chair renter', null, null),
    o('SR', 'Salon suite renter', null, null),
    o('SO', 'Salon owner', null, null),
    o('IP', 'Independent lash, brow, nail, skin or other beauty professional', null, null),
    o('OT', 'Something else', null, null),
  ],
  dims: [], interventions: [],
  tests: 'Business model — which economic equation applies and which levers the person actually controls.',
  healthy: 'n/a (routing)', warning: 'n/a', critical: 'n/a',
  interpretation: 'Sets the business-model description at the top of the report.',
  reasoning: 'Persona routing. A commission stylist does not control salon marketing; an owner is diagnosed on leverage, not their personal book.',
});
q({
  id: 'Q02', domain: 'Business model', personas: ['OT'], core: false, type: 'single', weight: 0, conf: 0,
  trigger: { q: 'Q01', in: ['OT'] }, trigger_text: 'Q01 = Something else',
  text: 'Which is closest to how you work?',
  options: [
    o('IP', 'On my own, by appointment', null, null),
    o('IP2', 'Mobile or on-location', null, null),
    o('SR', 'I rent my own space (not a salon chair)', null, null),
    o('BR', 'In a salon, plus my own clients on the side', null, null),
    o('IP3', 'Mostly education, events or freelance work', null, null),
  ],
  dims: [], interventions: [],
  tests: 'Routes edge cases to the nearest economic model.',
  healthy: 'n/a', warning: 'n/a', critical: 'n/a',
  interpretation: 'Not shown in the report.',
  reasoning: 'Mobile/freelance/educator → IP model; own non-salon space → SR model (fixed overhead); hybrid salon + side clients → BR model (controls own pricing and book).',
});
q({
  id: 'Q03', domain: 'Business model', personas: IND, core: true, type: 'single', weight: 0, conf: 0,
  text: 'What kind of work makes up most of your book?',
  options: [
    o('hair', 'Hair — cut, color and styling', 7),
    o('hair_spec', 'Hair — a specialty (color, extensions, curly, bridal…)', 8),
    o('barber', 'Barbering', 3),
    o('lash', 'Lashes', 3),
    o('brow', 'Brows', 4),
    o('nails', 'Nails', 3),
    o('skin', 'Skin / esthetics', 5),
    o('wax', 'Waxing', 5),
    o('makeup', 'Makeup', 0),
    o('mix', 'A mix of services', 6),
  ],
  dims: [], interventions: ['niche_positioning'],
  model: 'specialty → default visit interval (weeks) if Q26 is skipped; makeup = event-based (rebooking/retention down-weighted).',
  tests: 'Service cycle and how much the business depends on repeat visits.',
  healthy: 'n/a (context)', warning: 'n/a', critical: 'n/a',
  interpretation: 'Used to describe your business and to set the expected time between visits.',
  reasoning: 'Short-cycle work (lash, nails, barbering) makes rebooking and no-show protection unusually valuable. Event-based work (makeup) relies on acquisition and referrals instead.',
});
q({
  id: 'Q04', domain: 'Business model', personas: ['CS', 'SO'], core: true, type: 'single', weight: 0, conf: 0,
  text: { default: 'Which best describes where you are right now?', SO: 'Which best describes where the salon is right now?' },
  options: [
    o('building', 'Still building my clientele'),
    o('growing', 'Growing steadily'),
    o('full', 'Mostly full'),
    o('over', 'Overbooked — more demand than time'),
    o('plateau', 'Busy, but income has plateaued'),
    o('rebuild', 'Rebuilding after a move, break or change'),
    o('unsure', 'Honestly not sure'),
  ],
  dims: [], interventions: [],
  tests: 'Self-perceived stage; compared later with measured utilization and demand.',
  healthy: 'n/a — self-report', warning: '“Plateaued” with high utilization → monetization ceiling', critical: '“Building” with high utilization is a contradiction worth naming',
  interpretation: 'Used to frame the report in your own words.',
  reasoning: 'Never scored directly. Contradictions between stage and measured capacity are surfaced in the belief check.',
});
q({
  id: 'Q05', domain: 'Business model', personas: ALL, core: true, type: 'single', weight: 0, conf: 0,
  text: 'If you could change one thing in the next six months, what would it be?',
  help: 'Pick the one that feels most true. We’ll check it against the rest of your answers.',
  options: [
    o('more_new', 'More new clients'),
    o('social', 'A bigger social media following'),
    o('earn_more', 'Earn more from the clients I already have'),
    o('come_back', 'Clients coming back more consistently'),
    o('fewer_cxl', 'Fewer cancellations and no-shows'),
    o('raise_prices', 'Feel confident raising my prices'),
    o('fewer_hours', 'The same income in fewer hours'),
    o('organized', 'Less admin, more organized'),
  ],
  optionsBy: {
    SO: [
      o('more_new', 'More salon clients'),
      o('hire', 'Hire or keep good stylists'),
      o('step_back', 'Step back from my own chair'),
      o('profit', 'A more profitable salon'),
      o('come_back', 'Clients coming back more consistently'),
      o('organized', 'Better systems — less putting out fires'),
      o('social', 'A stronger online presence'),
    ],
  },
  dims: [], interventions: [],
  tests: 'The person’s own hypothesis about their constraint (“stated belief”).',
  healthy: 'n/a', warning: 'n/a', critical: 'n/a',
  interpretation: 'The report either confirms this instinct or explains why the evidence points somewhere else.',
  reasoning: 'Belief check: maps the stated goal to dimensions (more_new→ACQ, social→ACQ/BRAND/DISC, earn_more→TICKET/PRICE, come_back→RET/REBOOK, fewer_cxl→CXL, raise_prices→PRICE, fewer_hours→PRICE/MIX, organized→AUTO/OPS, hire→RECRUIT/STAFF_RET, step_back→OWNER_DEP, profit→STYLIST_PROD/OPS). If the mapped dimensions are healthy while another is high priority, the report says so plainly.',
});

// =====================================================================
// 2. REVENUE / INCOME
// =====================================================================
q({
  id: 'Q06', domain: 'Revenue / income', personas: ['CS'], core: true, type: 'single', weight: 1, conf: 0.6,
  text: 'How are you paid?',
  options: [
    o('flat', 'A flat commission percentage', null, { PRICE: 1 }, 'You’re on a flat commission, so your income only grows through volume, ticket and retail.'),
    o('tiered', 'Tiered — my level or percentage rises as I grow', null, { PRICE: 0 }, 'You’re on a tiered structure, so productivity can raise both your price level and your percentage.'),
    o('hourly', 'Hourly plus commission', null, { PRICE: 1 }),
    o('team', 'Team-based pay', null, { PRICE: 1 }),
    o('unsure', 'I’m not sure exactly how it works', null, { FIN: 2, PRICE: 'U' }, 'You aren’t sure exactly how your pay is calculated.'),
  ],
  dims: ['PRICE', 'FIN'], interventions: ['career_tier_plan', 'salon_conversation'],
  tests: 'Which income levers a commission stylist actually has.',
  healthy: 'Tiered, with a known path to the next level', warning: 'Flat commission with no path to a higher level', critical: 'Doesn’t understand how pay is calculated',
  interpretation: 'Explains which of your numbers actually change your paycheck.',
  reasoning: 'On flat commission, “raise prices” is replaced by “move up a level, raise ticket and retail, or negotiate”. Unknown comp is itself a finding.',
});
q({
  id: 'Q07', domain: 'Revenue / income', personas: ['BR', 'SR'], core: true, type: 'single', weight: 0, conf: 0,
  text: { default: 'Roughly what is your weekly rent, including any fees?', SR: 'Roughly what does your suite cost per week, including fees?' },
  help: 'Monthly ÷ 4.3 is close enough.',
  options: [
    o('r1', 'Under $150', 125), o('r2', '$150–250', 200), o('r3', '$250–400', 325), o('r4', '$400–600', 500), o('r5', 'Over $600', 700),
  ],
  dims: [], interventions: ['rent_economics'],
  model: 'rent/week → rent as % of service revenue; appointments needed each week just to cover rent.',
  tests: 'Fixed-cost pressure on the solo model.',
  healthy: 'Rent < 15% of weekly service revenue', warning: 'Rent 15–25% of revenue', critical: 'Rent > 25% of revenue',
  interpretation: 'Shows how many appointments each week go to covering rent.',
  reasoning: 'Scored through derived metric rentShare (rule R13). High rent burden amplifies utilization and pricing concern.',
});

// =====================================================================
// 3. CAPACITY / SCHEDULE
// =====================================================================
q({
  id: 'Q08', domain: 'Capacity / schedule', personas: IND, core: true, type: 'single', weight: 0, conf: 0,
  text: 'Roughly how many hours a week do you make available for clients?',
  help: 'Count the hours you’re open for booking, whether or not they fill.',
  options: [o('h1', 'Under 15', 12), o('h2', '15–25', 20), o('h3', '25–35', 30), o('h4', '35–42', 38), o('h5', 'More than 42', 46)],
  dims: [], interventions: ['capacity_analysis', 'working_hours'],
  model: 'H = available service hours per week (the capacity ceiling).',
  tests: 'Capacity ceiling for the economic model.',
  healthy: 'n/a (input)', warning: '> 42 h with low revenue per hour → time economics', critical: 'n/a',
  interpretation: 'The starting point of your economic model.',
  reasoning: 'Input only. Combined with Q09–Q11 and Q33 to derive booked hours, revenue per hour and the practical ceiling.',
});
q({
  id: 'Q09', domain: 'Capacity / schedule', personas: IND, core: true, type: 'single', weight: 3, conf: 0.8,
  text: 'In a typical week, how much of that time is actually booked?',
  options: [
    o('u1', 'Less than 40%', 0.3, { UTIL: 3 }),
    o('u2', '40–60%', 0.5, { UTIL: 2 }),
    o('u3', '60–75%', 0.68, { UTIL: 1 }),
    o('u4', '75–90%', 0.82, { UTIL: 0 }),
    o('u5', '90% or more', 0.93, { UTIL: -1 }),
    o('swing', 'It swings a lot week to week', 0.6, { UTIL: 1 }, 'Your schedule swings a lot from week to week.'),
  ],
  ev: '{label} of your available time is booked in a typical week.',
  dims: ['UTIL', 'ACQ', 'PRICE'], interventions: ['schedule_architecture', 'capacity_analysis'],
  model: 'U = booked share. Booked hours = H × U.',
  tests: 'Whether the constraint is demand (low U) or monetization/capacity (high U). The single most important routing signal in the diagnostic.',
  healthy: '75–90% booked', warning: '40–60% booked', critical: 'Under 40% booked — or 90%+ with stagnant prices (a different problem)',
  interpretation: 'Tells us whether more clients would actually help — or whether your time is already spoken for.',
  reasoning: 'Capacity gate (R01/R02): at ≥ 82% booked, acquisition concern is damped and pricing/ticket/mix concern amplified. At ≤ 50%, demand dimensions are amplified.',
});
q({
  id: 'Q10', domain: 'Capacity / schedule', personas: IND, core: false, type: 'single', weight: 2, conf: 0.6,
  trigger: { q: 'Q09', gte: 0.75 }, trigger_text: 'Q09 ≥ 75% booked (forward demand only matters when the book is mostly full)',
  text: 'How far ahead are you usually booked?',
  options: [
    o('same', 'Mostly the same week', 0, { UTIL: 2 }),
    o('one', 'About a week out', 1, { UTIL: 1 }),
    o('two', '2–3 weeks out', 2.5, { UTIL: 0 }),
    o('four', '4+ weeks out', 5, { UTIL: -1 }),
    o('turning', 'Far out, and I turn people away', 7, { UTIL: -1 }, 'You’re booked far out and turning people away.'),
  ],
  ev: 'You’re usually booked {label}.',
  dims: ['UTIL', 'PRICE'], interventions: ['waitlist_system', 'price_increase_plan', 'capacity_analysis'],
  tests: 'Forward demand and evidence of unmet demand (pricing power).',
  healthy: '2–3 weeks out', warning: 'Same week only', critical: 'Turning people away with prices unchanged (unpriced demand)',
  interpretation: 'How far out you book shows how much demand is waiting behind your schedule.',
  reasoning: '≥ 4 weeks / turning away = excess demand. Combined with no recent price increase → R14 underpricing.',
});
q({
  id: 'Q11', domain: 'Capacity / schedule', personas: IND, core: true, type: 'single', weight: 0, conf: 0,
  text: { default: 'About how many clients do you see in a typical week?' },
  options: [o('c1', 'Fewer than 10', 7), o('c2', '10–20', 15), o('c3', '20–30', 25), o('c4', '30–45', 37), o('c5', 'More than 45', 52)],
  dims: [], interventions: [],
  model: 'A = completed appointments per week. Average appointment length = booked hours ÷ A.',
  tests: 'Volume input for revenue, leakage rate and regulars-needed calculations.',
  healthy: 'n/a (input)', warning: 'n/a', critical: 'n/a',
  interpretation: 'Used to calculate revenue per week and per hour.',
  reasoning: 'Input only.',
});
q({
  id: 'Q12', domain: 'Capacity / schedule', personas: IND, core: false, type: 'multi', weight: 1, conf: 0.5,
  trigger: { any: [{ q: 'Q09', lte: 0.5 }, { q: 'Q09', in: ['swing'] }] }, trigger_text: 'Q09 ≤ 40–60% booked, or swings',
  text: 'When you have open time, where does it usually fall?',
  help: 'Choose all that apply.',
  options: [
    o('wk_morn', 'Weekday mornings', null, { UTIL: 1 }),
    o('wk_aft', 'Weekday afternoons', null, { UTIL: 1 }),
    o('eve', 'Evenings', null, { UTIL: 1 }),
    o('wkend', 'Weekends', null, { UTIL: 2 }, 'Even weekend time is going unbooked.'),
    o('scattered', 'Small gaps scattered between appointments', null, { MIX: 2, UTIL: 1 }, 'Some open time is scattered in small gaps between appointments — schedule architecture, not demand.'),
    o('none', 'No real pattern', null, { UTIL: 1 }),
  ],
  ev: 'Open time tends to fall on: {labels}.',
  dims: ['UTIL', 'MIX'], interventions: ['schedule_architecture', 'working_hours', 'waitlist_system'],
  tests: 'Whether open capacity is a demand problem or a schedule-architecture problem.',
  healthy: 'Open time at predictable low-demand times', warning: 'Scattered fragments between appointments', critical: 'Weekend/prime time open (true demand shortfall)',
  interpretation: 'Shows whether empty time can be fixed by reshaping your schedule rather than finding more clients.',
  reasoning: 'Scattered gaps → schedule architecture/booking rules. Weekday daytime only → working-hour optimization. Weekend gaps → genuine demand shortfall.',
});

// =====================================================================
// 4. CLIENT ACQUISITION
// =====================================================================
q({
  id: 'Q13', domain: 'Client acquisition', personas: ALL, core: true, type: 'single', weight: 2, conf: 0.6,
  text: { default: 'About how many genuinely new clients do you see in a month?', SO: 'About how many new clients does the salon see in a month?' },
  options: [
    o('n1', '0–2', 1, { ACQ: 3 }), o('n2', '3–5', 4, { ACQ: 2 }), o('n3', '6–10', 8, { ACQ: 0 }), o('n4', '11–20', 15, { ACQ: -1 }), o('n5', 'More than 20', 25, { ACQ: -1 }),
    o('unsure', 'Not sure', null, { ACQ: 'U', FIN: 1 }),
  ],
  optionsBy: {
    SO: [
      o('n1', 'Under 10', 6, { ACQ: 3 }), o('n2', '10–25', 18, { ACQ: 1 }), o('n3', '25–50', 37, { ACQ: 0 }), o('n4', '50–100', 75, { ACQ: -1 }), o('n5', 'More than 100', 120, { ACQ: -1 }),
      o('unsure', 'Not sure', null, { ACQ: 'U', FIN: 1 }),
    ],
  },
  ev: 'You see about {label} new clients a month.',
  dims: ['ACQ', 'FIN'], interventions: ['referral_system', 'gbp_optimization', 'new_client_offer'],
  model: 'New clients/month → expected new regulars/month (× Q25 return rate).',
  tests: 'Raw new-client inflow — interpreted against open capacity, never alone.',
  healthy: 'Enough new clients to fill open capacity once retention is applied', warning: 'Few new clients and lots of open time', critical: '0–2 per month with < 60% booked',
  interpretation: 'Read alongside how full you are: five new clients a month is plenty for a full book and not enough for a half-empty one.',
  reasoning: 'Base signal is overridden by derived ACQ (demand vs open capacity) in engine: if U ≥ 0.82, acquisition is scored healthy regardless of volume.',
});
q({
  id: 'Q14', domain: 'Client acquisition', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], core: true, type: 'multi', weight: 1.5, conf: 0.6,
  coreBy: { SO: false },
  trigger: { any: [{ persona: IND }, { q: 'Q48', in: ['low'] }] }, trigger_text: 'All individuals; owners only when most stylists are under 60% booked',
  text: { default: 'Where do new clients usually find you?', SO: 'Where do new salon clients usually come from?' },
  help: 'Choose all that apply.',
  options: [
    o('ig', 'Instagram'),
    o('tiktok', 'TikTok'),
    o('google', 'Google search or Maps', null, { DISC: -1 }),
    o('apps', 'Booking apps (Booksy, StyleSeat, Vagaro…)', null, { DISC: 0 }),
    o('referral', 'Referrals from clients', null, { REF: -1 }),
    o('salon', 'The salon or front desk assigns them'),
    o('walkin', 'Walk-ins'),
    o('website', 'My website'),
    o('facebook', 'Facebook'),
    o('ads', 'Paid ads'),
    o('pros', 'Other professionals refer to me', null, { REF: -1 }),
    o('unsure', 'Not sure', null, { FIN: 1 }),
  ],
  ev: 'New clients come from: {labels}.',
  dims: ['ACQ', 'DISC', 'REF', 'BRAND'], interventions: ['gbp_optimization', 'referral_system', 'marketplace_profile', 'local_partnerships'],
  tests: 'Channel mix and concentration risk.',
  healthy: 'Two or more sources including search or referrals', warning: 'One platform only (e.g., Instagram only)', critical: 'Not sure where clients come from',
  interpretation: 'Shows whether your demand rests on one channel or several.',
  reasoning: 'Concentration rule R06: social-only (Instagram/TikTok/Facebook) with no Google/referral → DISC warning + BRAND/ACQ watch. Google selected → DISC strong. Referral selected → REF strong.',
});
q({
  id: 'Q15', domain: 'Client acquisition', personas: ['CS'], core: true, type: 'single', weight: 2.5, conf: 0.8,
  text: 'How do most of your clients end up in your chair?',
  options: [
    o('mine', 'Mostly my own request clients', null, { ACQ: -1, BRAND: -1 }, 'Most of your book is clients who ask for you by name.'),
    o('half', 'About half mine, half assigned by the salon', null, { ACQ: 0, BRAND: 0 }),
    o('assigned', 'Mostly assigned by the salon or walk-ins', null, { ACQ: 1, BRAND: 2 }, 'Most of your clients are assigned by the salon rather than requesting you.'),
    o('few', 'The salon sends me very few — I’m building my own', null, { ACQ: 2, BRAND: 2 }, 'The salon sends you very few clients, so you’re building your own book.'),
  ],
  dims: ['ACQ', 'BRAND'], interventions: ['personal_brand_cs', 'prebooking_system', 'salon_conversation'],
  tests: 'Ownership of demand for a commission stylist (request clients vs assigned).',
  healthy: 'Mostly request clients', warning: 'Mostly salon-assigned', critical: 'Few clients and no salon flow',
  interpretation: 'Request clients are the part of your book you own — and the part that follows your reputation.',
  reasoning: 'For CS, acquisition means converting salon-assigned first visits into request clients and growing personal referrals — not advertising.',
});

// =====================================================================
// 5. LOCAL DISCOVERY
// =====================================================================
q({
  id: 'Q16', domain: 'Local discovery', personas: SOLO_SO, core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { any: [{ all: [{ persona: SOLO }, { not: { q: 'Q14', has: 'google' } }] }, { all: [{ persona: ['SO'] }, { q: 'Q48', lte: 0.7 }] }] },
  trigger_text: 'Solo: Google isn’t already a source of new clients. Owner: stylist books mixed or under 60%.',
  text: { default: 'If someone nearby searched Google for your service and your city, where would you show up?', SO: 'If someone nearby searched Google for “salon” and your city, where would the salon show up?' },
  options: [
    o('top', 'In the top few on the map', null, { DISC: -1, DIGITAL: -1 }),
    o('page1', 'Somewhere on the first page', null, { DISC: 0 }),
    o('hard', 'Hard to find', null, { DISC: 2 }, 'You’re hard to find when people nearby search Google for your service.'),
    o('nogbp', 'Not at all — I don’t have a Google Business Profile', null, { DISC: 3, DIGITAL: 1 }, 'You don’t have a Google Business Profile, so you’re invisible to people searching nearby.'),
    o('never', 'I’ve never checked', null, { DISC: 2, FIN: 1 }, 'You haven’t checked how you appear on Google.'),
  ],
  dims: ['DISC', 'DIGITAL'], interventions: ['gbp_optimization', 'local_seo', 'review_generation'],
  tests: 'Visibility to high-intent local search.',
  healthy: 'Top of the map pack', warning: 'Hard to find', critical: 'No Google Business Profile',
  interpretation: 'People searching nearby are ready to book now. This shows whether they can find you.',
  reasoning: 'Skipped when the schedule is full and Google already produces clients (no point diagnosing a non-constraint). For SO, only asked when stylists have capacity.',
});

// =====================================================================
// 6. SOCIAL MEDIA / PERSONAL BRAND
// =====================================================================
q({
  id: 'Q17', domain: 'Social media / personal brand', personas: ['CS', 'BR', 'SR', 'IP'], core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q05', in: ['social'] }, { all: [{ q: 'Q14', hasAny: ['ig', 'tiktok', 'facebook'] }, { q: 'Q09', lte: 0.82 }] }, { q: 'Q15', in: ['assigned', 'few'] }] },
  trigger_text: 'Goal = social, or social is a source and the book isn’t full, or CS without request clientele',
  text: 'Which best describes your social media?',
  options: [
    o('works', 'I post consistently and it brings real bookings', null, { BRAND: -1, ACQ: -1 }),
    o('busy_few', 'I post consistently, but it brings few bookings', null, { BRAND: 1, CONV: 1 }, 'You post consistently, but it brings few bookings.'),
    o('occasional', 'I post now and then', null, { BRAND: 1 }, 'You post on social media now and then.'),
    o('inactive', 'Mostly inactive', null, { BRAND: 2 }, 'Your social presence is mostly inactive.'),
    o('none', 'I don’t really use it', null, { BRAND: 1 }),
  ],
  dims: ['BRAND', 'ACQ', 'CONV'], interventions: ['instagram_strategy', 'portfolio_photography', 'booking_link'],
  tests: 'Whether social effort is producing bookings — effort vs return, not follower count.',
  healthy: 'Consistent and producing bookings', warning: 'Consistent effort, few bookings (a conversion or positioning problem, not a posting problem)', critical: 'Inactive while social is the only source',
  interpretation: 'Followers only matter if they turn into appointments.',
  reasoning: '“Busy, few bookings” routes to conversion (Q18–Q20) and positioning (Q36–Q37) rather than “post more”. Never recommended as primary when U ≥ 82%.',
});

// =====================================================================
// 7. INQUIRY → BOOKING CONVERSION
// =====================================================================
q({
  id: 'Q18', domain: 'Inquiry → booking', personas: SOLO, core: true, type: 'single', weight: 1.5, conf: 0.6,
  text: 'How do new clients usually book with you?',
  options: [
    o('online', 'Online — they book themselves', null, { CONV: -1, AUTO: -1, DIGITAL: -1 }),
    o('mix', 'Some online, some by message', null, { CONV: 0, AUTO: 0 }),
    o('dm', 'They message me, then I book them', null, { CONV: 1, AUTO: 1, DIGITAL: 1 }, 'New clients have to message you before they can book.'),
    o('call', 'They call or text, then I book them', null, { CONV: 1, AUTO: 1, DIGITAL: 1 }, 'New clients have to call or text before they can book.'),
  ],
  dims: ['CONV', 'AUTO', 'DIGITAL'], interventions: ['online_booking', 'booking_link', 'inquiry_response'],
  tests: 'Booking friction.',
  healthy: 'Self-serve online booking', warning: 'Message-first booking', critical: 'Message-first booking with slow replies (see Q19)',
  interpretation: 'Every message-before-booking step loses some people who were ready.',
  reasoning: 'Message-based booking triggers Q19 (speed) and Q20 (conversion rate).',
});
q({
  id: 'Q19', domain: 'Inquiry → booking', personas: SOLO, core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { q: 'Q18', in: ['mix', 'dm', 'call'] }, trigger_text: 'Q18 = message, call, or mix',
  text: 'How quickly do new inquiries usually get a reply?',
  options: [
    o('hour', 'Within an hour', null, { CONV: -1 }),
    o('same', 'Same day', null, { CONV: 0 }),
    o('next', 'Next day', null, { CONV: 2 }, 'New inquiries usually wait until the next day for a reply.'),
    o('slow', 'Sometimes days — some slip through', null, { CONV: 3, AUTO: 2 }, 'Some inquiries wait days for a reply, and some slip through.'),
  ],
  dims: ['CONV', 'AUTO'], interventions: ['inquiry_response', 'missed_inquiry_recovery', 'online_booking'],
  tests: 'Speed-to-lead.',
  healthy: 'Within an hour', warning: 'Next day', critical: 'Days, or missed entirely',
  interpretation: 'People usually book the first professional who answers.',
  reasoning: 'Slow replies + many inquiries → conversion is the constraint (R05).',
});
q({
  id: 'Q20', domain: 'Inquiry → booking', personas: SOLO, core: false, type: 'single', weight: 2.5, conf: 0.8,
  trigger: { any: [{ q: 'Q18', in: ['mix', 'dm', 'call'] }, { q: 'Q17', in: ['busy_few'] }] },
  trigger_text: 'Message-based booking, or social busy with few bookings',
  text: 'Out of 10 people who reach out about booking, about how many end up booked?',
  help: 'Leave out spam and people asking about something you don’t do.',
  options: [
    o('c8', '8 or more', 0.85, { CONV: -1 }),
    o('c6', '6–7', 0.65, { CONV: 0 }),
    o('c4', '4–5', 0.45, { CONV: 2 }),
    o('c2', 'Fewer than 4', 0.25, { CONV: 3 }),
    o('unsure', 'I don’t know', null, { CONV: 'U', FIN: 1 }),
  ],
  ev: '{label} out of 10 people who reach out end up booked.',
  dims: ['CONV', 'FIN'], interventions: ['inquiry_response', 'missed_inquiry_recovery', 'booking_link', 'online_booking'],
  model: 'Conversion rate → estimated monthly inquiries = new clients ÷ conversion; inquiries not booked per month.',
  tests: 'Inquiry → appointment conversion.',
  healthy: '8+ of 10', warning: '4–5 of 10', critical: 'Fewer than 4 of 10',
  interpretation: 'If half the people who already reached out don’t book, more followers will mostly produce more unbooked messages.',
  reasoning: 'Weak conversion with healthy inflow → R05: don’t buy more demand; fix the path to booking.',
});

// =====================================================================
// 8. CANCELLATIONS / NO-SHOWS
// =====================================================================
q({
  id: 'Q21', domain: 'Cancellations / no-shows', personas: IND, core: true, type: 'single', weight: 2, conf: 0.7,
  text: 'In a typical week, how many appointments cancel late or don’t show?',
  help: '“Late” means too late to easily refill — usually inside 24–48 hours.',
  options: [
    o('x0', 'Almost none', 0.3, { CXL: -1 }),
    o('x1', 'About 1', 1, { CXL: 0 }),
    o('x2', '2–3', 2.5, { CXL: 1 }),
    o('x4', '4–5', 4.5, { CXL: 2 }),
    o('x6', '6 or more', 7, { CXL: 3 }),
  ],
  ev: '{label} appointments a week cancel late or don’t show.',
  dims: ['CXL'], interventions: ['deposit_policy', 'reminders_confirmations', 'waitlist_system'],
  model: 'L = late cancels/no-shows per week → leakage rate = L ÷ (A + L); lost hours = L × avg appointment length × (1 − refill rate).',
  tests: 'Schedule leakage after booking.',
  healthy: 'Under ~3% of booked appointments', warning: '10–15%', critical: '15%+',
  interpretation: 'Late cancellations are the most expensive empty hours you have.',
  reasoning: 'Base signal; replaced by the derived leakage rate (relative to volume) when Q11 is known.',
});
q({
  id: 'Q22', domain: 'Cancellations / no-shows', personas: IND, core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q21', gte: 2.5 }, { all: [{ persona: ['IP'] }, { q: 'Q21', gte: 1 }] }] }, trigger_text: 'Q21 ≥ 2–3 per week (IP: ≥ 1)',
  text: { default: 'What happens when someone cancels late or no-shows?', CS: 'What happens at your salon when someone cancels late or no-shows?' },
  options: [
    o('deposit', 'A deposit is required to book', null, { CXL: -1 }),
    o('card', 'Card on file, and the fee is enforced', null, { CXL: 0 }),
    o('soft', 'There’s a policy, but it’s rarely enforced', null, { CXL: 2 }, 'You have a cancellation policy, but it’s rarely enforced.'),
    o('none', 'Nothing — there’s no policy', null, { CXL: 3 }, 'There’s no deposit or cancellation policy protecting your time.'),
  ],
  optionsBy: {
    CS: [
      o('deposit', 'The salon takes deposits or enforces fees', null, { CXL: 0 }),
      o('soft', 'There’s a policy, but it’s rarely enforced', null, { CXL: 2 }, 'The salon has a policy, but it’s rarely enforced.'),
      o('none', 'No policy', null, { CXL: 2 }, 'The salon has no cancellation policy.'),
    ],
  },
  dims: ['CXL'], interventions: ['deposit_policy', 'cancellation_policy', 'salon_conversation'],
  tests: 'Whether clients have a reason to keep or reschedule appointments.',
  healthy: 'Deposit or enforced card-on-file', warning: 'Unenforced policy', critical: 'No policy with high leakage',
  interpretation: 'A policy changes behavior mostly by existing and being applied consistently.',
  reasoning: 'For CS this becomes a salon conversation, not a recommendation they can implement.',
});
q({
  id: 'Q23', domain: 'Cancellations / no-shows', personas: IND, core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { q: 'Q21', gte: 2.5 }, trigger_text: 'Q21 ≥ 2–3 per week',
  text: 'When a slot opens up at the last minute, what usually happens?',
  options: [
    o('auto', 'A waitlist or my booking app fills it', 0.7, { CXL: -1 }),
    o('manual', 'I message a waitlist or post the opening', 0.4, { CXL: 0 }),
    o('empty', 'It usually stays empty', 0.1, { CXL: 2 }, 'Last-minute openings usually stay empty.'),
  ],
  dims: ['CXL', 'UTIL'], interventions: ['waitlist_system', 'cancellation_recovery'],
  model: 'Refill rate assumption: automated 70%, manual 40%, none 10%.',
  tests: 'Recovery of leaked time.',
  healthy: 'Automated waitlist', warning: 'Manual refill', critical: 'Stays empty',
  interpretation: 'Cancellations matter less when openings get refilled quickly.',
  reasoning: 'Feeds the refill-rate assumption used in lost-hours math.',
});

// =====================================================================
// 9. REBOOKING
// =====================================================================
q({
  id: 'Q24', domain: 'Rebooking', personas: ALL, core: true, type: 'composite', weight: 3, conf: 0.9,
  text: { default: 'At the end of an appointment…', SO: 'Across the salon, at the end of an appointment…' },
  rows: [
    {
      id: 'process', label: { default: 'What usually happens?', SO: 'What usually happens at checkout?' }, weight: 1.2,
      options: [
        o('always', 'The next visit gets booked before they leave — nearly always', null, { REBOOK: -1 }),
        o('ask', 'I ask, but many say they’ll book later', null, { REBOOK: 1 }, 'Clients are asked to rebook, but many say they’ll book later.'),
        o('reminder', 'They get a reminder later', null, { REBOOK: 1 }),
        o('own', 'They reach out when they’re ready', null, { REBOOK: 2 }, 'Most clients decide on their own when to come back.'),
        o('none', 'There isn’t really a process', null, { REBOOK: 3 }, 'There’s no real rebooking process at checkout.'),
      ],
    },
    {
      id: 'pct', label: 'Roughly what share leave with their next appointment booked?', weight: 1.5,
      options: [
        o('p80', '80% or more', 0.85, { REBOOK: -1 }),
        o('p60', '60–79%', 0.7, { REBOOK: 0 }),
        o('p40', '40–59%', 0.5, { REBOOK: 1 }),
        o('p20', '20–39%', 0.3, { REBOOK: 2 }),
        o('p0', 'Under 20%', 0.12, { REBOOK: 3 }),
        o('unsure', 'Not sure', null, { REBOOK: 'U', FIN: 1 }),
      ],
      ev: '{label} of clients leave with their next appointment already scheduled.',
    },
  ],
  dims: ['REBOOK', 'FIN'], interventions: ['prebooking_system', 'reminders_confirmations', 'stylist_coaching'],
  model: 'Prebook rate R. Used in the retention leg of the equation.',
  tests: 'Prebooking discipline and rate.',
  healthy: '60%+ prebook with a consistent checkout habit', warning: '20–39% prebook', critical: 'Under 20%, no process',
  interpretation: 'Clients who leave without a next date come back later, less often, or not at all.',
  reasoning: 'Weighted heavier for short-cycle specialties (R15). For makeup, down-weighted. For SO, salon-level and coached by stylist.',
});

// =====================================================================
// 10. CLIENT RETENTION
// =====================================================================
q({
  id: 'Q25', domain: 'Client retention', personas: ALL, core: true, type: 'single', weight: 3, conf: 0.9,
  text: { default: 'Out of 10 first-time clients, about how many come back for another visit?', SO: 'Out of 10 first-time salon clients, about how many come back?' },
  options: [
    o('r8', '8 or more', 0.85, { RET: -1 }),
    o('r6', '6–7', 0.65, { RET: 0 }),
    o('r4', '4–5', 0.45, { RET: 2 }),
    o('r2', '3 or fewer', 0.25, { RET: 3 }),
    o('unsure', 'Not sure', null, { RET: 'U', FIN: 1 }),
  ],
  ev: '{label} out of 10 first-time clients come back.',
  dims: ['RET', 'FIN'], interventions: ['first_visit_followup', 'retention_system', 'niche_positioning'],
  model: 'First-visit return rate F → new regulars/month = new clients × F; value of a regular = visits/year × ticket.',
  tests: 'Whether new demand turns into a recurring book.',
  healthy: '6–7+ of 10', warning: '4–5 of 10', critical: '3 or fewer of 10',
  interpretation: 'If half your new clients never return, more new clients mostly means more one-time visits.',
  reasoning: 'The “leaky bucket” rule (R03) uses this: weak retention damps acquisition in ranking and adds paid demand to “wouldn’t spend money on”.',
});
q({
  id: 'Q26', domain: 'Client retention', personas: IND, core: false, type: 'single', weight: 0, conf: 0,
  trigger: { all: [{ q: 'Q03', in: ['hair', 'hair_spec', 'skin', 'wax', 'mix', 'brow'] }, { any: [{ q: 'Q24', row: 'pct', lte: 0.5 }, { q: 'Q25', lte: 0.45 }] }] }, trigger_text: 'Variable-cycle specialty AND rebooking/retention looks weak (needed to value a regular)',
  text: 'How often do your regulars typically come in?',
  options: [o('w2', 'Every 2–3 weeks', 2.5), o('w5', 'Every 4–6 weeks', 5), o('w8', 'Every 6–10 weeks', 8), o('w12', 'Every 10+ weeks', 12), o('varies', 'It varies a lot', null)],
  dims: [], interventions: ['membership'],
  model: 'Interval I (weeks). Visits per regular per year = 52 ÷ I. Regulars needed to sustain current volume ≈ A × I.',
  tests: 'Service cycle — sets the value of a regular and the reactivation threshold.',
  healthy: 'n/a (input)', warning: 'n/a', critical: 'n/a',
  interpretation: 'Used to estimate what a returning client is worth over a year.',
  reasoning: 'Skipped for lash/nails/barber (default ~3 wks) and makeup (event-based).',
});
q({
  id: 'Q27', domain: 'Client retention', personas: ALL, core: false, type: 'multi', weight: 1.5, conf: 0.6,
  trigger: { q: 'Q25', lte: 0.45 }, trigger_text: 'Q25 ≤ 4–5 of 10',
  text: 'Why do you think some first-time clients don’t come back?',
  help: 'Choose all that apply. Honest guesses are fine.',
  options: [
    o('price', 'The price', null, { PRICE: 1, BRAND: 1 }),
    o('fit', 'Wrong fit — they wanted something different', null, { BRAND: 2 }, 'Some first-timers turn out to be the wrong fit for what you do.'),
    o('deal', 'They came for a deal', null, { PRICE: 1, BRAND: 2 }, 'Some first-timers came for a deal and didn’t return at full price.'),
    o('experience', 'Something about the result or experience', null, { RET: 2 }),
    o('no_reason', 'Nothing prompted them to come back', null, { REBOOK: 1, AUTO: 1 }, 'Nothing prompts first-timers to book a second visit.'),
    o('unknown', 'Honestly, I don’t know', null, { FIN: 1 }),
  ],
  dims: ['RET', 'BRAND', 'PRICE', 'REBOOK'], interventions: ['first_visit_followup', 'niche_positioning', 'discount_reduction'],
  tests: 'Root cause of weak retention: positioning/clientele vs follow-up vs experience.',
  healthy: 'n/a', warning: '“No reason to come back” (system gap)', critical: '“Came for a deal” + heavy discounting (wrong clientele)',
  interpretation: 'Different reasons call for very different fixes.',
  reasoning: 'Deal/fit → positioning & discount problem (don’t fix with a retention system alone). No-reason → follow-up system. Experience → service/consultation (flag for conversation, not marketing).',
});

// =====================================================================
// 11. CLIENT REACTIVATION / DATABASE
// =====================================================================
q({
  id: 'Q28', domain: 'Client database / reactivation', personas: ALL, core: false, type: 'composite', weight: 1.5, conf: 0.6,
  trigger: { any: [{ all: [{ persona: IND }, { any: [{ q: 'Q25', lte: 0.45 }, { q: 'Q24', row: 'pct', lte: 0.5 }] }] }, { all: [{ persona: ['CS'] }, { q: 'Q15', in: ['assigned', 'few'] }] }, { q: 'Q46', in: ['follow', 'unknown'] }] },
  trigger_text: 'Individuals: retention ≤ 4–5/10 or prebook ≤ 59%. CS building a book. Owners: clients follow departing stylists, or unknown.',
  text: 'Your client list',
  rows: [
    {
      id: 'where', label: 'Where does your client list live?', weight: 1,
      options: [
        o('software', 'Booking software, with history and notes', null, { AUTO: -1 }),
        o('phone', 'My phone contacts and DMs', null, { AUTO: 2, REACT: 1 }, 'Your client list lives in your phone and DMs rather than a booking system.'),
        o('paper', 'Paper or memory', null, { AUTO: 3, REACT: 2 }, 'Your client records are on paper or from memory.'),
      ],
      optionsBy: {
        CS: [
          o('mine', 'I keep my own client contacts', null, { REACT: 0 }),
          o('salon_see', 'In the salon’s system, and I can see my clients', null, { REACT: 0 }),
          o('salon_no', 'In the salon’s system, and I can’t access it', null, { REACT: 2 }, 'You can’t access your own client list.'),
        ],
        SO: [
          o('software', 'Salon software, with history by client and stylist', null, { OPS: -1 }),
          o('partial', 'Software, but stylists keep their own lists too', null, { OPS: 1, RET: 1 }),
          o('scattered', 'Mostly with each stylist', null, { OPS: 3, RET: 2 }, 'Client records mostly live with individual stylists.'),
        ],
      },
    },
    {
      id: 'count', label: 'About how many past clients are on it?', weight: 1,
      options: [
        o('d1', 'Under 100', 60), o('d2', '100–300', 200), o('d3', '300–700', 500), o('d4', '700–1,500', 1000), o('d5', 'More than 1,500', 2000),
        o('unsure', 'Not sure', null, { FIN: 1 }),
      ],
      ev: 'There are about {label} past clients on your list.',
    },
  ],
  dims: ['REACT', 'AUTO', 'OPS', 'FIN'], interventions: ['database_cleanup', 'win_back', 'booking_automation'],
  model: 'Database size → reactivation pool estimate.',
  tests: 'Whether past demand is an accessible asset.',
  healthy: 'In software with history; size known', warning: 'In phone/DMs', critical: 'Inaccessible (CS) or paper',
  interpretation: 'Your past clients are the cheapest demand you have — if you can reach them.',
  reasoning: 'A large list (≥ 300) with no outreach (Q29) → R16 reactivation opportunity. CS without access → career-risk note.',
});
q({
  id: 'Q29', domain: 'Client reactivation', personas: IND, core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { any: [{ q: 'Q28', row: 'count', gte: 200 }, { q: 'Q25', lte: 0.45 }] }, trigger_text: 'List ≥ 100–300, or retention ≤ 4–5/10',
  text: 'When a client hasn’t been back in a while, what usually happens?',
  options: [
    o('auto', 'They get an automatic reminder when they’re overdue', null, { REACT: -1, RET: -1 }),
    o('personal', 'I personally reach out to overdue clients', null, { REACT: 0 }),
    o('occasional', 'An occasional “we miss you” message', null, { REACT: 1 }, 'Clients who go quiet only hear from you through occasional “we miss you” messages.'),
    o('nothing', 'Nothing, really', null, { REACT: 3, RET: 1 }, 'Nothing happens when a client stops coming.'),
  ],
  dims: ['REACT', 'RET'], interventions: ['win_back', 'retention_system', 'email_sms_program'],
  tests: 'Whether lapsing clients are noticed and invited back.',
  healthy: 'Automatic overdue reminders', warning: 'Occasional blasts', critical: 'Nothing, with a large list',
  interpretation: 'Clients often drift away without deciding to leave. A simple invitation brings many back.',
  reasoning: 'Severity scaled by list size (R16): “nothing” with 50 clients is minor; with 700 it is a top-3 candidate.',
});

// =====================================================================
// 12. PRICING
// =====================================================================
q({
  id: 'Q30', domain: 'Pricing', personas: ALL, core: true, type: 'composite', weight: 2, conf: 0.8,
  text: { default: 'Your prices', CS: 'Your price level', SO: 'The salon’s prices' },
  rows: [
    {
      id: 'last', label: { default: 'When did you last meaningfully raise prices?', CS: 'When did your price level last go up?' }, weight: 1.2,
      options: [
        o('y0', 'In the last 12 months', 0.5, { PRICE: -1 }),
        o('y1', '1–2 years ago', 1.5, { PRICE: 0 }),
        o('y2', '2–3 years ago', 2.5, { PRICE: 1 }, 'Your prices haven’t meaningfully changed in 2–3 years.'),
        o('y3', '3+ years ago, or never', 4, { PRICE: 2 }, 'Your prices haven’t meaningfully changed in more than three years.'),
      ],
      optionsBy: {
        CS: [
          o('y0', 'In the last 12 months', 0.5, { PRICE: -1 }),
          o('y1', '1–2 years ago', 1.5, { PRICE: 0 }),
          o('y3', 'More than 2 years ago', 3, { PRICE: 2 }, 'Your price level hasn’t moved in more than two years.'),
          o('never', 'The salon sets prices — it’s never come up', 3, { PRICE: 2 }, 'Your price level has never been discussed with the salon.'),
        ],
      },
    },
    {
      id: 'fear', label: 'Have you held off raising prices because you worried clients would leave?', weight: 0.8,
      options: [
        o('often', 'Yes, more than once', null, { PRICE: 2 }, 'You’ve held off raising prices more than once for fear of losing clients.'),
        o('once', 'Once or twice', null, { PRICE: 1 }),
        o('no', 'No', null, { PRICE: 0 }),
      ],
    },
  ],
  dims: ['PRICE'], interventions: ['pricing_analysis', 'price_increase_plan', 'career_tier_plan'],
  tests: 'Price momentum and price anxiety.',
  healthy: 'Raised in the last 1–2 years, no fear', warning: '2–3 years, some hesitation', critical: '3+ years with a full book',
  interpretation: 'Prices that don’t move while demand grows quietly turn a full book into a capped income.',
  reasoning: 'Amplified by capacity gate: U ≥ 82% or booked 4+ weeks with ≥ 2.5 years since increase → R14 underpricing (HIGH PRIORITY floor).',
});
q({
  id: 'Q31', domain: 'Pricing', personas: ['CS', 'BR', 'SR', 'IP'], core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q09', gte: 0.82 }, { q: 'Q30', row: 'last', gte: 2.5 }, { q: 'Q30', row: 'fear', in: ['often'] }, { q: 'Q05', in: ['raise_prices', 'earn_more', 'fewer_hours'] }] },
  trigger_text: '≥ 75–90% booked, or 2+ years since increase, or price fear, or goal about earnings',
  text: 'Compared with professionals near you at a similar skill level, your prices are…',
  options: [
    o('higher', 'Noticeably higher', null, { PRICE: -1 }),
    o('same', 'About the same', null, { PRICE: 0 }),
    o('lower', 'A bit lower', null, { PRICE: 1 }, 'You price a bit below comparable professionals nearby.'),
    o('much_lower', 'Noticeably lower', null, { PRICE: 2 }, 'You price noticeably below comparable professionals nearby.'),
    o('unsure', 'I’m not sure', null, { PRICE: 'U', FIN: 1 }),
  ],
  dims: ['PRICE'], interventions: ['pricing_analysis', 'price_increase_plan'],
  tests: 'Self-assessed market position.',
  healthy: 'About the same or higher with full book', warning: 'A bit lower', critical: 'Noticeably lower while busy',
  interpretation: 'Pricing below the market only makes sense if you’re trying to fill an empty book.',
  reasoning: 'Self-report; confidence modest. “Lower” + high utilization is strong evidence of underpricing.',
});
q({
  id: 'Q32', domain: 'Pricing', personas: ALL, core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q31', in: ['lower', 'much_lower'] }, { q: 'Q27', hasAny: ['deal', 'price'] }, { all: [{ q: 'Q13', gte: 8 }, { q: 'Q25', lte: 0.45 }] }] },
  trigger_text: 'Priced below market, or first-timers leave over price/deals, or high inflow + weak retention',
  text: 'How often do you discount?',
  help: 'New-client deals, friends-and-family, promotions, “just this once”.',
  options: [
    o('rare', 'Rarely', null, { PRICE: -1 }),
    o('first', 'Only a first-visit offer', null, { PRICE: 0 }),
    o('often', 'Often', null, { PRICE: 2, TICKET: 1 }, 'You discount often.'),
    o('most', 'Most clients pay less than my menu price', null, { PRICE: 3, TICKET: 2 }, 'Most clients pay less than your menu price.'),
  ],
  dims: ['PRICE', 'TICKET', 'BRAND'], interventions: ['discount_reduction', 'new_client_offer', 'niche_positioning'],
  tests: 'Discount leakage and deal-driven clientele.',
  healthy: 'Rarely', warning: 'Often', critical: 'Most clients below menu',
  interpretation: 'Discounts attract clients who come for the discount — and often leave with it.',
  reasoning: 'Heavy discounting + weak retention → wrong-clientele pattern; suppresses “new-client offer” intervention and adds it to don’t-buy.',
});

// =====================================================================
// 13. AVERAGE TICKET  /  15–16. ADD-ONS & RETAIL
// =====================================================================
q({
  id: 'Q33', domain: 'Average ticket', personas: IND, core: true, type: 'single', weight: 1, conf: 0.6,
  text: { default: 'What does a typical client spend on services per visit?', SO: 'What is the salon’s average service ticket?' },
  help: 'Services only — leave out tips and products.',
  options: [o('t1', 'Under $50', 40), o('t2', '$50–80', 65), o('t3', '$80–120', 100), o('t4', '$120–180', 150), o('t5', '$180–250', 215), o('t6', 'Over $250', 300)],
  ev: 'A typical visit is about {label} in services.',
  dims: ['TICKET'], interventions: ['addon_strategy', 'menu_restructure', 'pricing_analysis'],
  model: 'T = average service ticket. Weekly service revenue ≈ A × T. Revenue per booked hour = A × T ÷ (H × U).',
  tests: 'Revenue per appointment; combined with hours to get revenue per hour.',
  healthy: 'Revenue per booked hour ≥ ~$80 (calibration placeholder)', warning: '$45–60/hour', critical: 'Under ~$45/hour',
  interpretation: 'Revenue per appointment multiplies every other number in your business.',
  reasoning: 'Not scored on its own (dollar levels vary by specialty and market). Scored via derived revenue-per-booked-hour, with thresholds marked as calibration placeholders to tune on Kansas data.',
});
q({
  id: 'Q34', domain: 'Add-ons / retail', personas: ALL, core: false, type: 'composite', weight: 1.5, conf: 0.6,
  trigger: { any: [{ persona: ['SO'] }, { q: 'Q09', gte: 0.75 }, { q: 'Q05', in: ['earn_more', 'fewer_hours'] }, { q: 'Q33', lte: 65 }] },
  trigger_text: 'Owners always; individuals when ≥ 75% booked, goal about earnings, or ticket ≤ $80',
  text: 'Beyond the core service',
  rows: [
    {
      id: 'addon', label: { default: 'How often do clients add a second service or upgrade?', SO: 'How often do salon clients add a second service or upgrade?' }, weight: 1,
      options: [
        o('most', 'On most visits', null, { TICKET: -1 }),
        o('some', 'Sometimes', null, { TICKET: 0 }),
        o('rare', 'Rarely', null, { TICKET: 2 }, 'Clients rarely add a second service or upgrade.'),
        o('none', 'I don’t really offer add-ons', null, { TICKET: 2 }, 'You don’t really offer add-ons.'),
      ],
    },
    {
      id: 'retail', label: { default: 'In a typical week, how much product do clients buy from you?', SO: 'Weekly retail sales across the salon?' }, weight: 1,
      options: [
        o('r0', 'I don’t sell retail', 0, { RETAIL: 2 }, 'You don’t sell retail.'),
        o('r1', 'Only occasionally', 30, { RETAIL: 2 }, 'Retail sales are occasional.'),
        o('r2', '$50–200 a week', 125, { RETAIL: 0 }),
        o('r3', '$200–500 a week', 350, { RETAIL: -1 }),
        o('r4', 'Over $500 a week', 600, { RETAIL: -1 }),
      ],
      optionsBy: {
        SO: [
          o('r0', 'Almost none', 50, { RETAIL: 3 }, 'The salon sells almost no retail.'),
          o('r1', 'Under $300 a week', 200, { RETAIL: 2 }, 'Retail is under $300 a week across the salon.'),
          o('r2', '$300–1,000 a week', 650, { RETAIL: 0 }),
          o('r3', '$1,000–2,000 a week', 1500, { RETAIL: -1 }),
          o('r4', 'Over $2,000 a week', 2500, { RETAIL: -1 }),
        ],
      },
    },
  ],
  dims: ['TICKET', 'RETAIL'], interventions: ['addon_strategy', 'retail_strategy', 'stylist_coaching'],
  model: 'Retail/week R → retail per visit; included in revenue per appointment.',
  tests: 'Ticket expansion without more hours.',
  healthy: 'Add-ons on many visits; retail ≥ ~$2–5 per visit', warning: 'Rare add-ons; occasional retail', critical: 'No add-ons and no retail while booked full',
  interpretation: 'Add-ons and retail raise revenue per appointment without adding appointments.',
  reasoning: 'RETAIL down-weighted for IP (lash/brow) and makeup. For SO, retail judged relative to estimated service revenue (R20).',
});
q({
  id: 'Q35', domain: 'Service mix', personas: IND, core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { any: [{ q: 'Q09', gte: 0.82 }, { q: 'Q05', in: ['fewer_hours', 'earn_more'] }, { q: 'Q12', has: 'scattered' }, { q: 'Q04', in: ['plateau'] }] },
  trigger_text: '≥ 75–90% booked, or goal = fewer hours/earn more, or scattered gaps, or plateaued',
  text: 'Do the services that take up most of your time also bring in most of your money?',
  options: [
    o('yes', 'Yes — my longest services are my best earners', null, { MIX: -1 }),
    o('partly', 'Partly', null, { MIX: 1 }),
    o('no', 'No — some services take a lot of time for little money', null, { MIX: 3 }, 'Some services take a lot of your time for little money.'),
    o('unsure', 'I’ve never looked at it that way', null, { MIX: 'U', FIN: 1 }, 'You haven’t compared what each service earns per hour.'),
  ],
  dims: ['MIX', 'TICKET'], interventions: ['service_profitability', 'menu_restructure', 'schedule_architecture'],
  tests: 'Time economics: whether prime hours go to valuable work.',
  healthy: 'Yes', warning: 'Partly / never looked', critical: 'No, with a full book',
  interpretation: 'A full schedule can still under-earn if low-value services fill your best hours.',
  reasoning: 'Critical only matters at high utilization (the hours have an opportunity cost). Amplified by R01.',
});
q({
  id: 'Q36', domain: 'Positioning / clientele', personas: ['CS', 'BR', 'SR', 'IP'], core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { any: [{ q: 'Q31', in: ['lower', 'much_lower'] }, { q: 'Q15', in: ['assigned', 'few'] }, { q: 'Q05', in: ['raise_prices'] }, { q: 'Q27', hasAny: ['fit', 'deal', 'price'] }] },
  trigger_text: 'Priced below market, CS without request base, goal = raise prices, or first-timers leave over fit/deal/price',
  text: 'How well do your new clients match the work you want to be doing?',
  options: [
    o('ideal', 'Mostly the clients and work I want', null, { BRAND: -1 }),
    o('mixed', 'A mix', null, { BRAND: 1 }, 'Your new clients are a mix of the work you want and work you don’t.'),
    o('poor', 'Often not a good fit — price shoppers or work I don’t want', null, { BRAND: 3, PRICE: 1 }, 'Many new clients aren’t a good fit for the work you want — often price shoppers.'),
  ],
  dims: ['BRAND', 'PRICE', 'RET'], interventions: ['niche_positioning', 'portfolio_photography', 'discount_reduction'],
  tests: 'Clientele fit — a root cause behind low ticket and weak retention.',
  healthy: 'Mostly ideal', warning: 'A mix', critical: 'Often not a fit',
  interpretation: 'Who you attract decides what you can charge and who stays.',
  reasoning: 'Poor fit + weak retention → retention issue is upstream (positioning), not a follow-up-system gap. Changes intervention selection.',
});
q({
  id: 'Q37', domain: 'Website / booking experience', personas: ['CS', 'BR', 'SR', 'IP'], core: false, type: 'composite', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q17', in: ['busy_few'] }, { q: 'Q36', in: ['mixed', 'poor'] }, { q: 'Q20', lte: 0.45 }, { all: [{ persona: SOLO }, { q: 'Q09', lte: 0.5 }] }] },
  trigger_text: 'Social busy/few bookings, clientele fit mixed or poor, conversion ≤ 4–5/10, or solo ≤ 60% booked',
  text: 'How you show up online',
  rows: [
    {
      id: 'specialty', label: 'Would a stranger looking at your photos and profile know what you specialize in?', weight: 1,
      options: [
        o('clear', 'Yes — it’s obvious', null, { BRAND: -1 }),
        o('somewhat', 'Somewhat', null, { BRAND: 1 }, 'It’s only somewhat clear from your photos and profile what you specialize in.'),
        o('no', 'Not really — I do a bit of everything', null, { BRAND: 2 }, 'Your profile doesn’t make clear what you specialize in.'),
      ],
    },
    {
      id: 'link', label: 'Is there one link where someone can see your work, your prices and book?', weight: 1,
      options: [
        o('all', 'Yes — work, prices and booking', null, { DIGITAL: -1, CONV: -1 }),
        o('partial', 'Partly — prices or booking are missing', null, { DIGITAL: 1, CONV: 1 }, 'Your prices or booking aren’t in the same place as your work.'),
        o('none', 'No', null, { DIGITAL: 2, CONV: 1 }, 'There’s no single link where someone can see your work, prices and book.'),
      ],
      optionsBy: {
        CS: [
          o('all', 'Yes — my own page or link', null, {}),
          o('salon', 'The salon handles booking', null, {}),
          o('none', 'No', null, { BRAND: 1 }),
        ],
      },
    },
  ],
  dims: ['BRAND', 'DIGITAL', 'CONV'], interventions: ['booking_link', 'portfolio_photography', 'niche_positioning'],
  tests: 'Specialty clarity and one-link booking path.',
  healthy: 'Clear specialty and one link that books', warning: 'Unclear specialty or missing prices', critical: 'No booking path, generalist presentation',
  interpretation: 'Clear specialty and visible prices pre-qualify clients before they ever message you.',
  reasoning: 'Visible prices reduce wasted inquiries (CONV) and attract fit clients (BRAND).',
});

// =====================================================================
// 17. REFERRALS
// =====================================================================
q({
  id: 'Q38', domain: 'Referrals', personas: ['CS', 'BR', 'SR', 'IP'], core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q15', in: ['assigned', 'few', 'half'] }, { all: [{ q: 'Q09', lte: 0.68 }, { q: 'Q13', lte: 4 }] }] },
  trigger_text: 'CS without a request-client base, or ≤ 60–75% booked with ≤ 3–5 new clients/month',
  text: 'How do referrals happen for you?',
  options: [
    o('program', 'A referral program with a thank-you or reward', null, { REF: -1 }),
    o('ask', 'I ask happy clients to send friends', null, { REF: 0 }),
    o('natural', 'They happen, but I don’t ask', null, { REF: 1 }, 'Referrals happen, but you don’t ask for them.'),
    o('rarely', 'I rarely get referrals', null, { REF: 2 }, 'You rarely get referrals.'),
  ],
  dims: ['REF', 'ACQ'], interventions: ['referral_system'],
  tests: 'Whether the cheapest, best-fit acquisition channel is being used deliberately.',
  healthy: 'Asks consistently or has a program', warning: 'Natural but unasked', critical: 'Rare referrals with weak retention (often a satisfaction/fit signal)',
  interpretation: 'Referred clients look like your best clients — and usually stay.',
  reasoning: 'For CS this is the main acquisition lever they fully control.',
});

// =====================================================================
// 18. REVIEWS / REPUTATION
// =====================================================================
q({
  id: 'Q39', domain: 'Reviews / reputation', personas: SOLO_SO, core: false, type: 'composite', weight: 2, conf: 0.7,
  trigger: { any: [{ persona: ['SO'] }, { q: 'Q09', lte: 0.82 }, { q: 'Q05', in: ['more_new', 'social'] }] },
  trigger_text: 'Owners always; solo when ≤ 90% booked or goal = more clients/social',
  text: { default: 'Your Google reviews', SO: 'The salon’s Google reviews' },
  rows: [
    {
      id: 'count', label: 'About how many?', weight: 1.2,
      options: [
        o('v0', 'None', 0, { REP: 3 }, 'You don’t have Google reviews yet.'),
        o('v1', '1–10', 5, { REP: 2 }),
        o('v2', '11–30', 20, { REP: 1 }),
        o('v3', '31–75', 50, { REP: 0 }),
        o('v4', '76–150', 110, { REP: -1 }),
        o('v5', 'More than 150', 200, { REP: -1 }),
        o('unsure', 'Not sure', null, { REP: 'U', FIN: 1 }),
      ],
      optionsBy: {
        SO: [
          o('v0', 'Under 25', 12, { REP: 3 }), o('v1', '25–75', 50, { REP: 2 }), o('v2', '75–150', 110, { REP: 1 }), o('v3', '150–300', 220, { REP: 0 }), o('v4', 'More than 300', 400, { REP: -1 }),
          o('unsure', 'Not sure', null, { REP: 'U', FIN: 1 }),
        ],
      },
      ev: 'You have about {label} Google reviews.',
    },
    {
      id: 'rating', label: 'Average rating?', weight: 1,
      options: [
        o('s48', '4.8 or higher', 4.9, { REP: -1 }), o('s45', '4.5–4.7', 4.6, { REP: 0 }), o('s40', '4.0–4.4', 4.2, { REP: 2 }, 'Your Google rating is between 4.0 and 4.4.'), o('s0', 'Under 4.0', 3.7, { REP: 3 }, 'Your Google rating is under 4.0.'), o('unsure', 'Not sure / no reviews', null, {}),
      ],
    },
    {
      id: 'ask', label: 'How do you ask for them?', weight: 0.8,
      options: [
        o('auto', 'Automatically after each visit', null, { REP: -1, AUTO: -1 }),
        o('person', 'I ask in person regularly', null, { REP: 0 }),
        o('sometimes', 'Now and then', null, { REP: 1 }),
        o('never', 'I don’t ask', null, { REP: 2 }, 'You don’t ask clients for reviews.'),
      ],
    },
  ],
  dims: ['REP', 'DISC', 'AUTO'], interventions: ['review_generation', 'review_recovery', 'gbp_optimization'],
  tests: 'Social proof for strangers and local-ranking input.',
  healthy: '31–75+ reviews at 4.5+, asked routinely', warning: '1–30 reviews, rarely asked', critical: 'No reviews, or rating under 4.0',
  interpretation: 'Reviews are how strangers decide to trust you, and they affect where you show up in search.',
  reasoning: 'Weak reviews feed DISC (local rank). Rating < 4.5 adds review recovery. Thresholds scaled up for salons.',
});

// =====================================================================
// 21. AUTOMATION / FOLLOW-UP
// =====================================================================
q({
  id: 'Q40', domain: 'Automation / follow-up', personas: SOLO, core: false, type: 'composite', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q05', in: ['organized', 'fewer_hours'] }, { all: [{ q: 'Q18', in: ['dm', 'call', 'mix'] }, { q: 'Q19', in: ['next', 'slow'] }] }, { all: [{ q: 'Q21', gte: 4.5 }, { not: { q: 'Q22', in: ['deposit'] } }] }] },
  trigger_text: 'Goal = organized/fewer hours, or slow replies to message bookings, or heavy leakage without deposits',
  text: 'Behind the scenes',
  rows: [
    {
      id: 'auto', label: 'What runs automatically, without you doing it by hand?', weight: 1.2,
      options: [
        o('most', 'Reminders, confirmations and follow-ups all run automatically', null, { AUTO: -1 }),
        o('some', 'Reminders are automatic; the rest I do by hand', null, { AUTO: 1 }),
        o('little', 'I do most of it by hand', null, { AUTO: 2 }, 'You handle most reminders and follow-up by hand.'),
        o('none', 'Nothing is automated', null, { AUTO: 3, CXL: 1 }, 'Nothing is automated — no reminders, confirmations or follow-ups.'),
      ],
    },
    {
      id: 'admin', label: 'Hours a week on messages, scheduling and admin outside appointments?', weight: 1,
      options: [
        o('a1', 'Under 2', 1, { AUTO: -1 }), o('a2', '2–5', 3.5, { AUTO: 0 }), o('a3', '5–10', 7.5, { AUTO: 2 }, 'You spend 5–10 unpaid hours a week on messages and admin.'), o('a4', 'More than 10', 12, { AUTO: 3 }, 'You spend more than 10 unpaid hours a week on messages and admin.'),
      ],
    },
  ],
  dims: ['AUTO', 'CXL'], interventions: ['booking_automation', 'reminders_confirmations', 'online_booking'],
  model: 'Admin hours/week → share of total working hours that is unpaid.',
  tests: 'Systems maturity and unpaid time.',
  healthy: 'Most follow-up automated, < 2–5 admin hours', warning: 'Mostly manual', critical: 'Nothing automated, 10+ admin hours',
  interpretation: 'Manual follow-up is the first thing that slips on a busy week.',
  reasoning: 'Automation is rarely the headline; it is usually the mechanism under rebooking, reminders and reactivation fixes.',
});

// =====================================================================
// 22. FINANCIAL VISIBILITY
// =====================================================================
q({
  id: 'Q41', domain: 'Financial visibility', personas: IND, core: true, type: 'multi', weight: 2, conf: 0.8,
  text: 'Which of these could you tell me in a few minutes, without guessing?',
  help: 'Choose all that apply. There’s no wrong answer.',
  options: [
    o('rev', 'Monthly revenue'),
    o('profit', 'Monthly profit or take-home'),
    o('ticket', 'Average ticket'),
    o('rebook', 'Rebooking rate'),
    o('ret', 'How many first-timers return'),
    o('newc', 'New clients per month'),
    o('hourly', 'Revenue per hour worked'),
    o('none', 'None of these yet'),
  ],
  dims: ['FIN'], interventions: ['financial_dashboard'],
  tests: 'Whether decisions are made on numbers or instinct.',
  healthy: '5+ known', warning: '1–2 known', critical: 'None, plus several “not sure” answers elsewhere',
  interpretation: 'Not an accounting test — it shows which numbers would make your next decision easier.',
  reasoning: 'Scored as count known (≥5 → strong, 3–4 healthy, 2 watch, 1 warning, 0 critical) blended with the number of “not sure” answers across the assessment.',
});

// =====================================================================
// 23–25. SALON OWNER BRANCH (asked right after Q05 for owners)
// =====================================================================
q({
  id: 'Q42', domain: 'Staff / chair economics', personas: ['SO'], core: true, type: 'composite', weight: 3, conf: 0.9,
  text: 'Your salon today',
  rows: [
    { id: 'stations', label: 'Total stations or chairs', type: 'count', min: 1, max: 40, weight: 0 },
    { id: 'producing', label: 'How many are producing revenue most days?', type: 'count', min: 0, max: 40, weight: 0 },
    { id: 'commission', label: 'Commission or employee stylists (not counting you)', type: 'count', min: 0, max: 40, weight: 0 },
    { id: 'renters', label: 'Booth renters', type: 'count', min: 0, max: 40, weight: 0 },
  ],
  dims: ['CHAIR_UTIL'], interventions: ['chair_utilization_strategy', 'booth_rental_strategy', 'recruiting_funnel'],
  model: 'S stations, P producing, C commission stylists, Rn renters. Chair utilization = P ÷ S.',
  tests: 'Physical capacity vs productive capacity.',
  healthy: '≥ 90% of chairs producing', warning: '60–75% producing', critical: 'Under 60% producing',
  interpretation: 'Each station is a revenue engine. Empty ones still carry their share of rent.',
  reasoning: 'Chair utilization is derived (P/S). Why chairs are empty is asked next — the answer changes the diagnosis entirely.',
});
q({
  id: 'Q43', domain: 'Staff / chair economics', personas: ['SO'], core: false, type: 'multi', weight: 2.5, conf: 0.8,
  trigger: { q: 'Q42', rowLt: ['producing', 'stations'] }, trigger_text: 'Producing chairs < total stations',
  text: 'Why are the empty chairs empty?',
  help: 'Choose all that apply.',
  options: [
    o('recruit', 'I can’t find the right stylists', null, { RECRUIT: 3 }, 'You can’t find the right stylists to fill empty chairs.'),
    o('left', 'Stylists left and weren’t replaced', null, { STAFF_RET: 2, RECRUIT: 1 }, 'Stylists left and weren’t replaced.'),
    o('demand', 'Not enough clients to support another stylist', null, { ACQ: 2 }, 'You don’t think there are enough clients to support another stylist.'),
    o('economics', 'The numbers don’t work at our commission or rent', null, { OPS: 2 }, 'The commission or rent numbers don’t work for another chair.'),
    o('culture', 'Culture or space issues', null, { STAFF_RET: 2 }),
    o('not_tried', 'I haven’t actively tried to fill them', null, { RECRUIT: 1, OPS: 1 }),
  ],
  dims: ['RECRUIT', 'STAFF_RET', 'ACQ', 'OPS'], interventions: ['recruiting_funnel', 'staff_retention', 'commission_review', 'booth_rental_strategy'],
  tests: 'Root cause of empty-chair economics.',
  healthy: 'n/a', warning: 'Not tried / economics', critical: 'Can’t recruit while demand exists',
  interpretation: 'An empty chair can be a people problem, a demand problem or a pay-structure problem. Each has a different fix.',
  reasoning: 'Owner’s stated cause is checked against Q48: if stylist books are 80%+ full, “not enough clients” is contradicted and demand is NOT the constraint (R10).',
});
q({
  id: 'Q44', domain: 'Salon operations — recruiting', personas: ['SO'], core: true, type: 'single', weight: 2, conf: 0.7,
  text: 'The last time you needed a stylist, how did it go?',
  options: [
    o('quick', 'We filled it within a few weeks', null, { RECRUIT: -1 }),
    o('months', 'It took months', null, { RECRUIT: 2 }, 'The last stylist search took months.'),
    o('open', 'It’s still open', null, { RECRUIT: 3 }, 'Your last stylist opening is still unfilled.'),
    o('wom', 'We only hire through word of mouth', null, { RECRUIT: 1 }),
    o('na', 'Haven’t needed to recently', null, { RECRUIT: 0 }),
  ],
  dims: ['RECRUIT'], interventions: ['recruiting_funnel', 'apprenticeship_program'],
  tests: 'Recruiting capability.',
  healthy: 'Filled within weeks', warning: 'Took months / word of mouth only', critical: 'Still open',
  interpretation: 'If chairs sit empty because good people are hard to find, the constraint is recruiting — not customers.',
  reasoning: 'Combined with Q43 and Q48 in R10.',
});
q({
  id: 'Q45', domain: 'Salon operations — staff retention', personas: ['SO'], core: true, type: 'single', weight: 2, conf: 0.7,
  text: 'How long do your strong stylists tend to stay?',
  options: [o('t5', '5+ years', 6, { STAFF_RET: -1 }), o('t2', '2–5 years', 3.5, { STAFF_RET: 0 }), o('t1', '1–2 years', 1.5, { STAFF_RET: 2 }, 'Strong stylists tend to stay only 1–2 years.'), o('t0', 'Under a year', 0.5, { STAFF_RET: 3 }, 'Strong stylists tend to leave within a year.')],
  dims: ['STAFF_RET'], interventions: ['staff_retention', 'career_path'],
  tests: 'Stylist tenure.',
  healthy: '2–5+ years', warning: '1–2 years', critical: 'Under a year',
  interpretation: 'When good stylists leave, their production — and often their clients — leave too.',
  reasoning: 'Low tenure + clients following stylists (Q46) = the salon is renting out its client base.',
});
q({
  id: 'Q46', domain: 'Salon-level client retention', personas: ['SO'], core: true, type: 'single', weight: 2, conf: 0.7,
  text: 'When a stylist leaves, what happens to their clients?',
  options: [
    o('stay', 'Most stay with the salon', null, { RET: -1, OPS: -1 }),
    o('some', 'Some stay', null, { RET: 1 }),
    o('follow', 'Most follow the stylist', null, { RET: 2, OPS: 2 }, 'When a stylist leaves, most of their clients follow them.'),
    o('unknown', 'We don’t really know', null, { RET: 1, FIN: 1, OPS: 1 }),
  ],
  dims: ['RET', 'OPS', 'STAFF_RET'], interventions: ['salon_retention_program', 'stylist_dashboard'],
  tests: 'Whether client relationships belong to the salon or only to individual stylists.',
  healthy: 'Most stay', warning: 'Some', critical: 'Most follow',
  interpretation: 'Shows whether your client base belongs to the salon or only to individual stylists.',
  reasoning: 'Clients following stylists → salon-level retention program (team care, salon-owned records, salon-level follow-up).',
});
q({
  id: 'Q47', domain: 'Lead distribution / front desk', personas: ['SO'], core: true, type: 'composite', weight: 2, conf: 0.7,
  text: 'New salon clients',
  rows: [
    {
      id: 'who', label: 'Who handles calls and messages?', weight: 1,
      options: [
        o('desk', 'A dedicated front desk', null, { LEAD_DIST: -1 }),
        o('online', 'Mostly online booking', null, { LEAD_DIST: 0 }),
        o('stylists', 'Stylists, between clients', null, { LEAD_DIST: 2 }, 'Stylists answer calls and messages between clients.'),
        o('owner', 'Mostly me', null, { LEAD_DIST: 2, OWNER_DEP: 1 }, 'You personally handle most calls and messages.'),
      ],
    },
    {
      id: 'assign', label: 'How are new clients matched to a stylist?', weight: 1.2,
      options: [
        o('match', 'By specialty and fit', null, { LEAD_DIST: -1 }),
        o('avail', 'By who’s available', null, { LEAD_DIST: 0 }),
        o('rotation', 'Rotation', null, { LEAD_DIST: 0 }),
        o('own', 'Stylists bring their own; the salon doesn’t generate many', null, { LEAD_DIST: 1, ACQ: 1 }),
        o('none', 'No real system', null, { LEAD_DIST: 3 }, 'There’s no real system for matching new clients to stylists.'),
      ],
    },
  ],
  dims: ['LEAD_DIST', 'OWNER_DEP', 'ACQ'], interventions: ['lead_distribution', 'front_desk_conversion'],
  tests: 'Front-desk conversion and lead routing.',
  healthy: 'Front desk + matched by specialty and capacity', warning: 'Stylists answering between clients', critical: 'No system',
  interpretation: 'How new clients are handled decides which stylists’ books grow.',
  reasoning: 'If stylist books are under 60% and routing is random/none, fix routing before buying demand.',
});
q({
  id: 'Q48', domain: 'Staff / chair economics', personas: ['SO'], core: true, type: 'single', weight: 3, conf: 0.8,
  text: 'How full are your stylists’ books, on average?',
  options: [
    o('full', 'Most are 80%+ booked', 0.88, { STYLIST_PROD: -1 }),
    o('mixed', 'Mixed — some full, some not', 0.7, { STYLIST_PROD: 1 }),
    o('low', 'Most are under 60%', 0.5, { STYLIST_PROD: 3, ACQ: 2 }, 'Most stylists are under 60% booked.'),
    o('unsure', 'I don’t really know', null, { STYLIST_PROD: 'U', OPS: 2, FIN: 1 }, 'You don’t have a clear view of how full each stylist is.'),
  ],
  dims: ['STYLIST_PROD', 'ACQ', 'OPS'], interventions: ['stylist_dashboard', 'lead_distribution', 'stylist_coaching'],
  model: 'Average stylist fullness → productivity factor (full 1.0, mixed 0.8, low 0.6).',
  tests: 'Whether the salon has a demand problem or a supply (people) problem.',
  healthy: 'Most 80%+', warning: 'Mixed', critical: 'Most under 60%',
  interpretation: 'Full stylists + empty chairs = a people problem. Empty books + empty chairs = a demand problem.',
  reasoning: 'Key routing signal for owners. ≥ 80% → R10 (demand not the constraint). < 60% → R11 (demand/routing before recruiting).',
});
q({
  id: 'Q49', domain: 'Salon operations — measurement', personas: ['SO'], core: true, type: 'multi', weight: 2, conf: 0.7,
  text: 'Which of these can you see for each stylist?',
  help: 'Choose all that apply.',
  options: [o('rev', 'Revenue'), o('rebook', 'Rebooking rate'), o('ret', 'Client retention'), o('ticket', 'Average ticket'), o('retail', 'Retail sales'), o('none', 'None of these, really')],
  dims: ['OPS', 'STYLIST_PROD', 'FIN'], interventions: ['stylist_dashboard', 'financial_dashboard'],
  tests: 'Performance visibility by stylist.',
  healthy: '4+ metrics', warning: '1–2', critical: 'None',
  interpretation: 'You can’t coach what you can’t see.',
  reasoning: 'Scored by count. None → OPS critical; also lowers confidence on STYLIST_PROD.',
});
q({
  id: 'Q50', domain: 'Staff / chair economics', personas: ['SO'], core: true, type: 'composite', weight: 0, conf: 0,
  text: 'Chair economics',
  rows: [
    {
      id: 'prod', label: 'What does a busy commission stylist bring in from services in a typical week?',
      options: [o('p1', 'Under $1,200', 900), o('p2', '$1,200–1,800', 1500), o('p3', '$1,800–2,700', 2250), o('p4', '$2,700–3,800', 3250), o('p5', 'Over $3,800', 4500), o('na', 'We don’t have commission stylists', null)],
    },
    {
      id: 'rent', label: 'Weekly rent per booth renter',
      options: [o('b1', 'Under $150', 125), o('b2', '$150–250', 200), o('b3', '$250–350', 300), o('b4', 'Over $350', 425), o('na', 'We don’t rent chairs', null)],
    },
  ],
  dims: [], interventions: ['commission_review', 'booth_rental_strategy'],
  model: 'Vs = weekly services of a busy commission stylist; rent per chair. → revenue per chair, value of an empty chair under each model.',
  tests: 'Economic inputs for the salon model.',
  healthy: 'n/a (input)', warning: 'n/a', critical: 'n/a',
  interpretation: 'Lets the report show what an empty chair is worth under commission vs rental.',
  reasoning: 'Input only.',
});
q({
  id: 'Q51', domain: 'Owner dependence', personas: ['SO'], core: true, type: 'single', weight: 2.5, conf: 0.8,
  text: 'Roughly what share of the salon’s service revenue comes from your own chair?',
  options: [o('o1', 'Under 15%', 0.1, { OWNER_DEP: -1 }), o('o2', '15–30%', 0.22, { OWNER_DEP: 0 }), o('o3', '30–50%', 0.4, { OWNER_DEP: 2 }), o('o4', 'Over 50%', 0.6, { OWNER_DEP: 3 }), o('none', 'I don’t take clients', 0, { OWNER_DEP: -1 })],
  ev: '{label} of the salon’s service revenue comes from your own chair.',
  dims: ['OWNER_DEP'], interventions: ['owner_transition_plan', 'manager_role'],
  model: 'Owner share s → salon-independent service revenue = commission revenue (owner revenue = s × total).',
  tests: 'Revenue dependence on the owner.',
  healthy: 'Under 15–30%', warning: '30–50%', critical: 'Over 50%',
  interpretation: 'The more revenue runs through your chair, the more the business is a job with overhead.',
  reasoning: 'Weighted by owner intent (Q53): an owner who wants to stay behind the chair gets this framed as risk, not a top priority.',
});
q({
  id: 'Q52', domain: 'Owner dependence', personas: ['SO'], core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { any: [{ q: 'Q51', gte: 0.22 }, { q: 'Q53', in: ['reduce', 'step'] }] }, trigger_text: 'Owner share ≥ 15–30%, or owner wants to reduce/step away',
  text: 'If you stopped taking clients for 30 days, what would happen?',
  options: [
    o('fine', 'The salon would run fine', null, { OWNER_DEP: -1, OPS: -1 }),
    o('dip', 'Revenue would dip, but we’d manage', null, { OWNER_DEP: 0 }),
    o('serious', 'It would be a serious problem', null, { OWNER_DEP: 2, OPS: 1 }, 'A month away from your chair would be a serious problem for the salon.'),
    o('couldnt', 'We couldn’t really operate', null, { OWNER_DEP: 3, OPS: 2 }, 'The salon couldn’t really operate without you behind the chair for a month.'),
  ],
  dims: ['OWNER_DEP', 'OPS'], interventions: ['owner_transition_plan', 'operational_systems', 'manager_role'],
  tests: 'Operational (not just revenue) dependence on the owner.',
  healthy: 'Runs fine', warning: 'Serious problem', critical: 'Couldn’t operate',
  interpretation: 'A simple test of whether you own a business or a demanding job.',
  reasoning: 'Distinguishes revenue dependence from operational dependence.',
});
q({
  id: 'Q53', domain: 'Owner dependence', personas: ['SO'], core: true, type: 'single', weight: 0, conf: 0,
  text: 'Over the next few years, what do you want your own role to be?',
  options: [o('stay', 'Stay behind the chair full-time — I love the work'), o('reduce', 'Cut back my chair time'), o('step', 'Step away from the chair entirely'), o('unsure', 'Not sure yet')],
  dims: [], interventions: ['owner_transition_plan'],
  tests: 'Owner intent — modulates how owner dependence is prioritized.',
  healthy: 'n/a', warning: 'n/a', critical: 'n/a',
  interpretation: 'We don’t assume you want to leave the chair. Your answer changes what we prioritize.',
  reasoning: 'R12: stay → OWNER_DEP × 0.6 (framed as risk); reduce/step + share ≥ 30% → OWNER_DEP floor at HIGH PRIORITY.',
});
q({
  id: 'Q54', domain: 'Owner dependence', personas: ['SO'], core: false, type: 'single', weight: 1.5, conf: 0.6,
  trigger: { any: [{ q: 'Q53', in: ['reduce', 'step'] }, { q: 'Q51', gte: 0.4 }] }, trigger_text: 'Owner wants to reduce/step away, or owner share ≥ 30–50%',
  text: 'Outside of doing clients, where does most of your time go?',
  options: [
    o('fires', 'Managing people and putting out fires', null, { OPS: 2 }, 'Most of your non-service time goes to managing people and putting out fires.'),
    o('admin', 'Admin, scheduling and the books', null, { OPS: 2 }, 'Most of your non-service time goes to admin and scheduling.'),
    o('marketing', 'Marketing', null, { OPS: 0 }),
    o('strategy', 'Planning and improving the business', null, { OPS: -1 }),
    o('none', 'There’s barely any time outside the chair', null, { OPS: 3, OWNER_DEP: 2 }, 'There’s barely any time outside the chair to work on the business.'),
  ],
  dims: ['OPS', 'OWNER_DEP'], interventions: ['manager_role', 'operational_systems'],
  tests: 'Owner time allocation — firefighting vs building.',
  healthy: 'Planning and improving', warning: 'Admin / firefighting', critical: 'No time outside the chair',
  interpretation: 'Where your non-chair time goes shows what to delegate first.',
  reasoning: 'Firefighting/admin → operational systems + manager role before marketing.',
});
q({
  id: 'Q55', domain: 'Staff / chair economics', personas: ['SO'], core: false, type: 'single', weight: 2, conf: 0.7,
  trigger: { q: 'Q42', row: 'commission', gte: 1 }, trigger_text: 'At least one commission stylist',
  text: 'How confident are you that your commission structure leaves the salon a healthy margin?',
  options: [
    o('sure', 'Confident — I know the margin on each stylist', null, { OPS: -1 }),
    o('rough', 'Roughly', null, { OPS: 1 }),
    o('unsure', 'Not sure the numbers work', null, { OPS: 2, FIN: 1 }, 'You aren’t sure the commission structure leaves a healthy margin.'),
    o('losing', 'I suspect some chairs lose money', null, { OPS: 3, STYLIST_PROD: 2 }, 'You suspect some commission chairs lose money.'),
  ],
  dims: ['OPS', 'STYLIST_PROD', 'FIN'], interventions: ['commission_review', 'stylist_dashboard'],
  tests: 'Commission economics.',
  healthy: 'Knows margin by stylist', warning: 'Not sure', critical: 'Suspects losses',
  interpretation: 'Commission only works when each productive chair clears its costs.',
  reasoning: 'Low-productivity stylists on standard commission are the most common hidden loss in commission salons.',
});

// Ask order: owners answer the leverage block before the shared questions.
const SEQUENCE_DEFAULT = Q.map((x) => x.id);
const OWNER_BLOCK = ['Q42', 'Q43', 'Q44', 'Q45', 'Q46', 'Q47', 'Q48', 'Q49', 'Q50', 'Q51', 'Q52', 'Q53', 'Q54', 'Q55'];
const SEQUENCE_SO = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', ...OWNER_BLOCK, ...SEQUENCE_DEFAULT.filter((id) => !OWNER_BLOCK.includes(id) && !['Q01', 'Q02', 'Q03', 'Q04', 'Q05'].includes(id))];

module.exports = { QUESTIONS: Q, SEQUENCE_DEFAULT, SEQUENCE_SO };
