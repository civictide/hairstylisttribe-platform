# Hairstylist Tribe: handover from the prospect-list and diagnostic chat

## 1. What was built

### A. The combined prospect list: "All Beauty Prospects"
Thirteen source lists were combined into **298,166 unique people and businesses**, from **610,923 source rows**. One record per person or business; every source list and source row is kept on the record.

**Source lists (rows in each):**
| Code | List | Rows |
|---|---|---|
| AR | Arkansas Cosmetology workspace export | 28,906 |
| KS | Kansas Cosmetology workspace export | 30,678 |
| KB | Kansas Board list, May 2 (name, license, type, active; no contact info) | 31,958 |
| US | US beauty licensees + emails (MI, VA, KS, AR) | 217,219 |
| EM | 220k emails clean final (mostly the same people as US; adds phone types and Instagram-derived contacts) | 218,318 |
| ME | Maine cosmetologists, line-type version (replaced the earlier phone-only file) | 19,427 |
| RI | Rhode Island cosmetologists, line-type version (replaced the earlier file) | 2,982 |
| TX | Texas mini establishments (salons; business phone, address, county, expiration) | 21,638 |
| VA | Virginia salons & shops (business, address, email; no phones) | 7,844 |
| IC / IG / IB / II | Instagram lists: hairstylist master clean (28,638), master no-flagged (32,459), 7k business (13,040), 14k individual (19,459), combined by handle | 31,953 unique handles |

The Arkansas and Kansas exports were already cleaned in earlier chats:
- **Arkansas:** 33,455 raw rows. 1,837 records on phones shared by different people were removed, and 2,712 same-person records were merged, leaving 28,906.
- **Kansas:** 31,958 raw rows. 491 shared-phone records were removed and 789 duplicate licenses merged, leaving 30,678.

The people those earlier passes removed come back in the combined list, through the US, 220k and Kansas Board lists. There they are flagged as shared, not removed.

**Results:**
| Measure | Count |
|---|---|
| Licensees | 235,553 |
| Salons & shops (Texas and Virginia) | 29,482 |
| Instagram-only accounts | 31,280 |
| Other contacts (Instagram-derived rows from the 220k list with no board match) | 1,851 |
| Instagram account linked to a person or salon | 17,855 |
| Any Instagram handle | 31,953 |
| Cellphone | 77,769 |
| Any phone | 136,760 |
| Email | 240,720 |
| No contact info at all | 2,299 |
| Contactability High (cell + email) | 55,136 |
| Contactability Medium (cell only, or landline + email) | 49,119 |
| Contactability Low (one landline, or email only) | 191,603 |
| Contactability None | 2,308 |
| Merged from 2+ source rows | 219,445 |
| In a shared-contact group (8,340 groups) | 22,006 |
| Students & apprentices | 9,306 |

**By state:**
| State | Records | Cell | Any phone | Email | Notes |
|---|---|---|---|---|---|
| Michigan | 98,112 | 441 | 930 | 97,886 | |
| Virginia | 63,643 | 368 | 671 | 62,408 | incl. 7,844 salons |
| Kansas | 31,238 | 20,891 | 30,956 | 30,337 | |
| Arkansas | 29,381 | 18,481 | 28,445 | 25,405 | |
| Texas | 23,610 | 5,652 | 23,605 | 1,741 | 21,638 salons |
| Maine | 19,484 | 11,274 | 19,475 | 93 | |
| Rhode Island | 3,150 | 1,444 | 3,142 | 155 | |
| Other states / no state | 29,548 | | | | mostly Instagram; 5,364 have no state, 1,193 are outside the US (mostly Canada) |

**How records were combined (decisions):**
- **Normalization:** phones were reduced to 10 digits. Emails were lowercased, invalid ones dropped, and junk like "info@x.comhttp" fixed. All-caps names were title-cased.
- **Same person = one record** only when one of these holds:
  - **Same license number in the same state.** The license type is part of the key, because Virginia restarts numbering per license type. Kansas is the exception, since its numbers are unique.
  - **Same email or phone *and* the same first and last name**, or one full name contained in the other (middle names, initials).
- **Businesses merge only by license number.** A first pass merged by shared email and chained 100+ salons together through one licensing agent's email, so that was removed.
- **Instagram:** an account was attached to a person only when exactly one person matched its email or phone, and only one account matched that person. Several stylists sharing a salon phone stay separate.
- **Nothing was deleted for being a duplicate.** Different people who share a phone or email (often a salon front desk) stay separate and are flagged `shared_phone` / `shared_email`, with a shared-contact group id and size. Test records such as "Jim Tester Doe" were kept.
- **Phone line type:**
  - **"lookup"** means the type came with a list: the Arkansas, Kansas, Maine and Rhode Island prefix classifications, the 220k list's phone type, or the Instagram carrier data.
  - **"by prefix"** means it was inferred from the Arkansas, Kansas, Maine and Rhode Island prefix classifications, where at least 80% of numbers in the same NPA-NXX agreed.
  - Everything else is **Unknown**, which applies to 17,552 best phones, mostly Texas. The NANPA prefix database was blocked from this chat.
- **Best phone** is the first cellphone, otherwise the first valid phone.
- **Record type:**
  - **Licensee:** the record comes from a state board list (AR, KS, KB, US, ME, RI, or 220k rows tagged licensee_emails/arkansas_board).
  - **Business:** Texas or Virginia salons.
  - **Instagram:** an Instagram account that didn't match a licensee.
  - **Contact:** any other row.
- **State** is the license state, otherwise the address or Instagram state.
- **Order:** US states A–Z, then non-US, then no state. Within each state, licensees, then businesses, then Instagram; cellphones first, then by name. IDs `P1`–`P298166` follow this order.

**Master CSV columns:**
| Column | Meaning |
|---|---|
| id | P-number |
| name | Person (for Texas salons, the owner) |
| business_name | Salon or shop name |
| record_type | Licensee / Business / Instagram / Contact |
| state | Two-letter state |
| license_type, other_license_types, license_number | All licenses found for the person |
| address, city, zip, county | Location |
| best_phone, best_phone_type, best_phone_carrier | Best phone and its type and carrier |
| phone_type_basis | lookup / by prefix / blank |
| other_phones | With their types |
| email, other_emails | Best email first |
| instagram, instagram_followers, instagram_account_type, website | Instagram details |
| contactability | High / Medium / Low / None |
| shared_contact_group, shared_contact_group_size | Group shared with other prospects |
| flags | merged, missing_phone, missing_email, shared_phone, shared_email, missing_name, no_contact, invalid_phone |
| source_lists | Plain-English list names |
| source_rows | Code:row for every source row merged in. Instagram rows are listed as IG:handle. |

### B. The "All Beauty Prospects" workspace page
- Live at https://claude.ai/artifact/VSaGQRdPBYHe8h3QsdwSMU (private).
- It's the Arkansas workspace extended to all states. It has the same outreach mode, 13 statuses, priorities, follow-ups, a 4-step follow-up sequence, A/B/C message versions, tags, notes, a today log, a funnel, backup/restore and CSV export.
- New in this version:
  - filters for state, record type and source list;
  - quick filters for "Has Instagram", "On several lists" and "Shares phone/email";
  - Instagram and "Salons & shops" segments;
  - profiles that show all phones and emails, Instagram, website, license numbers and every source row.
- The data is about 59 MB in 10 JSON files. It loads in about 4 seconds on a computer.
- No outreach work has been saved in it yet. The old Arkansas workspace had 5 profiles opened and nothing else; Kansas had nothing.
- Backup format and data layout: see README.md inside the workspace zip.

### C. The Beauty Business Growth Diagnostic
Not in the first engine zip, but included in the v2 zip:
- **Customer-facing version** (Hairstylist_Tribe_Diagnostic.html; live at https://claude.ai/artifact/B1czctY59tWUWm7g13pvxA). It has:
  - a welcome screen;
  - one question per screen with a progress bar, Back, and auto-advance on single-tap answers;
  - chair counters (+/−) for owners;
  - a "reading your answers" step, then the full report;
  - a Morning/Afternoon call request with name and mobile number;
  - a "Jump to a sample business" picker for the 10 scenarios.
- **Branding:** it says "Hairstylist Tribe" everywhere, but still uses the Civic Tide green, cream and gold colors.
- **Engine changes:** the engine now exports its routing helpers so the page can route live. Five scenario answer sets were completed after walking the live question flow. All 166 checks still pass.
- **Inspection page** (Beauty_Diagnostic_Matrix.html; live at https://claude.ai/artifact/35LQahLyf8vWLwxAC3Z46R): Backbone, Master matrix, Persona routing, Dimensions, Interventions, Scoring rules, Report rules and Simulations tabs.

Design decisions to carry forward:
- **One equation for every persona:** Demand × Conversion × Capacity utilization × Revenue per appointment × Retention = Economic output. Salon owners add the leverage layer: People × Chairs × Productivity × Retention × Systems.
- **Capacity gate:** at about 82% booked, or booked 4+ weeks out, acquisition is "not the constraint". Pricing, ticket and service mix are weighted up, and ads/followers go to "what I wouldn't spend money on".
- **Statuses per dimension:** Strong, Healthy, Watch, Opportunity, High priority, Insufficient information. There is no composite score.
- **Revenue per booked hour:** the thresholds ($45 / $60 / $80 / $110) are placeholders to tune with real data.
- **Money scenarios:** modest and shown with their arithmetic ("would represent approximately $X… before changes in client behavior, costs or capacity"). Never "you're losing $X".
- **Length:** assessments run 22–26 questions, a little above the 15–25 target.
- **Planned flow (not built):** Kansas/all-states prospect → private unique link (opaque token, never exposes the list) → completed assessment → personalized report → admin record → call with Ovi.

## 2. Open questions and unfinished steps
1. **Stable prospect IDs.** P-numbers come from sort order and change if the merge is rebuilt. Fix this, or freeze the data, before real outreach work is saved.
2. **The diagnostic saves nothing yet.** It still needs answer storage, per-prospect private links, the admin view, and call requests that reach Ovi.
3. **Phone types are still unknown for 17,552 best phones** (mostly Texas). Running the NANPA prefix lookup on Ovi's computer (or the platform) would fix most of them.
4. **Coverage gaps:**
   - Michigan and Virginia are about 99% email-only.
   - Maine and Rhode Island are almost phone-only.
   - Kansas Board rows that didn't match have no contact info.
5. **Brand:** Hairstylist Tribe colors and logo for the diagnostic and the workspace.
6. **Revenue-per-hour thresholds:** calibrate them against real assessments.
7. **Updated lists:** more were expected; only Maine and Rhode Island arrived.
8. **Compliance:** TCPA consent and Do Not Call scrubbing before any texting or calling at scale.
9. **Scale:** the workspace page is heavy (59 MB). The platform should hold this data in a real database.
10. **Old workspaces:** the separate Arkansas and Kansas workspaces still exist and are superseded.
11. **Edge records:** decide what to do with the 1,193 non-US Instagram accounts and the 5,364 records with no state.
