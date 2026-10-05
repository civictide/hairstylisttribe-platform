# Kansas Cosmetology prospecting workspace: build spec

This spec is for moving the Kansas Cosmetology workspace into the existing Vercel + Supabase marketing backend. It must look and behave like `reference-Kansas-Cosmetology.html` and the earlier OC Home Services CRM, so both feel like one system.

| File | What it is |
|---|---|
| `GROKBOT-PROMPT.md` | Instructions to paste into Grok Bot. |
| `SPEC.md` | This file. |
| `ks_licensees_source.csv` | The original file, 31,958 rows, exactly as received. **Never modify it.** |
| `ks_licensees_derived.csv` | Calculated columns for the **30,678** licensees in the workspace, joined by `lead_id` / `source_row`. It includes `other_license_numbers` for people who hold several licenses. |
| `ks_removed.csv` | The 1,280 source rows left out of the workspace, with the reason for each (`shared` = phone number listed for several different people, 491 rows; `merged` = the same person's extra license record, 789 rows). |
| `removed_from_workspace_full_rows.csv` | The same 1,280 rows with all their original fields, for review. |
| `reference-Kansas-Cosmetology.html` | The working workspace as one HTML file. Open it in a browser. It is the reference for layout, behavior and wording, and its JavaScript can be reused. |
| `backup-format.md` | The format of the "Back up my work" JSON file, for importing existing work. |
| `EMAIL-MODULE.md` | Email outreach through the owner's Microsoft 365 business mailbox: daily approval batch, a 3-follow-up email sequence one day apart, reply/bounce/unsubscribe sync. Build it after the core workspace passes its tests. |

## 1. Principles (do not break these)

1. **Original data is never changed.** Source rows are loaded once into `ks_source` and are read-only. User corrections go in a separate table and are shown next to the original.
2. **These are licensees, not salon owners.** Do not add or guess owner/employee/booth-renter fields. Leave room for enrichment later (section 3.6).
3. **Contactability is not priority.** Contactability measures how many ways you can reach someone. Priority is set by hand.
4. **Nothing is sent automatically.** No texts, calls or emails go out without the user doing it.
5. **Private.** Everything sits behind login. No public URL may expose any licensee data. Add `noindex`.

## 2. Before writing code

Inspect the repo and report:
- the Next.js router type
- how Supabase auth and clients are set up
- how the OC Home Services CRM was built, if it already exists in this repo. Reuse its layout, components, auth and tables where possible.
- whether the marketing site has diagnostic or assessment links and campaign tracking that could carry `?ref=<lead_id>`

## 3. Database (Supabase migrations, row-level security on everything, owner-only access)

**Cleanup decided by the owner:**
- Load all 31,958 source rows into `ks_source` unchanged.
- Load `ks_removed.csv` into `ks_excluded(lead_id, reason, details)`.
- The workspace shows only `ks_source` rows that are **not** in `ks_excluded` (30,678). Use a view such as `ks_workspace`.
- For merged people, show `other_license_numbers` from `ks_derived` and include it in search.

```sql
-- 3.1 Original records: load ks_licensees_source.csv as-is. Every column is TEXT.
create table public.ks_source (
  lead_id text primary key,            -- 'K' || column_1
  column_1 text not null unique,
  licensee_name text, license_number text,   -- TEXT. Keep leading zeros (e.g. 000-106959).
  primary_phone text, other_phone text, primary_email text, remarks text,
  primary_line_type text, primary_carrier text, primary_prefix_type text,
  other_line_type text, other_carrier text, other_prefix_type text,
  imported_at timestamptz not null default now()
);
-- Reject later updates and deletes on ks_source with a trigger that raises an exception.

-- 3.2 Calculated columns: load ks_licensees_derived.csv (rebuildable from ks_source)
create table public.ks_derived (
  lead_id text primary key references public.ks_source(lead_id),
  best_contact_phone text, best_phone_type text, best_phone_source text,   -- 'primary' | 'other' | ''
  best_contact_method text,                                                -- Text | Call | Email | None
  has_phone boolean, has_cellphone boolean, has_email boolean, has_multiple_phones boolean,
  contactability text, contactability_score smallint,                      -- High | Medium | Low | None
  shared_group int, shared_group_size int, best_phone_shared_count int, email_shared_count int,
  dq_flags text[]
);

-- 3.3 Your working data, one row per licensee you've touched
create table public.ks_ops (
  lead_id text primary key references public.ks_source(lead_id),
  status smallint not null default 0,          -- see 4.1
  priority smallint not null default 0,        -- 0 Unranked, 1 High, 2 Medium, 3 Low
  follow_up date,
  quick_note text default '', notes text default '', opportunity text default '',
  reviewed_at timestamptz, updated_at timestamptz not null default now()
);

-- 3.4 Corrections, kept separate from the original
create table public.ks_edits (
  lead_id text primary key references public.ks_source(lead_id),
  name text, phone text, email text, edited_at timestamptz not null default now()
);

-- 3.5 Outreach history (append-only)
create table public.ks_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.ks_source(lead_id),
  at timestamptz not null default now(),
  channel text not null check (channel in ('text','call','email','voicemail','other','note','sys')),
  direction text check (direction in ('out','in')),
  outcome text default '',
  details text default '',
  kind text,                                  -- for 'sys' rows: 'status' | 'fu' | 'fudone' | 'pri'
  status_value smallint,
  campaign text                               -- for later attribution
);
create index on public.ks_activity (lead_id, at desc);
create index on public.ks_activity (at);

-- 3.6 Enrichment, for later. Create the table now but leave it empty.
create table public.ks_enrichment (
  lead_id text references public.ks_source(lead_id),
  field text not null,            -- e.g. 'business_name','city','website','role','instagram'
  value text, source text, confidence numeric, observed_at timestamptz default now(),
  primary key (lead_id, field, source)
);
```

Also add a `ks_user_state` table (or a user-metadata row) for:
- saved views
- the message template
- Outreach Mode settings
- "where you left off"

## 4. Behavior: match the reference HTML exactly

### 4.1 Statuses (index → label)
`0 Not contacted, 1 Attempted, 2 Contacted, 3 Responded, 4 Conversation, 5 Interested, 6 Follow-up, 7 Call scheduled, 8 Proposal / Offer, 9 Client, 10 Not interested, 11 Bad contact, 12 Do not contact`

### 4.2 Automatic status changes when an interaction is logged
Statuses only move forward. Client (9) and Do not contact (12) are never changed automatically.

| What was logged | New status |
|---|---|
| Text or email sent | 2 |
| Call: no answer | 1 |
| Call: voicemail | 2 |
| Call: connected | 4 |
| Any reply | 3 |
| Interested | 5 |
| Call back / Follow-up required | 6 |
| Not interested | 10 |
| Bad number (only if status is below 3) | 11 |

Notes never count as contact.

### 4.3 What each measure means
- **Contacted:** any outbound text, call, email or voicemail, or a status from 1 to 11.
- **Responded:** any inbound entry, or an outcome of Replied, Connected, Interested, Not interested or Call back, or a status from 3 to 9.
- **Conversation:** an outcome of Connected, or a status of 4, 5, 7, 8 or 9.
- **Interested:** a status of 5, 7, 8 or 9.
- **Follow-up done:** logging any interaction on a lead whose follow-up date is today or earlier records a `fudone` entry and clears the date.
- **Today metrics:** counted from `ks_activity` where `at` is today.

### 4.4 Dashboard
Exactly the reference page's cards:
- **KPI cards:** Total, Contactable, Cellphones, Landlines, VoIP, Email available, Multiple phones, Not contacted, Contacted, Responded, Interested, Follow-up needed, Clients, Do not contact.
- **Percentages:** with a phone, with a cellphone, with an email, cellphone + email.
- **Database progress bar.**
- **Today:** texts, calls, emails, responses, conversations, follow-ups done, new interested, new clients.
- **Funnel**, with percentages calculated only from real activity.
- **Follow-ups due today** and **Overdue** cards. Clicking either opens that work queue.

### 4.5 Table
- **Default columns:** Name, License #, Best phone, Phone type, Email, Status (changeable inline), Last contact, Next follow-up, Priority (changeable inline), Notes, Actions.
- **Columns you can switch on:** Other phone, Carrier, Contactability, Remarks, Shared contact, Row #.
- Virtualize the rows or paginate on the server; never render all 31,958 at once.
- **Search** across name, license, phone digits, email, remarks, carrier and your own notes. Use `pg_trgm` indexes or a generated `tsvector`.
- **Quick filters:**
  - Cell phone only, Landline only, VoIP only ("only" means every number on file is that type)
  - Has cell phone, Has email, Has cell + email
  - Has second phone (a genuinely different number)
  - No phone, No email, Unknown line type
- **Dropdown filters:** status, priority, primary line, other line, carrier, contactability, last contacted, follow-up, response, shared contact.
- **Segments:** All, Best contactability, Cellphone + email, Cellphone without email, Email only, Landline only, Not contacted, Responded, Interested, Follow-up today, Overdue, Upcoming, Contacted without follow-up, Clients, Do not contact, Bad contact info, Data quality. Plus custom saved views.
- **Export CSV:** all 13 original columns, the calculated columns, and your working fields with the full history.

### 4.6 Prospect profile (side panel, full screen on a phone)
- **Header:** status, priority, contactability.
- **Contact:** Text (`sms:`), Call (`tel:`), Email (`mailto:`), Copy phone, Copy email.
- **Log an interaction:** channel, direction, outcome, notes, date and time.
- **Follow-up:** Tomorrow, 3 days, next week, 30 days or a custom date.
- **Notes:** quick note, detailed notes, opportunity.
- **History** in time order. Deleting an entry needs a second click to confirm.
- **Original record:** read-only, with all 13 fields.
- **Correct contact info:** writes to `ks_edits`.
- **Shares a phone or email with:** a clickable list of the other licensees.
- **Data-quality flags.**

### 4.7 Outreach Mode (the most important screen; build it mobile-first)
- **Pick a queue:**
  - Cellphones — not contacted (default)
  - Cellphones + email — not contacted
  - Follow-ups due today (and overdue)
  - Overdue
  - People who responded
  - Interested
  - No response after first attempt
  - Anyone not contacted
  - The current filtered list
- **One person per screen:**
  - large buttons for Text, Call, Email, Copy phone, Copy message and Mark text sent (plus Mark email sent when they have an email)
  - after Call, outcome buttons: Connected, Voicemail, No answer, Bad number, Call back, Interested, Not interested
  - "They responded" buttons
  - follow-up buttons
  - a note box
  - Not interested and Do not contact buttons
  - Previous and Next pinned to the bottom
- **Settings:**
  - auto-advance after logging (on by default)
  - skip numbers already contacted through another licensee in the same shared group (on by default)
  - default follow-up after a text (3 days)
- **Message template** with `{first_name}`. The Text button opens `sms:` with the message filled in.
- Remember where you left off (queue and lead), so the dashboard can offer **Resume**.

### 4.8 Data quality
Show counts by flag. Flags come from `ks_derived.dq_flags`: `dup_name`, `dup_phone`, `dup_email`, `dup_license`, `missing_license`, `missing_name`, `missing_phone`, `missing_email`, `malformed_email`, `likely_test`. Flag only; never delete.

## 4.9 Tracking features (all in the reference HTML; build all of them)

1. **Automatic follow-up sequence.**
   - The steps are editable in settings. Default: day 0 text, day 3 text, day 7 call, day 14 email. Days count from the first outreach.
   - Each outbound text, call, voicemail or email moves the lead one step forward and sets the follow-up date to the next step's day (at least tomorrow), marked as set by the sequence (`fs`).
   - Any response stops the sequence (`done='replied'`) and clears that follow-up date.
   - After the last step: `done='finished'`.
   - Show "Step N of M: Channel" in the table, profile and Outreach Mode.
   - Store the state per lead (`sq`: step index, start date, next channel, done).
2. **Paste their reply.**
   - A text box in Outreach Mode and in the profile (inbound). It suggests an outcome from keywords:

     | Keywords | Suggested outcome |
     |---|---|
     | stop, unsubscribe, remove me, don't text | Opt-out |
     | not interested, no thanks | Not interested |
     | call me, later, busy, next week | Call back |
     | yes, interested, tell me more, price | Interested |
     | anything else | Replied |
     | wrong number | Bad number |

   - An opt-out saves the reply and sets the status to **Do not contact (12)**.
   - The reply text is saved in quotes in the activity details.
3. **Shared numbers.** The removal above takes care of most. Keep the "Skip numbers already contacted through another licensee" option and the "Shared ×N" chip for the 422 records that still share an email or a secondary number.
4. **Today's log and daily target.**
   - A list of every touch today (name, channel, direction, outcome, time) that opens the profile when clicked.
   - "Export today's log" as CSV.
   - An editable daily target (default 75 texts + calls + emails) with a progress bar.
5. **Gone quiet.** A queue and a segment for leads that were contacted with no response, whose last outbound touch is at least N days old (default 5, editable), that aren't Client, Not interested, Bad contact or Do not contact, and that have no future follow-up date.
6. **Message versions.**
   - Versions A, B and C are editable. Outreach Mode can pick one or rotate between the non-empty ones (by row number).
   - Each outbound text or email stores the version id (`tpl`) on the activity row. Add a `message_version` column to `ks_activity`.
   - The dashboard shows each version's people sent to, people who replied, and reply rate.
7. **Tags.**
   - Tags are added by hand. Defaults: Salon owner, Suite owner, Booth renter, Independent, Employee, Educator, Referral, plus custom tags.
   - Store them in a `ks_tags(lead_id, tag, added_at)` table.
   - Show them in the profile, Outreach Mode, a filter and an optional table column. Include them in search and export.
   - Tags are the owner's own enrichment; never fill them automatically.
8. **Undo.**
   - Undo the last 30 actions per session: the Undo button in Outreach Mode, the "Undo last action" button, the Undo link in the confirmation message, and Cmd/Ctrl+Z.
   - In the database, record each user action as an `action_id` on the rows it wrote, so an undo can revert exactly those rows.

## 5. Connecting to the marketing backend
- Add **Copy diagnostic link** to the profile and to Outreach Mode. It copies `<marketing site link>?ref=<lead_id>`.
- When the marketing site records a visit, form or assessment with `ref=K…`, insert a `ks_activity` row: `channel='other'`, `direction='in'`, `outcome='Replied'`, details describing what they did, and `campaign` filled in. Apply the same automatic status rules.
- Show a "Responded via website" badge in the table and a live toast through Supabase Realtime.
- If the OC Home Services CRM already does this, reuse the same matching code and pattern.

## 5b. Email module
Build everything in `EMAIL-MODULE.md` as part of this workspace, after sections 3–5 pass their tests. Its acceptance tests (section 8 there) are additional to section 7 here. Email sends are the one exception to "nothing is sent automatically": they still never go out without the owner approving that day's batch.

## 6. Import
- Load the two CSVs: 31,958 rows each, joined on `lead_id`.
- Add an **Import backup** button for the HTML workspace's backup JSON (see `backup-format.md`).
  - Map `ops[lead_id]` to `ks_ops`, `ks_edits` and `ks_activity`.
  - Never import anything into `ks_source`.
  - The import must be safe to run twice.

## 7. Acceptance tests: the user's 20 steps (all must pass)
1. Open the app (signed in). Signed out, every route redirects to login.
2. The dashboard shows **30,678** total, **20,549** cellphones, **29,836** with email and **20,317** with cell + email.
3. Filter to Has cell phone: **20,549**.
4. Add Not contacted: **20,549**.
5. Open Outreach Mode.
6. Look at one prospect.
7. Copy their phone; the clipboard holds the number.
8. Mark text sent; it moves to the next person.
9. Go back and add a note.
10. Set a follow-up for 3 days out.
11. Go to the next prospect.
12. Go back to the first.
13. Their contact attempt, note and follow-up are still there.
14. Mark them Responded.
15. Mark them Interested.
16. Search their name and find them.
17. Their whole history is visible in the profile.
18. Export CSV.
19. The original 13 fields in the export match `ks_licensees_source.csv` byte for byte for that row, with the license number's leading zeros intact.
20. Reload, or open on a second device: all working data is still there.

Then delete the test data. Also:
- `npm run build` passes
- deploy to a Vercel **preview**
- an anonymous (not signed-in) query returns no rows from any `ks_` table

## 8. Don'ts
- Don't modify or re-save the source CSV, and don't convert license numbers to numbers.
- Don't merge the remarks emails into `primary_email`. Keep them as remarks.
- Don't delete source rows. Exclude them only through `ks_excluded`. Flag the remaining duplicates and test records; don't delete them.
- Don't add owner/employee guesses.
- Don't send messages automatically.
- Don't put the service-role key in client code.
