# Hairstylist Tribe — platform

The application side of Hairstylist Tribe: the back end, the stylist list, accounts and the admin. The marketing website lives in its own repo, `civictide/hairstylisttribe-website`.

**Status:** not started as an app. Everything that exists so far is described in [`docs/HANDOVER.md`](docs/HANDOVER.md). In this repo:
- `diagnostic-engine/`: the Beauty Business Growth Diagnostic, v2 (55-question matrix, 31 rules, economic model, 10 scenarios, 166 checks). `node sim/validate.js && node sim/run.js` runs the checks; `dist/beauty-diagnostic.html` is the customer-facing page.
- `merge-scripts/`: the Python that combined 13 source lists into the 298,166-record "All Beauty Prospects" master.
- `reference/beauty-prospects-workspace/`: the HTML prospect workspace (code only; its data files are not in git).
- `docs/handoffs/kansas`, `docs/handoffs/arkansas`: the earlier Kansas and Arkansas workspace specs.

The master list itself (All_Beauty_Prospects_master.csv, 298,166 rows) is kept out of git and will be loaded into the platform's database.

## Where things go
- **Stylist lists stay out of git.** They hold personal names, phones and emails, and they're too big for GitHub. They go into the platform's database (Supabase), loaded by a script that lives in this repo. `.gitignore` blocks CSV and Excel files so a list can't be committed by accident.
- **Same setup as Civic Tide** (`civictide/civictide-platform`): Next.js on Vercel, Postgres on Supabase. Its contractor list (about 397,000 rows, searched and paged on the server) is the pattern to reuse for the stylist list.

## Related repos
| Repo | What it is |
|---|---|
| `hairstylisttribe-website` | Hairstylist Tribe marketing site |
| `hairstylisttribe-platform` | This repo |
| `civictidelicensing` | Kansas Board of Cosmetology portal (licensing data and portal pieces may be reused) |
