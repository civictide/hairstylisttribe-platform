// The 10 validation scenarios. Each answer set is a full set of answers a person could give;
// the router decides which of them are actually asked. `expect` encodes what a good consultant would conclude.

module.exports = [
  {
    id: 'S01', name: 'New commission stylist', brief: 'Low clientele, little personal brand, salon supplies some clients, low request base.',
    answers: { Q01: 'CS', Q03: 'hair', Q04: 'building', Q05: 'more_new', Q06: 'flat', Q08: 'h3', Q09: 'u2', Q10: 'same', Q11: 'c2', Q12: ['wk_morn', 'wk_aft'], Q13: 'n2', Q14: ['salon', 'ig'], Q15: 'assigned', Q17: 'occasional', Q21: 'x1', Q24: { process: 'ask', pct: 'p40' }, Q25: 'r6', Q26: 'w8', Q28: { where: 'salon_see', count: 'd1' }, Q30: { last: 'never', fear: 'no' }, Q31: 'same', Q33: 't2', Q34: { addon: 'rare', retail: 'r1' }, Q36: 'mixed', Q37: { specialty: 'somewhat', link: 'salon' }, Q38: 'natural', Q41: ['newc'] },
    expect: { topAny: ['BRAND', 'ACQ'], topIncludesOneOf: ['REBOOK', 'REF', 'BRAND'], notDims: ['DISC', 'REP', 'CONV'], dontBuy: ['personal_marketing_cs'], interventionsInclude: ['personal_brand_cs'], interventionsExclude: ['gbp_optimization', 'paid_ads'], tags: ['CS_CONTROL', 'CS_BUILDING'] },
  },
  {
    id: 'S02', name: 'Successful commission stylist', brief: 'Nearly full, strong retention and rebooking, underpriced, wants more income.',
    answers: { Q01: 'CS', Q03: 'hair_spec', Q04: 'plateau', Q05: 'earn_more', Q06: 'flat', Q08: 'h4', Q09: 'u5', Q10: 'turning', Q11: 'c3', Q13: 'n2', Q14: ['referral'], Q15: 'mine', Q21: 'x0', Q24: { process: 'always', pct: 'p80' }, Q25: 'r8', Q26: 'w8', Q30: { last: 'never', fear: 'often' }, Q31: 'lower', Q32: 'rare', Q33: 't4', Q34: { addon: 'rare', retail: 'r1' }, Q35: 'partly', Q36: 'ideal', Q38: 'ask', Q41: ['rev', 'newc'] },
    expect: { top1: ['PRICE'], topNot: ['ACQ', 'BRAND', 'REF'], tags: ['ACQ_NOT_CONSTRAINT', 'UNDERPRICED'], statusIn: { RET: ['STRONG', 'HEALTHY'], REBOOK: ['STRONG', 'HEALTHY'], ACQ: ['STRONG', 'HEALTHY'] }, dontBuy: ['ads'] },
  },
  {
    id: 'S03', name: 'Struggling booth renter', brief: '~40% utilization, weak Google presence, depends on Instagram, good retention once clients arrive.',
    answers: { Q01: 'BR', Q03: 'hair', Q04: 'building', Q05: 'more_new', Q07: 'r3', Q08: 'h3', Q09: 'u2', Q10: 'one', Q11: 'c2', Q12: ['wk_morn', 'wk_aft', 'wkend'], Q13: 'n2', Q14: ['ig'], Q16: 'hard', Q17: 'occasional', Q18: 'dm', Q19: 'same', Q20: 'c6', Q21: 'x1', Q24: { process: 'always', pct: 'p80' }, Q25: 'r8', Q26: 'w5', Q28: { where: 'software', count: 'd2' }, Q29: 'personal', Q30: { last: 'y1', fear: 'no' }, Q31: 'same', Q33: 't3', Q34: { addon: 'some', retail: 'r2' }, Q37: { specialty: 'clear', link: 'partial' }, Q38: 'natural', Q39: { count: 'v2', rating: 's48', ask: 'sometimes' }, Q40: { auto: 'some', admin: 'a2' }, Q41: ['rev', 'profit', 'ticket', 'newc'] },
    expect: { top1: ['ACQ', 'DISC'], topIncludes: ['DISC'], tags: ['NEEDS_DEMAND', 'SOCIAL_ONLY'], statusIn: { RET: ['STRONG', 'HEALTHY'], REBOOK: ['STRONG', 'HEALTHY'] }, dontBuy: ['new_software'], interventionsInclude: ['gbp_optimization'] },
  },
  {
    id: 'S04', name: 'Busy booth renter', brief: '90% utilization, no price increase, low average ticket, poor add-ons, strong retention.',
    answers: { Q01: 'BR', Q03: 'hair', Q04: 'full', Q05: 'more_new', Q07: 'r2', Q08: 'h4', Q09: 'u5', Q10: 'four', Q11: 'c4', Q13: 'n3', Q14: ['referral', 'ig'], Q16: 'page1', Q18: 'online', Q21: 'x1', Q24: { process: 'always', pct: 'p60' }, Q25: 'r8', Q26: 'w5', Q30: { last: 'y3', fear: 'often' }, Q31: 'lower', Q32: 'rare', Q33: 't2', Q34: { addon: 'rare', retail: 'r1' }, Q35: 'no', Q36: 'mixed', Q37: { specialty: 'somewhat', link: 'all' }, Q39: { count: 'v3', rating: 's48', ask: 'person' }, Q41: ['rev'] },
    expect: { top1: ['PRICE', 'TICKET', 'MIX'], topIncludes: ['PRICE'], topNot: ['ACQ', 'DISC', 'BRAND'], tags: ['ACQ_NOT_CONSTRAINT', 'UNDERPRICED'], dontBuy: ['ads'], belief: 'challenge', statusIn: { RET: ['STRONG', 'HEALTHY'] } },
  },
  {
    id: 'S05', name: 'Salon suite renter — inquiries leak', brief: 'Good social following, many inquiries, weak inquiry-to-booking conversion, high cancellations.',
    answers: { Q01: 'SR', Q03: 'hair_spec', Q04: 'growing', Q05: 'social', Q07: 'r4', Q08: 'h4', Q09: 'u3', Q10: 'one', Q11: 'c2', Q12: ['scattered', 'wk_morn'], Q13: 'n3', Q14: ['ig', 'tiktok'], Q16: 'hard', Q17: 'busy_few', Q18: 'dm', Q19: 'next', Q20: 'c2', Q21: 'x4', Q22: 'soft', Q23: 'empty', Q24: { process: 'ask', pct: 'p60' }, Q25: 'r6', Q26: 'w8', Q28: { where: 'software', count: 'd3' }, Q29: 'occasional', Q30: { last: 'y1', fear: 'once' }, Q31: 'same', Q33: 't5', Q34: { addon: 'some', retail: 'r2' }, Q35: 'partly', Q37: { specialty: 'clear', link: 'partial' }, Q39: { count: 'v2', rating: 's48', ask: 'sometimes' }, Q40: { auto: 'little', admin: 'a3' }, Q41: ['rev', 'ticket'] },
    expect: { topIncludes: ['CONV', 'CXL'], topNot: ['ACQ'], tags: ['CONVERSION_FIRST', 'LEAKAGE'], dontBuy: ['followers'], belief: 'challenge' },
  },
  {
    id: 'S06', name: 'Independent lash artist', brief: 'Strong acquisition, weak rebooking, high no-shows, no deposit policy, large dormant database.',
    answers: { Q01: 'IP', Q03: 'lash', Q04: 'plateau', Q05: 'more_new', Q08: 'h4', Q09: 'u3', Q10: 'one', Q11: 'c3', Q12: ['scattered'], Q13: 'n4', Q14: ['ig', 'google', 'referral'], Q16: 'top', Q17: 'works', Q18: 'online', Q20: 'c8', Q21: 'x4', Q22: 'none', Q23: 'empty', Q24: { process: 'own', pct: 'p20' }, Q25: 'r4', Q27: ['no_reason'], Q28: { where: 'software', count: 'd4' }, Q29: 'nothing', Q30: { last: 'y1', fear: 'no' }, Q31: 'same', Q32: 'first', Q33: 't3', Q34: { addon: 'some', retail: 'r0' }, Q35: 'yes', Q36: 'ideal', Q38: 'ask', Q39: { count: 'v4', rating: 's48', ask: 'auto' }, Q40: { auto: 'some', admin: 'a2' }, Q41: ['rev', 'newc'] },
    expect: { topIncludes: ['REBOOK', 'CXL'], topIncludesOneOf: ['REACT', 'RET'], topNot: ['ACQ', 'DISC'], statusIn: { ACQ: ['STRONG', 'HEALTHY'], REACT: ['OPPORTUNITY', 'HIGH_PRIORITY'] }, dontBuy: ['ads'], interventionsInclude: ['deposit_policy', 'prebooking_system'], belief: 'challenge' },
  },
  {
    id: 'S07', name: 'Small salon owner', brief: '6 chairs, 4 occupied, owner heavily behind chair, moderate demand, weak recruiting, no measurement.',
    answers: { Q01: 'SO', Q04: 'plateau', Q05: 'more_new', Q42: { stations: 6, producing: 4, commission: 2, renters: 1 }, Q43: ['recruit', 'not_tried'], Q44: 'months', Q45: 't1', Q46: 'some', Q47: { who: 'owner', assign: 'avail' }, Q48: 'mixed', Q49: ['none'], Q50: { prod: 'p2', rent: 'b2' }, Q51: 'o4', Q52: 'couldnt', Q53: 'reduce', Q54: 'none', Q55: 'unsure', Q13: 'n2', Q14: ['referral', 'google', 'walkin'], Q16: 'page1', Q24: { process: 'ask', pct: 'p40' }, Q25: 'r6', Q30: { last: 'y2', fear: 'once' }, Q33: 't3', Q34: { addon: 'some', retail: 'r1' }, Q39: { count: 'v1', rating: 's48', ask: 'sometimes' }, Q41: ['rev'] },
    expect: { topIncludes: ['OWNER_DEP'], topIncludesOneOf: ['CHAIR_UTIL', 'RECRUIT'], topIncludesOneOf2: ['OPS', 'STYLIST_PROD', 'LEAD_DIST'], topNot: ['ACQ', 'DISC'], belief: 'challenge' },
  },
  {
    id: 'S08', name: 'Successful salon owner', brief: '12 chairs, strong demand and staff, good utilization, poor salon-level retention, weak retail, wants to step away.',
    answers: { Q01: 'SO', Q04: 'growing', Q05: 'step_back', Q42: { stations: 12, producing: 11, commission: 8, renters: 2 }, Q43: ['left'], Q44: 'quick', Q45: 't2', Q46: 'follow', Q47: { who: 'desk', assign: 'match' }, Q48: 'full', Q49: ['rev', 'ticket'], Q50: { prod: 'p3', rent: 'b3' }, Q51: 'o2', Q52: 'serious', Q53: 'step', Q54: 'fires', Q55: 'rough', Q13: 'n4', Q24: { process: 'ask', pct: 'p40' }, Q25: 'r4', Q27: ['no_reason', 'unknown'], Q28: { where: 'partial', count: 'd5' }, Q29: 'occasional', Q30: { last: 'y1', fear: 'no' }, Q32: 'rare', Q33: 't4', Q34: { addon: 'some', retail: 'r1' }, Q39: { count: 'v3', rating: 's48', ask: 'person' }, Q41: ['rev', 'profit', 'ticket'] },
    expect: { topIncludes: ['OWNER_DEP', 'RET'], topNot: ['ACQ', 'DISC', 'CHAIR_UTIL'], statusIn: { RETAIL: ['OPPORTUNITY', 'HIGH_PRIORITY', 'WATCH'], ACQ: ['STRONG', 'HEALTHY'] }, tags: ['SUPPLY_CONSTRAINT', 'OWNER_TRAPPED'], dontBuy: ['salon_ads'], belief: 'confirm' },
  },
  {
    id: 'S09', name: 'Thinks they need Instagram', brief: 'Strong Google discovery and referrals, weak rebooking, 50% retention, 65% utilized.',
    answers: { Q01: 'IP', Q03: 'skin', Q04: 'plateau', Q05: 'social', Q08: 'h3', Q09: 'u3', Q10: 'one', Q11: 'c2', Q12: ['wk_aft', 'scattered'], Q13: 'n3', Q14: ['google', 'referral'], Q16: 'top', Q17: 'occasional', Q18: 'online', Q20: 'c8', Q21: 'x1', Q22: 'card', Q24: { process: 'own', pct: 'p20' }, Q25: 'r4', Q26: 'w5', Q27: ['no_reason'], Q28: { where: 'software', count: 'd3' }, Q29: 'occasional', Q30: { last: 'y1', fear: 'no' }, Q31: 'same', Q32: 'first', Q33: 't3', Q34: { addon: 'some', retail: 'r2' }, Q35: 'partly', Q36: 'ideal', Q38: 'ask', Q39: { count: 'v4', rating: 's48', ask: 'auto' }, Q40: { auto: 'some', admin: 'a2' }, Q41: ['rev', 'newc'] },
    expect: { top1: ['REBOOK', 'RET'], topIncludes: ['REBOOK', 'RET'], topNot: ['ACQ', 'BRAND', 'DISC'], statusIn: { DISC: ['STRONG', 'HEALTHY'] }, dontBuy: ['followers'], belief: 'challenge', interventionsExclude: ['instagram_strategy'] },
  },
  {
    id: 'S10', name: 'Healthy business', brief: 'Strong acquisition, utilization, pricing, retention, rebooking, reviews and financial visibility.',
    answers: { Q01: 'SR', Q03: 'hair_spec', Q04: 'full', Q05: 'earn_more', Q07: 'r3', Q08: 'h4', Q09: 'u4', Q10: 'two', Q11: 'c2', Q13: 'n3', Q14: ['referral', 'google', 'ig'], Q16: 'top', Q17: 'works', Q18: 'online', Q21: 'x0', Q24: { process: 'always', pct: 'p80' }, Q25: 'r8', Q26: 'w8', Q30: { last: 'y0', fear: 'no' }, Q31: 'same', Q33: 't5', Q34: { addon: 'most', retail: 'r3' }, Q35: 'yes', Q39: { count: 'v4', rating: 's48', ask: 'auto' }, Q41: ['rev', 'profit', 'ticket', 'rebook', 'ret', 'newc', 'hourly'] },
    expect: { noMainTop: true, tags: ['HEALTHY'], dontBuy: ['marketing_overhaul'], headline: 'fundamentals look strong' },
  },
];
