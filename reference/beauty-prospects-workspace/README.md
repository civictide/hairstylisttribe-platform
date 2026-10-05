# All Beauty Prospects workspace

Live page: https://claude.ai/artifact/VSaGQRdPBYHe8h3QsdwSMU (private to the owner)

## Files
- `index.html`: the page. On load it fetches `data/meta.json`, then the 10 row files `data/rows-1.json` … `rows-10.json`, in parallel.
- It must be served over http(s), for example `python3 -m http.server`. Opened directly as a file, the browser blocks the data fetch.
- On claude.ai it is published with the `db` and `downloads` capabilities.

## Data files
`meta.json` holds the lookup tables and the list of row files:
- `lt`: line types `["","cellphone","landline","voip","unknown","other","invalid"]`
- `kind`: `["Licensee","Business","Instagram","Contact"]`
- `src`: `[code, label, original file]` for the 13 sources, in bit order
- `flags`: flag names, in bit order
- `lic`: the license-type lookup table
- `car`: the carrier lookup table
- `files`, `total`

Each row is an array. Positions:

| # | Field |
|---|---|
| 0 | number (id = "P" + number) |
| 1 | name |
| 2 | business name (only when different from name) |
| 3 | kind index |
| 4 | state |
| 5 | license type index |
| 6 | other license types (" \| " separated) |
| 7 | license number(s) |
| 8 | city |
| 9 | zip |
| 10 | best phone (10 digits) |
| 11 | best phone line type index |
| 12 | carrier index |
| 13 | line-type basis (0 none, 1 came with a list, 2 inferred from prefix) |
| 14 | other phones, as "digits:lineTypeIndex;…" |
| 15 | emails (space separated, best first) |
| 16 | source bitmask (bit k = `meta.src[k]`) |
| 17 | Instagram handle |
| 18 | followers |
| 19 | Instagram account type ("b" business, "i" individual) |
| 20 | website |
| 21 | contactability tier (0 High, 1 Medium, 2 Low, 3 None) |
| 22 | shared-contact group size |
| 23 | shared-contact group id |
| 24 | how many prospects share the best phone |
| 25 | how many share the first email |
| 26 | flag bitmask |
| 27 | student/apprentice (1/0) |
| 28 | street address |
| 29 | county |
| 30 | license expiration |
| 31 | source rows, as "CODE:row …" |
| 32 | Instagram bio (first 160 characters) |
| 33 | active flag (Kansas board) |
| 34 | address state, when different from the license state |

## Where outreach work is saved
Outreach work is kept apart from the source data and never changes it.
- **On claude.ai:** in the page's database. Collection `ops` has 256 bucket documents `b0` … `b255`. A prospect lives in bucket number (P-number mod 256), as `{leads: {P123: op}}`. Settings are stored in `meta/state`.
- **Outside Claude:** in IndexedDB `bp-workspace`, plus localStorage keys `bp-ops-v1`, `bp-meta-v1` and `bp-ui-v1`.

An `op` (one prospect's work) looks like this:
```
{ s: status index, pr: priority index (0 Unranked, 1 High, 2 Medium, 3 Low),
  f: next follow-up "YYYY-MM-DD", fs: follow-up set by the sequence,
  qn: quick note, n: notes, op: opportunity,
  ed: {name, phone, email}  (corrections; the source record is never changed),
  log: [ {id, t: ISO time, ch: text|call|email|voicemail|other|note|sys, dir: out|in,
          out: outcome, x: details, tpl: message version, k/sv: system-entry type} ]  (newest first),
  tags: [..], sq: {i: step, st: start date, nx: next channel, done: "replied"|"finished"},
  rv: first reviewed, u: last updated }
```

The status index (`s`) maps to: 0 Not contacted, 1 Attempted, 2 Contacted, 3 Responded, 4 Conversation, 5 Interested, 6 Follow-up, 7 Call scheduled, 8 Proposal / Offer, 9 Client, 10 Not interested, 11 Bad contact, 12 Do not contact.

## Backup file
"Back up my work" saves `Beauty-Prospects-backup-YYYY-MM-DD.json`:
```
{ app: "beauty-prospects-workspace", v: 1, saved, source, readme,
  summary: {worked, contacted, responded, conversations, interested, clients, do_not_contact, follow_ups_due, overdue, today},
  leads: [ readable copy: id, name, business, state, license, instagram, best_phone, email, status, priority,
           follow_up, tags, sequence, quick_note, notes, opportunity, history[], last_updated ],
  ops:  { "P123": op, ... }   ← what "Restore from backup" reads
  meta: { views, settings: { tpls (message versions A/B/C), tplMode, seq (follow-up sequence), target, quietDays, tagList, ... } } }
```
- Restore merges by prospect id and keeps whichever copy has the newer `u`.
- Restore ignores ids that aren't in the current data.

**Important:** P-numbers come from sort order, so they change when the merge is rebuilt. No work has been saved yet. Before real outreach starts, either switch to stable ids or keep the current data frozen.
