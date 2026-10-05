// Beauty Business Growth Diagnostic — ECONOMIC MODEL
//
// Individual:  Demand × Conversion × Capacity utilization × Revenue per appointment × Retention = Economic output
//   Available hours → booked hours → revenue per hour → cancellation leakage → rebooking → retention → ticket → productive capacity
// Salon owner adds the leverage layer:  People × Chairs × Productivity × Retention × Systems
//   Available chairs → producing chairs → revenue per chair → stylist retention → client retention → owner production → salon-independent revenue
//
// Every figure carries its basis so the report can show the arithmetic. Nothing is calculated without the inputs to support it.

const REFILL_DEFAULT = 0.3; // assumed share of late openings refilled when we didn't ask (Q23 skipped)
const PRACTICAL_CEILING = 0.9; // 90% booked treated as practically full

const money = (x) => (x == null || !isFinite(x) ? null : '$' + Math.round(x).toLocaleString('en-US'));
const pct = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 100) + '%');
const num = (x, d = 0) => (x == null || !isFinite(x) ? null : Number(x.toFixed(d)).toLocaleString('en-US'));

function individualModel(get, persona, specialty) {
  const H = get.n('Q08');
  const U = get.n('Q09');
  const A = get.n('Q11');
  const T = get.n('Q33');
  const L = get.n('Q21');
  const refillAsked = get.n('Q23');
  const refill = refillAsked != null ? refillAsked : REFILL_DEFAULT;
  const retailWk = get.n('Q34', 'retail');
  const prebook = get.n('Q24', 'pct');
  const F = get.n('Q25');
  const newMo = get.n('Q13');
  const conv = get.n('Q20');
  const rent = get.n('Q07');
  const admin = get.n('Q40', 'admin');
  const dbSize = get.n('Q28', 'count');
  let I = get.n('Q26');
  let intervalBasis = 'your answer';
  if (I == null) {
    const d = specialty ? specialty.n : null;
    if (d) { I = d; intervalBasis = 'typical for your specialty'; }
  }
  const eventBased = specialty && specialty.v === 'makeup';

  const m = { kind: 'individual', inputs: { H, U, A, T, L, refill, retailWk, prebook, F, newMo, conv, rent, admin, I, dbSize }, assumptions: [], rows: [], flags: [] };
  if (refillAsked == null && L != null && L >= 1) m.assumptions.push(`About ${pct(REFILL_DEFAULT)} of late openings get refilled (not asked; assumed).`);
  if (I != null && intervalBasis !== 'your answer') m.assumptions.push(`Regulars return about every ${I} weeks — ${intervalBasis}; not asked, so assumed.`);

  const bookedHours = H != null && U != null ? H * U : null;
  let avgLen = bookedHours != null && A ? bookedHours / A : null;
  if (avgLen != null && (avgLen < 0.33 || avgLen > 6)) { m.flags.push('Hours, booked share and weekly clients don’t line up — confirm on the call.'); avgLen = Math.min(6, Math.max(0.33, avgLen)); }
  const weeklyService = A != null && T != null ? A * T : null;
  const retailPerVisit = retailWk != null && A ? retailWk / A : null;
  const rphBooked = weeklyService != null && bookedHours ? weeklyService / bookedHours : null;
  const rphAvail = weeklyService != null && H ? weeklyService / H : null;
  const leakRate = L != null && A != null ? L / (A + L) : null;
  const lostAppts = L != null ? L * (1 - refill) : null;
  const lostHours = lostAppts != null && avgLen != null ? lostAppts * avgLen : null;
  const openHours = H != null && U != null ? H * (1 - U) : null;
  const productiveHours = bookedHours != null ? bookedHours - (lostHours || 0) : null;
  const effUtil = productiveHours != null && H ? productiveHours / H : null;
  const ceilingWk = rphBooked != null && H != null ? PRACTICAL_CEILING * H * rphBooked : null;
  const ceilingShare = weeklyService != null && ceilingWk ? weeklyService / ceilingWk : null;
  const visitsPerYear = I ? 52 / I : null;
  const regularValue = visitsPerYear && T ? visitsPerYear * (T + (retailPerVisit || 0)) : null;
  const regularsNeeded = A != null && I ? A * I : null;
  const newRegularsMo = newMo != null && F != null ? newMo * F : null;
  const inquiriesMo = newMo != null && conv ? newMo / conv : null;
  const unbookedInquiriesMo = inquiriesMo != null ? inquiriesMo - newMo : null;
  const rentShare = rent != null && weeklyService ? rent / weeklyService : null;
  const apptsForRent = rent != null && T ? rent / T : null;
  const adminShare = admin != null && bookedHours != null ? admin / (bookedHours + admin) : null;
  const lostRevenueWk = lostAppts != null && T != null ? lostAppts * T : null;

  Object.assign(m, { bookedHours, avgLen, weeklyService, retailPerVisit, rphBooked, rphAvail, leakRate, lostAppts, lostHours, openHours, productiveHours, effUtil, ceilingWk, ceilingShare, visitsPerYear, regularValue, regularsNeeded, newRegularsMo, inquiriesMo, unbookedInquiriesMo, rentShare, apptsForRent, adminShare, lostRevenueWk, eventBased });

  const row = (step, label, value, basis) => value != null && m.rows.push({ step, label, value, basis });
  row('capacity', 'Available appointment hours', H != null ? `${num(H)} hrs/week` : null, 'Your answer');
  row('capacity', 'Booked hours', bookedHours != null ? `≈ ${num(bookedHours)} hrs/week (${pct(U)})` : null, `${num(H)} hrs × ${pct(U)} booked`);
  row('capacity', 'Open hours', openHours != null ? `≈ ${num(openHours)} hrs/week` : null, `${num(H)} hrs − ${num(bookedHours)} booked`);
  row('capacity', 'Average appointment length', avgLen != null ? `≈ ${avgLen.toFixed(1)} hrs` : null, `${num(bookedHours)} booked hrs ÷ ${num(A)} clients`);
  row('revenue', 'Weekly service revenue', weeklyService != null ? `≈ ${money(weeklyService)}` : null, `${num(A)} clients × ${money(T)} average ticket${persona === 'CS' ? ' (service sales on your book, before your split)' : ''}`);
  row('revenue', 'Revenue per booked hour', rphBooked != null ? `≈ ${money(rphBooked)}/hr` : null, `${money(weeklyService)} ÷ ${num(bookedHours)} booked hrs`);
  row('revenue', 'Revenue per available hour', rphAvail != null ? `≈ ${money(rphAvail)}/hr` : null, `${money(weeklyService)} ÷ ${num(H)} available hrs`);
  row('leakage', 'Late cancellations & no-shows', leakRate != null ? `≈ ${num(L, 1)}/week (${pct(leakRate)} of scheduled)` : null, `${num(L, 1)} ÷ (${num(A)} + ${num(L, 1)})`);
  row('leakage', 'Time lost after refills', lostHours != null && lostHours >= 0.25 ? `≈ ${num(lostHours, 1)} hrs/week` : null, `${num(L, 1)} × (1 − ${pct(refill)} refilled) × ${num(avgLen, 1)} hrs`);
  row('retention', 'Clients leaving with next visit booked', prebook != null ? pct(prebook) : null, 'Your answer');
  row('retention', 'First-time clients who return', F != null ? `≈ ${Math.round(F * 10)} of 10` : null, 'Your answer');
  row('retention', 'New clients → likely regulars', newRegularsMo != null ? `≈ ${num(newRegularsMo, 1)} of ${num(newMo)} per month` : null, `${num(newMo)} new × ${pct(F)} return`);
  row('retention', 'Value of one regular client', regularValue != null && !eventBased ? `≈ ${money(regularValue)}/year` : null, `${num(visitsPerYear, 1)} visits/yr × ${money(T + (retailPerVisit || 0))}`);
  row('retention', 'Active regulars needed for current volume', regularsNeeded != null && !eventBased ? `≈ ${num(regularsNeeded)}` : null, `${num(A)} visits/week × ${num(I)}-week cycle`);
  row('ceiling', 'Practical ceiling at current pricing', ceilingWk != null ? `≈ ${money(ceilingWk)}/week` : null, `90% of ${num(H)} hrs × ${money(rphBooked)}/hr`);
  row('ceiling', 'Current output vs ceiling', ceilingShare != null ? pct(Math.min(1.2, ceilingShare)) : null, `${money(weeklyService)} ÷ ${money(ceilingWk)}`);
  if (rent != null) row('overhead', 'Appointments each week that go to rent', apptsForRent != null ? `≈ ${num(apptsForRent, 1)} (${pct(rentShare)} of service revenue)` : null, `${money(rent)} rent ÷ ${money(T)} ticket`);
  if (admin != null) row('overhead', 'Unpaid admin time', `${num(admin, 1)} hrs/week${adminShare != null ? ` (${pct(adminShare)} of working time)` : ''}`, 'Your answer');
  return m;
}

function salonModel(get) {
  const S = get.n('Q42', 'stations');
  const P = get.n('Q42', 'producing');
  const C = get.n('Q42', 'commission');
  const Rn = get.n('Q42', 'renters');
  const Vs = get.n('Q50', 'prod');
  const rent = get.n('Q50', 'rent');
  const fullness = get.n('Q48');
  const s = get.n('Q51');
  const F = get.n('Q25');
  const prebook = get.n('Q24', 'pct');
  const T = get.n('Q33');
  const retailWk = get.n('Q34', 'retail');
  const newMo = get.n('Q13');
  const tenure = get.n('Q45');

  const m = { kind: 'salon', inputs: { S, P, C, Rn, Vs, rent, fullness, s, F, prebook, T, retailWk, newMo, tenure }, assumptions: [], rows: [], flags: [] };
  const adj = fullness == null ? null : fullness >= 0.85 ? 1 : fullness >= 0.65 ? 0.8 : 0.6;
  if (adj != null && adj < 1) m.assumptions.push(`An average commission stylist produces about ${pct(adj)} of a busy stylist (from how full books are).`);
  const chairUtil = S && P != null ? Math.min(1, P / S) : null;
  const empty = S != null && P != null ? Math.max(0, S - P) : null;
  const commissionRev = C != null && Vs != null ? C * Vs * (adj || 1) : null;
  const rentalIncome = Rn != null && rent != null ? Rn * rent : null;
  let totalService = null, ownerRev = null;
  if (commissionRev != null && s != null && s < 0.95) { totalService = commissionRev / (1 - s); ownerRev = totalService - commissionRev; }
  if (ownerRev != null && Vs != null && ownerRev > 2.5 * Vs) {
    m.flags.push(`Your chair’s share of revenue and your stylists’ weekly production don’t line up (it would put your chair near ${money(ownerRev)}/week). Revenue-per-chair figures are left out until we confirm on the call.`);
    totalService = null; ownerRev = null;
  }
  const salonGross = totalService != null ? totalService + (rentalIncome || 0) : null;
  const revPerStation = salonGross != null && S ? salonGross / S : null;
  const revPerProducing = salonGross != null && P ? salonGross / P : null;
  const emptyValueCommission = empty && Vs != null ? empty * Vs * (adj || 1) : null;
  const emptyValueRent = empty && rent != null ? empty * rent : null;
  const independent = commissionRev != null ? commissionRev + (rentalIncome || 0) : null;
  const independentShare = independent != null && salonGross ? independent / salonGross : null;
  const retailShare = retailWk != null && totalService ? retailWk / totalService : null;

  Object.assign(m, { chairUtil, empty, commissionRev, rentalIncome, totalService, ownerRev, salonGross, revPerStation, revPerProducing, emptyValueCommission, emptyValueRent, independent, independentShare, retailShare, adj });
  if (s != null) m.assumptions.push('Owner share is treated as a share of service revenue from you and commission stylists (renters’ revenue isn’t the salon’s).');

  const row = (step, label, value, basis) => value != null && m.rows.push({ step, label, value, basis });
  row('chairs', 'Stations', S != null ? `${S}` : null, 'Your answer');
  row('chairs', 'Producing most days', P != null ? `${P} of ${S} (${pct(chairUtil)})` : null, 'Your answer');
  row('people', 'Team', C != null || Rn != null ? `${C || 0} commission · ${Rn || 0} renting` : null, 'Your answer');
  row('productivity', 'Busy stylist, weekly services', Vs != null ? money(Vs) : null, 'Your answer');
  row('productivity', 'Commission service revenue', commissionRev != null ? `≈ ${money(commissionRev)}/week` : null, `${C} stylists × ${money(Vs)}${adj && adj < 1 ? ` × ${pct(adj)} average fullness` : ''}`);
  row('owner', 'Your chair', ownerRev != null ? `≈ ${money(ownerRev)}/week (${pct(s)} of service revenue)` : null, `Commission revenue ÷ (1 − ${pct(s)}) − commission revenue`);
  row('revenue', 'Rental income', rentalIncome != null ? `≈ ${money(rentalIncome)}/week` : null, `${Rn} renters × ${money(rent)}`);
  row('revenue', 'Revenue per station', revPerStation != null ? `≈ ${money(revPerStation)}/week` : null, `${money(salonGross)} ÷ ${S} stations`);
  row('revenue', 'Revenue per producing station', revPerProducing != null ? `≈ ${money(revPerProducing)}/week` : null, `${money(salonGross)} ÷ ${P} producing`);
  row('chairs', 'Empty stations at a busy-stylist level', emptyValueCommission ? `≈ ${money(emptyValueCommission)}/week in services` : null, `${empty} empty × ${money(Vs)}${adj && adj < 1 ? ` × ${pct(adj)}` : ''} (gross, before commission and ramp-up)`);
  row('chairs', 'Empty stations if rented', emptyValueRent ? `≈ ${money(emptyValueRent)}/week` : null, `${empty} × ${money(rent)} rent`);
  row('owner', 'Salon-independent revenue', independentShare != null ? `≈ ${money(independent)}/week (${pct(independentShare)} of salon revenue)` : null, 'Commission revenue + rental income');
  row('retention', 'First-time clients who return', F != null ? `≈ ${Math.round(F * 10)} of 10` : null, 'Your answer');
  row('retention', 'Stylist tenure (strong stylists)', tenure != null ? `≈ ${tenure >= 5 ? '5+' : num(tenure, 1)} years` : null, 'Your answer');
  row('revenue', 'Retail vs services', retailShare != null ? `≈ ${pct(retailShare)} of service revenue` : null, `${money(retailWk)} ÷ ${money(totalService)}`);
  return m;
}

module.exports = { individualModel, salonModel, money, pct, num, REFILL_DEFAULT };
