// Beauty Business Growth Diagnostic — taxonomy
// Personas, signal levels, status bands, and the 25 diagnostic dimensions.

const LEVELS = {
  '-1': { key: 'strong', label: 'Strong signal', concern: 0 },
  '0': { key: 'healthy', label: 'Healthy', concern: 22 },
  '1': { key: 'watch', label: 'Watch', concern: 40 },
  '2': { key: 'warning', label: 'Warning', concern: 58 },
  '3': { key: 'critical', label: 'Critical', concern: 85 },
  U: { key: 'unknown', label: "Doesn't know", concern: null },
};

// Status bands applied to a dimension's final concern score (0–100).
// There is deliberately no composite business score.
const STATUSES = [
  { key: 'STRONG', label: 'Strong', max: 10 },
  { key: 'HEALTHY', label: 'Healthy', max: 30 },
  { key: 'WATCH', label: 'Watch', max: 46 },
  { key: 'OPPORTUNITY', label: 'Opportunity', max: 64 },
  { key: 'HIGH_PRIORITY', label: 'High priority', max: 101 },
];
const STATUS_INSUFFICIENT = { key: 'INSUFFICIENT', label: 'Insufficient information' };
const STATUS_NA = { key: 'NA', label: 'Not applicable' };
const MIN_CONFIDENCE = 0.35;

const PERSONAS = {
  CS: {
    code: 'CS',
    label: 'Commission stylist',
    short: 'Commission / employee stylist',
    description:
      'You work inside someone else’s business. The salon controls most of the marketing, pricing, policies and booking systems. What you control is your own book: the clients who ask for you, whether they come back, what they spend with you, and how your skill and reputation compound over time.',
    controls: ['Personal brand and request clientele', 'Rebooking at the chair', 'Client experience and retention', 'Add-ons and retail recommendations', 'Referrals', 'Specialization and career level'],
    doesNotControl: ['Salon advertising', 'Salon website and Google profile', 'Menu prices (usually)', 'Booking software', 'Cancellation policy'],
    objective: 'Grow a personal book that is full, loyal and valuable — inside somebody else’s salon.',
    equationNote: 'For you, “demand” means clients who ask for you by name, and “revenue per appointment” works through your level, add-ons and retail rather than menu prices you set.',
  },
  BR: {
    code: 'BR',
    label: 'Booth renter',
    short: 'Booth / chair renter',
    description:
      'You’re running a small independent business inside someone else’s space. You control your prices, schedule, marketing, booking and client list, and you carry a fixed weekly rent whether the chair is busy or empty.',
    controls: ['Pricing', 'Schedule and hours', 'Marketing and booking', 'Client database', 'Products and retail', 'Expenses'],
    doesNotControl: ['The salon’s brand and foot traffic', 'Building-level policies'],
    objective: 'Turn a fixed weekly rent into the most profitable, predictable book possible.',
    equationNote: 'Every empty hour still carries rent, so utilization and revenue per hour matter more than raw client count.',
  },
  SR: {
    code: 'SR',
    label: 'Salon suite renter',
    short: 'Salon suite renter',
    description:
      'Your business behaves more like a small independent company than a job. You control nearly every variable that determines demand, pricing, retention and profitability — and you carry the highest fixed overhead of any solo model.',
    controls: ['The entire client experience', 'Pricing and policies', 'Brand, discovery and booking', 'Client database and follow-up', 'Retail', 'Hours'],
    doesNotControl: ['Building traffic (there usually isn’t any)'],
    objective: 'Build a durable micro-business with enough recurring clients, pricing and utilization to make the suite clearly worth it.',
    equationNote: 'A suite only pays when the recurring book is deep and the hours are valuable. Retention and pricing usually matter more than one-off demand.',
  },
  SO: {
    code: 'SO',
    label: 'Salon owner',
    short: 'Salon owner',
    description:
      'You run a business with several revenue engines: your own chair, the stylists who work for you, rented chairs, and retail. The questions that matter most are about leverage — how many productive people you have, how full their books are, and whether the business can run without you behind the chair.',
    controls: ['Who you hire and how you pay them', 'How new clients reach stylists', 'Salon-wide systems, pricing and policies', 'Marketing and reputation', 'What gets measured'],
    doesNotControl: ['Whether good stylists stay (directly)', 'Each stylist’s habits at the chair (without systems)'],
    objective: 'Build a profitable salon that does not depend on the owner’s own chair.',
    equationNote: 'Your version of the equation adds a leverage layer: People × Chairs × Productivity × Retention × Systems.',
  },
  IP: {
    code: 'IP',
    label: 'Independent beauty professional',
    short: 'Independent lash / beauty professional',
    description:
      'You’re a solo, appointment-driven business. Your work usually has a short repeat cycle, so your income depends heavily on rebooking, on protecting your schedule from cancellations, and on keeping the recurring book deep.',
    controls: ['Pricing, deposits and policies', 'Booking and reminders', 'Brand and portfolio', 'Rebooking and retention', 'Client database'],
    doesNotControl: ['Platform algorithms (which is why depending on one is risky)'],
    objective: 'A profitable recurring book with strong retention, sound pricing, little schedule leakage, and steady acquisition.',
    equationNote: 'Short service cycles make rebooking and no-show protection unusually powerful levers for you.',
  },
};

// Dimension groups drive top-3 diversity and the economic equation.
const GROUPS = {
  demand: { label: 'Demand', equation: 'Demand' },
  conversion: { label: 'Conversion', equation: 'Conversion' },
  capacity: { label: 'Capacity & leakage', equation: 'Capacity utilization' },
  monetization: { label: 'Revenue per appointment', equation: 'Revenue per appointment' },
  retention: { label: 'Retention', equation: 'Retention' },
  systems: { label: 'Systems & visibility', equation: 'Systems' },
  people: { label: 'People & chairs', equation: 'People × Chairs' },
  owner: { label: 'Owner leverage', equation: 'Systems' },
};

const D = (id, o) => ({ id, ...o });

const DIMENSIONS = [
  D('ACQ', {
    label: 'Client acquisition', group: 'demand', personas: ['CS', 'BR', 'SR', 'SO', 'IP'], confNeeded: 2.2,
    labelBy: { CS: 'Personal demand (request clients)' },
    definition: 'Whether enough of the right new clients arrive relative to the open capacity that actually exists.',
    healthyText: 'You’re generating enough new-client demand relative to the time you have available.',
    whyMatters: 'New clients are the input to everything else, but only matter if there is room to serve them and a reason for them to return.',
    investigate: ['New clients per month for the last 3 months', 'Which sources produced clients who came back', 'Open hours per week that you actually want filled'],
    nextStep: 'Pick one or two sources that already produce returning clients and make them more consistent before adding new channels.',
  }),
  D('DISC', {
    label: 'Local discoverability', group: 'demand', personas: ['BR', 'SR', 'SO', 'IP'], confNeeded: 1.4,
    definition: 'Whether people searching nearby for your service can find you on Google, Maps and booking platforms — and whether discovery depends on a single channel.',
    healthyText: 'People searching nearby can find you, and you aren’t dependent on a single platform for discovery.',
    whyMatters: 'People searching “[service] near me” are ready to book now. Missing from those results means relying entirely on social media and referrals.',
    investigate: ['Where you appear for “[your service] + [your city]” on Google Maps', 'Whether your Google Business Profile is complete, categorized and current', 'What share of new clients come from search vs social'],
    nextStep: 'Claim and complete your Google Business Profile, with the right categories, services, prices and photos.',
  }),
  D('BRAND', {
    label: 'Positioning & personal brand', group: 'demand', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.4,
    labelBy: { CS: 'Personal brand & specialization' },
    definition: 'Whether you are known for something specific, attract the clients you want, and show it clearly.',
    healthyText: 'Your work and specialty come through clearly, and new clients tend to be the right fit.',
    whyMatters: 'Clear positioning attracts clients who value your work, which supports pricing and retention. Vague positioning attracts price shoppers.',
    investigate: ['Which services and clients you want more of', 'Whether your last 12 portfolio photos show that', 'Where your best clients originally came from'],
    nextStep: 'Decide what you want to be known for and make your profile and portfolio say it in the first three seconds.',
  }),
  D('CONV', {
    label: 'Inquiry → booking conversion', group: 'conversion', personas: ['BR', 'SR', 'IP', 'SO'], confNeeded: 1.6,
    definition: 'How reliably inquiries turn into booked appointments: how people book, how fast they hear back, and how many inquiries are lost.',
    healthyText: 'People who reach out tend to end up booked, and they can book without friction.',
    whyMatters: 'An inquiry is demand you’ve already earned. Losing it to a slow reply or a back-and-forth costs as much as never being found.',
    investigate: ['Inquiries vs bookings for the last 30 days', 'Average time to first reply', 'Where people drop off: price, availability, or no reply'],
    nextStep: 'Make sure every inquiry gets a fast reply with a direct booking link and visible prices.',
  }),
  D('UTIL', {
    label: 'Schedule utilization', group: 'capacity', personas: ['CS', 'BR', 'SR', 'IP'], confNeeded: 1.6,
    definition: 'How much of your available appointment time is actually booked, and whether the gaps fall at fixable times.',
    healthyText: 'Most of the time you make available is booked.',
    whyMatters: 'Your available hours are the ceiling on income. Unbooked hours are the most direct measure of unused capacity.',
    investigate: ['Booked vs available hours for the last 4 weeks', 'Which days and times stay open', 'Whether open time matches when your clients want to come'],
    nextStep: 'Map where your open hours fall and reshape your schedule around when demand actually exists.',
  }),
  D('CXL', {
    label: 'Cancellation & no-show leakage', group: 'capacity', personas: ['CS', 'BR', 'SR', 'IP'], confNeeded: 1.4,
    definition: 'Booked time that disappears through late cancellations and no-shows, and how much of it gets refilled.',
    healthyText: 'Cancellations and no-shows aren’t eating meaningful time out of your week.',
    whyMatters: 'A late cancellation is the most expensive empty hour you have: you’d already earned the booking, and turned other people away for it.',
    investigate: ['Late cancellations and no-shows over the last 8 weeks', 'How many of those slots were refilled', 'Whether the same clients repeat'],
    nextStep: 'Put a deposit or card-on-file policy in place, add automated confirmations, and keep a short waitlist to refill openings.',
  }),
  D('REBOOK', {
    label: 'Rebooking', group: 'retention', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.6,
    labelBy: { SO: 'Salon-level rebooking' },
    definition: 'Whether clients leave with their next appointment already scheduled.',
    healthyText: 'Most clients leave with their next appointment already on the books.',
    whyMatters: 'When clients decide on their own when to return, they come back later, less often, or not at all — and you end up reacquiring demand you already earned.',
    investigate: ['Your actual prebook rate over the last 90 days', 'Which services and clients prebook least', 'What gets said at checkout'],
    nextStep: 'Make booking the next visit a consistent part of every checkout, with the date recommended by you rather than asked of the client.',
  }),
  D('RET', {
    label: 'Client retention', group: 'retention', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.6,
    labelBy: { SO: 'Salon-level client retention' },
    definition: 'How many first-time clients come back, and whether anything happens when a regular drifts away.',
    healthyText: 'First-time clients come back at a healthy rate.',
    whyMatters: 'Retention decides whether new clients build a business or just pass through it. A client who returns is worth many times a one-time visit.',
    investigate: ['Of first-time clients 4–6 months ago, how many have returned', 'Why one-time clients didn’t return', 'Whether returning clients came from particular sources'],
    nextStep: 'Build a second-visit system: a recommended return date at checkout, a follow-up message, and a check-in when someone goes overdue.',
  }),
  D('REACT', {
    label: 'Client reactivation', group: 'retention', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.2,
    definition: 'Whether past clients who stopped booking are ever invited back.',
    healthyText: 'You stay in touch with clients who drift, so your past client list keeps working for you.',
    whyMatters: 'Past clients already know your work. Inviting them back usually costs far less than finding someone new.',
    investigate: ['How many clients haven’t booked within 2× their normal interval', 'Whether you have current phone/email for them', 'Why the largest groups lapsed'],
    nextStep: 'Pull a list of clients overdue by more than one service cycle and send a personal, specific invitation back.',
  }),
  D('PRICE', {
    label: 'Pricing', group: 'monetization', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.6,
    labelBy: { CS: 'Price level & career tier' },
    definition: 'Whether prices reflect your skill, demand, market and time — and whether discounting or fear of raising prices is holding them down.',
    healthyText: 'Your prices appear to reflect your demand and have kept pace.',
    whyMatters: 'When your schedule is nearly full, raising revenue per appointment is usually worth more than adding clients — and it doesn’t cost you more hours.',
    investigate: ['Revenue per service hour by service', 'Comparable professionals in your area at your skill level', 'How full you are and how far out you book', 'How clients responded to your last increase'],
    nextStep: 'Review prices service by service against your demand and time, and plan an increase starting with new clients and your busiest services.',
  }),
  D('TICKET', {
    label: 'Average ticket', group: 'monetization', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.4,
    definition: 'What a typical visit is worth, including add-ons, and how much revenue each booked hour produces.',
    healthyText: 'Each visit and each hour you work is producing healthy revenue.',
    whyMatters: 'Revenue per appointment multiplies every other number. A higher ticket at the same volume adds income without adding hours.',
    investigate: ['Average ticket by service', 'Revenue per booked hour', 'How often clients add a second service'],
    nextStep: 'Identify two or three add-ons that genuinely improve results and recommend them consistently where they fit.',
  }),
  D('RETAIL', {
    label: 'Retail & product revenue', group: 'monetization', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.0,
    definition: 'Whether clients leave with the products that maintain their results.',
    healthyText: 'Retail is a meaningful part of revenue.',
    whyMatters: 'Retail is revenue that takes no chair time, and clients who maintain results at home are usually happier with the service.',
    investigate: ['Retail per client visit', 'Which products you actually use and believe in', 'Who recommends products at checkout'],
    nextStep: 'Choose a small, focused shelf that matches your services, and make a specific home-care recommendation at every relevant visit.',
  }),
  D('MIX', {
    label: 'Service mix & time economics', group: 'monetization', personas: ['CS', 'BR', 'SR', 'IP'], confNeeded: 1.0,
    definition: 'Whether the services that consume the most time are the ones that pay best, and whether the schedule is built around valuable work.',
    healthyText: 'The services that take your time are the ones that pay for it.',
    whyMatters: 'When low-value services occupy prime hours, a full schedule can still under-earn.',
    investigate: ['Revenue per hour for each service', 'Which services fill your best time slots', 'Services you’d stop if you could'],
    nextStep: 'Calculate revenue per hour for each service and reprice, restructure or limit the ones that consume time without paying for it.',
  }),
  D('REF', {
    label: 'Referrals', group: 'demand', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.0,
    definition: 'Whether happy clients reliably send you new clients — and whether you ask.',
    healthyText: 'Happy clients send you new ones.',
    whyMatters: 'Referred clients arrive pre-sold, tend to look like your best clients, and usually stay longer than clients from any other source.',
    investigate: ['How many recent new clients were referred', 'Which clients refer most often', 'Whether you ask, and when'],
    nextStep: 'Make a simple, specific referral ask to your best clients, with a thank-you you’re comfortable offering.',
  }),
  D('REP', {
    label: 'Reputation & reviews', group: 'demand', personas: ['BR', 'SR', 'IP', 'SO'], confNeeded: 1.2,
    definition: 'Review volume, rating and recency on Google and the platforms people use to choose a professional.',
    healthyText: 'Your review volume and rating are strong.',
    whyMatters: 'Reviews are how strangers decide whether to trust you, and they influence where you appear in local search.',
    investigate: ['Review count, rating and recency vs nearby competitors', 'Whether reviews mention your specialty', 'How you currently ask'],
    nextStep: 'Ask every happy client for a review with a direct link, sent automatically after their visit.',
  }),
  D('DIGITAL', {
    label: 'Website & booking experience', group: 'conversion', personas: ['BR', 'SR', 'IP', 'SO'], confNeeded: 1.0,
    definition: 'Whether someone can see your work, understand your prices and book in one place, without messaging first.',
    healthyText: 'It’s easy to see your work, understand your prices and book.',
    whyMatters: 'Every extra step — a DM, a missing price, a link that doesn’t book — loses some of the people who were ready.',
    investigate: ['How many taps from your profile to a confirmed booking', 'Whether prices are visible', 'What a new client sees on mobile'],
    nextStep: 'Create one link that shows your work, your prices and lets people book immediately — and put it everywhere.',
  }),
  D('AUTO', {
    label: 'Automation & admin load', group: 'systems', personas: ['BR', 'SR', 'IP'], confNeeded: 1.0,
    definition: 'Whether reminders, confirmations, review requests and follow-ups happen without you, and how much admin time you carry.',
    healthyText: 'Routine follow-up runs without you, and admin isn’t eating your week.',
    whyMatters: 'Manual follow-up is the first thing that slips on a busy week, and admin hours are unpaid hours.',
    investigate: ['Hours per week spent messaging and scheduling', 'Which messages you send by hand that could be automated', 'What your booking software already supports'],
    nextStep: 'Turn on the automations your booking software already has: confirmations, reminders, rebook nudges and review requests.',
  }),
  D('FIN', {
    label: 'Financial visibility', group: 'systems', personas: ['CS', 'BR', 'SR', 'IP', 'SO'], confNeeded: 1.0,
    definition: 'Whether you know the few numbers that tell you where the business stands.',
    healthyText: 'You know your key numbers, which makes every decision easier.',
    whyMatters: 'Without a few key numbers it’s easy to work on the wrong problem.',
    investigate: ['Monthly revenue and profit', 'Rebooking rate and first-visit return rate', 'Revenue per hour worked'],
    nextStep: 'Track five numbers monthly: revenue, revenue per hour, rebooking rate, first-visit return rate, and new clients.',
  }),
  // ---- Salon owner dimensions ----
  D('CHAIR_UTIL', {
    label: 'Chair utilization', group: 'people', personas: ['SO'], confNeeded: 1.0,
    definition: 'How many of the salon’s stations are producing revenue most days.',
    healthyText: 'Your stations are occupied and producing.',
    whyMatters: 'An empty chair carries its share of rent, utilities and equipment while producing nothing. It can mean a recruiting problem, a retention problem, a demand problem or a compensation problem — each needs a different fix.',
    investigate: ['Why each empty chair is empty', 'Revenue a productive stylist generates per week', 'Whether renting is a better use for any chair'],
    nextStep: 'For each empty station, decide: recruit a commission stylist, rent it, or repurpose it — based on demand and economics, not habit.',
  }),
  D('STYLIST_PROD', {
    label: 'Stylist productivity', group: 'people', personas: ['SO'], confNeeded: 1.2,
    definition: 'How full stylists’ books are and whether the salon can see each stylist’s numbers.',
    healthyText: 'Your stylists’ books are full and productive.',
    whyMatters: 'A stylist at 55% booked costs nearly as much to support as one at 90%. Productivity per stylist is usually the biggest profit lever in a salon.',
    investigate: ['Booked % by stylist', 'Revenue, rebooking and ticket by stylist', 'Which stylists are building vs established'],
    nextStep: 'Put a simple weekly stylist dashboard in place — booked %, revenue, rebooking, ticket — and review it together.',
  }),
  D('RECRUIT', {
    label: 'Recruiting', group: 'people', personas: ['SO'], confNeeded: 1.0,
    definition: 'Whether the salon can find and attract good stylists when it needs them.',
    healthyText: 'You can find good stylists when you need them.',
    whyMatters: 'When demand is there but chairs are empty, the constraint is people. More customer marketing won’t fix a recruiting problem.',
    investigate: ['Where your best stylists originally came from', 'What a candidate sees when they research the salon', 'Your offer vs nearby salons and suites'],
    nextStep: 'Build a recruiting pipeline — a careers page, school relationships, referral bonuses and a clear career path — that runs before you need it.',
  }),
  D('STAFF_RET', {
    label: 'Stylist retention', group: 'people', personas: ['SO'], confNeeded: 1.0,
    definition: 'How long good stylists stay, and why they leave.',
    healthyText: 'Strong stylists tend to stay.',
    whyMatters: 'When a stylist leaves, the salon loses their production and often their clients. Turnover quietly resets growth.',
    investigate: ['Tenure of the last five stylists who left', 'Exit reasons (pay, growth, culture, suites)', 'What your best stylists would need to stay 5 more years'],
    nextStep: 'Create a visible career path with productivity-based tiers so growth inside the salon beats leaving for a suite.',
  }),
  D('LEAD_DIST', {
    label: 'Lead handling & distribution', group: 'conversion', personas: ['SO'], confNeeded: 1.0,
    definition: 'How calls and messages are handled, and how new clients are matched to stylists.',
    healthyText: 'New clients are handled reliably and matched to the right stylist.',
    whyMatters: 'The salon’s new clients are its most valuable shared asset. Matching them to stylists with capacity and the right specialty builds books; random assignment wastes them.',
    investigate: ['Who answers, how fast, and what gets missed', 'How new clients are assigned', 'Second-visit rate by assigned stylist'],
    nextStep: 'Define how inquiries are answered and how new clients are routed — by specialty and available capacity — and track whether they return.',
  }),
  D('OWNER_DEP', {
    label: 'Owner dependence', group: 'owner', personas: ['SO'], confNeeded: 1.0,
    definition: 'How much of the salon’s revenue and operation depends on the owner’s own chair and attention.',
    healthyText: 'The salon’s revenue doesn’t depend heavily on your own chair.',
    whyMatters: 'If the business only works while you’re behind the chair, you own a job with overhead. Reducing dependence is what makes the salon valuable and gives you choices.',
    investigate: ['Owner share of service revenue over 12 months', 'What happens to bookings when you’re away', 'Which of your hours could be delegated'],
    nextStep: 'Decide what share of revenue should come from your chair in 12 months, and plan how your clients and responsibilities transition.',
  }),
  D('OPS', {
    label: 'Operational maturity', group: 'owner', personas: ['SO'], confNeeded: 1.2,
    definition: 'Whether systems, measurement, compensation economics and management time let the salon run predictably.',
    healthyText: 'The salon runs on systems, and you can see how it’s performing.',
    whyMatters: 'Without systems and measurement, every problem lands on the owner, and good decisions depend on memory and instinct.',
    investigate: ['Which decisions only you can make today', 'Margin by stylist after commission and product', 'What runs the same way regardless of who works that day'],
    nextStep: 'Write down the five routines that matter most (front desk, checkout, rebooking, onboarding, weekly numbers) and make them the standard.',
  }),
];

const DIM = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d]));

// How much each dimension matters per persona when ranking (impact multiplier).
const DIM_IMPACT = {
  CS: { ACQ: 1.0, BRAND: 0.9, UTIL: 1.0, CXL: 0.7, REBOOK: 1.1, RET: 1.1, REACT: 0.6, PRICE: 0.9, TICKET: 1.0, RETAIL: 0.7, MIX: 0.7, REF: 0.8, FIN: 0.45 },
  BR: { ACQ: 1.0, DISC: 0.9, BRAND: 0.7, CONV: 0.9, UTIL: 1.1, CXL: 0.9, REBOOK: 1.0, RET: 1.1, REACT: 0.8, PRICE: 1.0, TICKET: 1.0, RETAIL: 0.6, MIX: 0.8, REF: 0.7, REP: 0.8, DIGITAL: 0.7, AUTO: 0.55, FIN: 0.45 },
  SR: { ACQ: 1.0, DISC: 0.9, BRAND: 0.8, CONV: 1.0, UTIL: 1.1, CXL: 1.0, REBOOK: 1.0, RET: 1.1, REACT: 0.8, PRICE: 1.0, TICKET: 1.0, RETAIL: 0.6, MIX: 0.8, REF: 0.7, REP: 0.8, DIGITAL: 0.7, AUTO: 0.55, FIN: 0.45 },
  IP: { ACQ: 1.0, DISC: 0.9, BRAND: 0.8, CONV: 1.0, UTIL: 1.0, CXL: 1.1, REBOOK: 1.2, RET: 1.1, REACT: 0.9, PRICE: 1.0, TICKET: 0.9, RETAIL: 0.4, MIX: 0.7, REF: 0.7, REP: 0.8, DIGITAL: 0.7, AUTO: 0.55, FIN: 0.45 },
  SO: { ACQ: 0.9, DISC: 0.7, BRAND: 0.5, CONV: 0.7, REBOOK: 0.9, RET: 1.0, REACT: 0.6, PRICE: 0.8, TICKET: 0.8, RETAIL: 0.65, REF: 0.5, REP: 0.7, DIGITAL: 0.5, FIN: 0.45, CHAIR_UTIL: 1.1, STYLIST_PROD: 1.1, RECRUIT: 1.1, STAFF_RET: 1.0, LEAD_DIST: 0.9, OWNER_DEP: 1.1, OPS: 1.0 },
};

module.exports = { LEVELS, STATUSES, STATUS_INSUFFICIENT, STATUS_NA, MIN_CONFIDENCE, PERSONAS, GROUPS, DIMENSIONS, DIM, DIM_IMPACT };
