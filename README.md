# Hairstylist Tribe — platform

The application side of Hairstylist Tribe: the back end, the stylist list, accounts and the admin. The marketing website lives in its own repo, `civictide/hairstylisttribe-website`.

**Status:** not started. What gets built here hasn't been decided yet.

## Where things go
- **Stylist lists stay out of git.** They hold personal names, phones and emails, and they're too big for GitHub. They go into the platform's database (Supabase), loaded by a script that lives in this repo. `.gitignore` blocks CSV and Excel files so a list can't be committed by accident.
- **Same setup as Civic Tide** (`civictide/civictide-platform`): Next.js on Vercel, Postgres on Supabase. Its contractor list (about 397,000 rows, searched and paged on the server) is the pattern to reuse for the stylist list.

## Related repos
| Repo | What it is |
|---|---|
| `hairstylisttribe-website` | Hairstylist Tribe marketing site |
| `hairstylisttribe-platform` | This repo |
| `civictidelicensing` | Kansas Board of Cosmetology portal (licensing data and portal pieces may be reused) |
