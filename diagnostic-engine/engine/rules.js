// Beauty Business Growth Diagnostic — CROSS-ANSWER REASONING RULES
//
// Rules run after per-answer scoring. Pass 'answers' rules see answers + economic metrics.
// Pass 'dims' rules additionally see the provisional dimension concern scores.
// Conditions extend the question trigger DSL with:  {m:'metric', gte|lte}  {dim:'ID', gte|lte}  {tag:'X'}
// Effects:
//   scale:{DIM:f}   concern = 25 + (concern − 25) × f   (only moves concern that is above healthy)
//   floor:{DIM:c}   concern = max(concern, c)  (only if the dimension has evidence)
//   cap:{DIM:c}     concern = min(concern, c)
//   impact:{DIM:f}  ranking multiplier for top-3 selection (does not change status)
//   note:{DIM:'…'}  annotation shown in report and admin
//   dontBuy:[{id, reason}]   adds to “What I wouldn’t spend money on right now”
//   suppress:[interventionIds]   gateDemand:true (demand-side interventions not recommended)
//   demote:[DIM]    keeps the status but removes the dimension from top-3 (it is a symptom of another finding)
//   tag:'X'         flag used by headline, belief check and closing sequence
// Reason templates use {placeholders} filled from formatted metrics.

const SOCIAL = ['ig', 'tiktok', 'facebook'];

const RULES = [
  // ---------------- capacity gates ----------------
  {
    id: 'R01', pass: 'answers', name: 'Capacity gate — schedule is full',
    why: 'When the schedule is ≥ ~82% booked (or booked 4+ weeks out), more clients are not the constraint. Value per hour is.',
    when: { any: [{ m: 'U', gte: 0.82 }, { all: [{ q: 'Q10', in: ['four', 'turning'] }, { m: 'U', gte: 0.68 }] }] },
    effects: {
      scale: { ACQ: 0.3, DISC: 0.5, BRAND: 0.6, REF: 0.6, REP: 0.8, CONV: 0.7, PRICE: 1.35, TICKET: 1.25, MIX: 1.25, RETAIL: 1.15 },
      gateDemand: true, tag: 'ACQ_NOT_CONSTRAINT',
      note: { ACQ: 'Not your primary constraint — your schedule is already about {U} booked.' },
      dontBuy: [
        { id: 'ads', reason: 'Your schedule is already about {U} booked. Before paying for more demand, I’d look at pricing, rebooking and what each appointment earns.' },
        { id: 'followers', reason: 'More reach brings more people asking for time you don’t have. Followers are not your constraint right now.' },
        { id: 'discounts', reason: 'Discounts fill time you don’t have and lower what each hour earns.' },
      ],
    },
  },
  {
    id: 'R02', pass: 'answers', name: 'Capacity gate — mostly full',
    why: 'At 60–82% booked, acquisition is a secondary lever; value per hour starts to matter more.',
    when: { all: [{ m: 'U', gte: 0.66 }, { m: 'U', lt: 0.82 }] },
    effects: { scale: { ACQ: 0.75, DISC: 0.85 }, impact: { PRICE: 1.1, TICKET: 1.1 } },
  },
  {
    id: 'R03', pass: 'answers', name: 'Low utilization — demand matters',
    why: 'Under ~50% booked, open capacity is real and demand dimensions deserve weight. Raising prices into an empty book is risky.',
    when: { m: 'U', lte: 0.5 },
    effects: { scale: { ACQ: 1.25, DISC: 1.2, UTIL: 1.1, PRICE: 0.75, TICKET: 0.8, RETAIL: 0.8, MIX: 0.8 }, note: { PRICE: 'With this much open time, I’d build demand before testing price increases.' } },
  },
  // ---------------- leakage & conversion ----------------
  {
    id: 'R07', pass: 'answers', name: 'Cancellation leakage is material',
    why: '10%+ of scheduled appointments lost late is a capacity problem disguised as a demand problem.',
    when: { m: 'leakRate', gte: 0.1 },
    effects: { scale: { CXL: 1.2 }, tag: 'LEAKAGE', dontBuy: [{ id: 'followers', reason: 'Late cancellations already remove about {lostHours} hours a week from your schedule. Protecting booked time comes before attracting more people to book it.' }] },
  },
  {
    id: 'R06', pass: 'answers', name: 'Platform concentration',
    why: 'Discovery that depends on a single social platform is fragile and misses high-intent search.',
    when: { all: [{ persona: ['BR', 'SR', 'IP'] }, { q: 'Q14', hasAny: SOCIAL }, { not: { q: 'Q14', hasAny: ['google', 'referral', 'apps', 'pros', 'website', 'walkin'] } }] },
    effects: { floor: { DISC: 56 }, note: { DISC: 'Nearly all discovery depends on social platforms.' }, tag: 'SOCIAL_ONLY' },
  },
  // ---------------- pricing ----------------
  {
    id: 'R14', pass: 'answers', name: 'Underpricing — full book, stale prices',
    why: 'Demand exceeding capacity while prices stay flat is the clearest pricing signal available without a market study.',
    when: {
      all: [
        { persona: ['BR', 'SR', 'IP', 'CS'] },
        { any: [{ m: 'U', gte: 0.82 }, { q: 'Q10', in: ['four', 'turning'] }] },
        { any: [{ q: 'Q30', row: 'last', gte: 2.5 }, { q: 'Q31', in: ['lower', 'much_lower'] }, { q: 'Q30', row: 'fear', in: ['often'] }] },
      ],
    },
    effects: {
      floor: { PRICE: 66 }, tag: 'UNDERPRICED', impact: { PRICE: 1.15 },
      dontBuy: [{ id: 'more_capacity', reason: 'Before adding hours or help, make sure the hours you already have are priced to match the demand you have.' }],
    },
  },
  {
    id: 'R22', pass: 'answers', name: 'Overbooked but under-earning',
    why: 'High utilization with low revenue per booked hour means the schedule is full of the wrong economics.',
    when: { all: [{ m: 'U', gte: 0.82 }, { m: 'rphBooked', lt: 65 }] },
    effects: { floor: { TICKET: 56 }, tag: 'OVERBOOKED_UNDEREARNING', note: { TICKET: 'Full, but each booked hour earns about {rphBooked}.' } },
  },
  {
    id: 'R13', pass: 'answers', name: 'Rent burden',
    why: 'When rent consumes a quarter or more of service revenue, every empty or underpriced hour hurts more.',
    when: { m: 'rentShare', gte: 0.25 },
    effects: { scale: { UTIL: 1.2, PRICE: 1.1 }, note: { UTIL: 'Rent takes about {rentShare} of your service revenue.' } },
  },
  // ---------------- clientele ----------------
  {
    id: 'R19', pass: 'answers', name: 'Wrong clientele — deal-driven churn',
    why: 'Clients attracted by price leave by price. A retention system won’t fix an attraction problem.',
    when: { any: [{ q: 'Q36', in: ['poor'] }, { all: [{ q: 'Q27', hasAny: ['deal', 'fit'] }, { q: 'Q32', in: ['often', 'most'] }] }] },
    effects: { suppress: ['new_client_offer'], tag: 'WRONG_CLIENTELE', note: { RET: 'Retention looks upstream: who you attract affects who stays.' }, impact: { BRAND: 1.2 }, dontBuy: [{ id: 'discounts', reason: 'Discounts are already attracting clients who don’t stay. More of them would make that worse.' }] },
  },
  // ---------------- service cycle ----------------
  {
    id: 'R15a', pass: 'answers', name: 'Short-cycle specialty — rebooking is the engine',
    why: 'Lash, nail, brow and barbering clients return every 2–4 weeks; each missed prebook costs many visits a year.',
    when: { q: 'Q03', in: ['lash', 'nails', 'barber', 'brow'] },
    effects: { impact: { REBOOK: 1.25, CXL: 1.1 } },
  },
  {
    id: 'R15b', pass: 'answers', name: 'Event-based work',
    why: 'Makeup and event work doesn’t run on rebooking cycles.',
    when: { q: 'Q03', in: ['makeup'] },
    effects: { scale: { REBOOK: 0.4, RET: 0.6, REACT: 0.5 }, impact: { REF: 1.3, ACQ: 1.2 } },
  },
  // ---------------- reactivation ----------------
  {
    id: 'R16a', pass: 'answers', name: 'Dormant database',
    why: 'A large past-client list with no outreach is the cheapest demand available.',
    when: { all: [{ m: 'dbSize', gte: 500 }, { q: 'Q29', in: ['nothing', 'occasional'] }] },
    effects: { floor: { REACT: 56 }, impact: { REACT: 1.15 }, note: { REACT: 'About {db} past clients are on your list, and most who stop coming don’t get a personal invitation back.' } },
  },
  {
    id: 'R16c', pass: 'answers', name: 'Dormant database, no outreach at all',
    why: 'A large list with nothing happening is a clear, cheap opportunity.',
    when: { all: [{ m: 'dbSize', gte: 500 }, { q: 'Q29', in: ['nothing'] }] },
    effects: { floor: { REACT: 64 } },
  },
  {
    id: 'R16b', pass: 'answers', name: 'Small database',
    why: 'With a small list, reactivation can’t move much.',
    when: { m: 'dbSize', lt: 200 },
    effects: { scale: { REACT: 0.6 } },
  },
  // ---------------- commission stylist ----------------
  {
    id: 'R09', pass: 'answers', name: 'Commission stylist — control boundary',
    why: 'A commission stylist doesn’t control salon marketing, pricing or policy. Recommend only what they control; frame the rest as a conversation with the salon.',
    when: { persona: ['CS'] },
    effects: {
      tag: 'CS_CONTROL',
      dontBuy: [{ id: 'personal_marketing_cs', reason: 'Your salon controls advertising and its Google presence. Your highest-return levers are the ones you control: request clients, rebooking, referrals and what each visit includes.' }],
    },
  },
  {
    id: 'R18', pass: 'answers', name: 'New commission stylist — building inside a salon',
    why: 'Early in a career, the job is converting assigned first visits into request clients.',
    when: { all: [{ persona: ['CS'] }, { q: 'Q15', in: ['assigned', 'few'] }, { any: [{ q: 'Q04', in: ['building', 'rebuild'] }, { m: 'U', lte: 0.6 }] }] },
    effects: { impact: { BRAND: 1.25, REBOOK: 1.15, REF: 1.2, ACQ: 1.1 }, floor: { BRAND: 56 }, tag: 'CS_BUILDING', note: { ACQ: 'You don’t control the salon’s marketing — but you do control whether its first-time clients become yours.' } },
  },
  // ---------------- salon owner ----------------
  {
    id: 'R10', pass: 'answers', name: 'Salon — supply constraint (people, not customers)',
    why: 'Empty chairs while stylists are 80%+ booked means demand exists. The constraint is productive people.',
    when: { all: [{ persona: ['SO'] }, { q: 'Q48', in: ['full'] }] },
    effects: {
      scale: { ACQ: 0.3, DISC: 0.5 }, gateDemand: true, tag: 'SUPPLY_CONSTRAINT',
      note: { ACQ: 'Not the primary constraint — your stylists are already mostly 80%+ booked.' },
      dontBuy: [{ id: 'salon_ads', reason: 'Your stylists are already mostly 80%+ booked. More customers would wait for stylists you don’t have yet.' }],
    },
  },
  {
    id: 'R10b', pass: 'answers', name: 'Salon — empty chairs with demand',
    why: 'Same conditions plus at least one empty station: chair utilization and recruiting are the priority.',
    when: { all: [{ persona: ['SO'] }, { q: 'Q48', in: ['full', 'mixed'] }, { m: 'empty', gte: 1 }, { m: 'chairUtil', lt: 0.85 }] },
    effects: { floor: { CHAIR_UTIL: 66 }, impact: { CHAIR_UTIL: 1.1, RECRUIT: 1.1 } },
  },
  {
    id: 'R10c', pass: 'answers', name: 'Salon — recruiting is the blocker',
    when: { all: [{ persona: ['SO'] }, { m: 'empty', gte: 1 }, { any: [{ q: 'Q44', in: ['months', 'open'] }, { q: 'Q43', has: 'recruit' }] }] },
    why: 'Chairs are empty and recruiting is slow or failing.',
    effects: { floor: { RECRUIT: 66 } },
  },
  {
    id: 'R11', pass: 'answers', name: 'Salon — demand/routing before recruiting',
    why: 'If most stylists are under 60% booked, adding stylists spreads the same demand thinner.',
    when: { all: [{ persona: ['SO'] }, { q: 'Q48', in: ['low'] }] },
    effects: {
      scale: { RECRUIT: 0.6, CHAIR_UTIL: 0.6 }, impact: { ACQ: 1.2, LEAD_DIST: 1.2 }, tag: 'SALON_DEMAND',
      dontBuy: [{ id: 'recruit_first', reason: 'Most stylists are under 60% booked. Adding stylists before their books fill spreads the same demand thinner.' }],
    },
  },
  {
    id: 'R12a', pass: 'answers', name: 'Owner wants to stay behind the chair',
    why: 'Owner dependence is a risk to note, not a goal to impose.',
    when: { all: [{ persona: ['SO'] }, { q: 'Q53', in: ['stay'] }] },
    effects: { scale: { OWNER_DEP: 0.6 }, note: { OWNER_DEP: 'You’ve said you want to stay behind the chair, so this is framed as a risk to manage rather than a goal.' } },
  },
  {
    id: 'R12b', pass: 'answers', name: 'Owner wants out of the chair, but revenue depends on it',
    why: 'Stated intent to step back + high owner share = the defining constraint of the business.',
    when: { all: [{ persona: ['SO'] }, { q: 'Q53', in: ['reduce', 'step'] }, { any: [{ m: 's', gte: 0.3 }, { q: 'Q52', in: ['serious', 'couldnt'] }] }] },
    effects: { floor: { OWNER_DEP: 68 }, impact: { OWNER_DEP: 1.2 }, tag: 'OWNER_TRAPPED' },
  },
  {
    id: 'R20', pass: 'answers', name: 'Salon retail below 5% of services',
    why: 'Salon retail under ~5% of service revenue is usually a checkout-habit problem.',
    when: { all: [{ persona: ['SO'] }, { m: 'retailShare', lt: 0.05 }] },
    effects: { floor: { RETAIL: 56 } },
  },
  // ---------------- beliefs ----------------
  {
    id: 'R24', pass: 'answers', name: 'Wants social growth while search/referrals already work',
    why: 'If Google and referrals already bring clients, a bigger following is rarely the lever.',
    when: { all: [{ q: 'Q05', in: ['social'] }, { q: 'Q14', hasAny: ['google', 'referral'] }] },
    effects: { dontBuy: [{ id: 'followers', reason: 'Google and referrals already bring you new clients. A bigger following won’t fix what happens after a client’s first visit.' }] },
  },
  // ---------------- measurement ----------------
  {
    id: 'R17', pass: 'answers', name: 'Measurement gap',
    why: 'Several “not sure” answers mean decisions are being made blind — and lower our confidence.',
    when: { m: 'unknowns', gte: 3 },
    effects: { floor: { FIN: 56 }, note: { FIN: 'Several of your answers were “not sure” — which is itself useful to know.' } },
  },
  // ---------------- dimension-level (second pass) ----------------
  {
    id: 'R04', pass: 'dims', name: 'Leaky bucket — fix retention before buying demand',
    why: 'When most first-timers don’t return or don’t prebook, more acquisition mostly buys one-time visits.',
    when: { all: [{ any: [{ dim: 'RET', gte: 56 }, { dim: 'REBOOK', gte: 56 }] }, { not: { tag: 'ACQ_NOT_CONSTRAINT' } }] },
    effects: {
      impact: { ACQ: 0.7, DISC: 0.75, BRAND: 0.85 }, tag: 'LEAKY',
      dontBuy: [{ id: 'ads', reason: 'About {F10} of 10 first-time clients come back. Paying for more first visits before fixing that mostly buys one-time visits.' }],
    },
  },
  {
    id: 'R05', pass: 'dims', name: 'Conversion before demand',
    why: 'If inquiries already arrive and don’t book, more reach mostly produces more unbooked messages.',
    when: { all: [{ dim: 'CONV', gte: 56 }, { any: [{ m: 'inquiriesMo', gte: 10 }, { q: 'Q17', in: ['busy_few', 'works'] }] }] },
    effects: {
      impact: { ACQ: 0.7, BRAND: 0.8 }, tag: 'CONVERSION_FIRST',
      dontBuy: [{ id: 'followers', reason: 'You already get inquiries — about {conv10} of 10 end up booked. More followers would mostly mean more unbooked messages.' }, { id: 'ads', reason: 'Paid traffic would land in the same inquiry process that’s already losing people.' }],
    },
  },
  {
    id: 'R23', pass: 'dims', name: 'Genuine demand need',
    why: 'Open capacity + healthy retention + healthy rebooking = the person genuinely needs more qualified demand.',
    when: { all: [{ persona: ['BR', 'SR', 'IP', 'CS'] }, { m: 'U', lte: 0.62 }, { dim: 'RET', lte: 30 }, { dim: 'REBOOK', lte: 36 }] },
    effects: {
      floor: { ACQ: 66 }, impact: { ACQ: 1.2, DISC: 1.15 }, tag: 'NEEDS_DEMAND',
      dontBuy: [{ id: 'new_software', reason: 'Your rebooking and retention already work. New software or retention tools won’t create the demand you’re missing.' }],
    },
  },
  {
    id: 'R29', pass: 'dims', name: 'Salon — people before customers',
    why: 'With empty stations and heavy owner dependence, more customers land on the same few people.',
    when: { all: [{ persona: ['SO'] }, { m: 'empty', gte: 1 }, { not: { tag: 'SALON_DEMAND' } }, { not: { tag: 'SUPPLY_CONSTRAINT' } }, { any: [{ dim: 'OWNER_DEP', gte: 56 }, { dim: 'RECRUIT', gte: 56 }, { dim: 'CHAIR_UTIL', gte: 56 }] }] },
    effects: { scale: { ACQ: 0.7 }, dontBuy: [{ id: 'salon_ads', reason: 'With {empty} empty stations and much of the revenue running through a few people, more customers would land on the same few chairs. I’d fix the people side first.' }] },
  },
  {
    id: 'R30', pass: 'dims', name: 'Low utilization is a symptom of the demand gap',
    why: 'When open time is explained by weak demand, ranking both would say the same thing twice.',
    when: { all: [{ dim: 'ACQ', gte: 56 }, { m: 'U', lte: 0.62 }] },
    effects: { demote: ['UTIL'], note: { UTIL: 'Mostly a result of the demand gap, not how the schedule is built.' } },
  },
  {
    id: 'R26', pass: 'dims', name: 'Website rebuild unnecessary',
    why: 'If people can already book online in one step, a rebuild rarely moves the constraint.',
    when: { all: [{ persona: ['BR', 'SR', 'IP'] }, { any: [{ q: 'Q18', in: ['online'] }, { q: 'Q37', row: 'link', in: ['all'] }] }] },
    effects: { dontBuy: [{ id: 'website_rebuild', reason: 'People can already find your work and book online. A new website is unlikely to change what’s actually holding you back.' }] },
  },
  {
    id: 'R27', pass: 'dims', name: 'Process gap, not software gap',
    why: 'When booking software exists but prebooking is weak, the gap is the checkout habit.',
    when: { all: [{ q: 'Q28', row: 'where', in: ['software'] }, { dim: 'REBOOK', gte: 50 }] },
    effects: { dontBuy: [{ id: 'new_software', reason: 'You already have booking software. The rebooking gap is a checkout habit, not a tool.' }] },
  },
  {
    id: 'R28', pass: 'dims', name: 'SEO not the lever',
    why: 'When local search already works, an SEO retainer rarely pays.',
    when: { all: [{ persona: ['BR', 'SR', 'IP', 'SO'] }, { dim: 'DISC', lte: 25 }] },
    effects: { dontBuy: [{ id: 'seo_package', reason: 'People searching nearby already find you. An SEO retainer would be paying for something that’s working.' }] },
  },
];

module.exports = { RULES };
