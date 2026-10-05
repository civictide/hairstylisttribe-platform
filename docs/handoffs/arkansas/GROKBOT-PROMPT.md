Paste everything below the line into Grok Bot, with this folder (AR-Cosmetology-Handoff) attached or its path given.

---

You're working in my Vercel + Supabase marketing backend. Build my Arkansas Cosmetology prospecting workspace there as a private, signed-in section. It must look and work exactly like my Kansas Cosmetology workspace (same screens, same features, same wording) and like the working HTML version in this folder. If the Kansas workspace already exists in this repo, reuse it and only add the Arkansas data. Don't build a second, slightly different version.

The folder `AR-Cosmetology-Handoff` on my Desktop has:

- **SPEC.md**: the full spec. Follow it exactly.
- **ar_licensees_source.csv**: my original 33,455 rows (with a row_number column added). Load it as read-only text, and never change it.
- **ar_removed.csv**: 4,549 rows I've chosen to leave out of the workspace (shared phone lines, and duplicate records for the same person). Exclude these; don't delete them. The workspace has 28,906 people.
- **ar_licensees_derived.csv**: the calculated columns: best phone, contactability, other license types, student permit, shared-contact groups and data-quality flags.
- **reference-Arkansas-Cosmetology.html**: the working version. Open it in a browser and match it. You can reuse its JavaScript.
- **backup-format.md**: how to import the work I've already logged.
- **EMAIL-MODULE.md**: email outreach from my Microsoft 365 business mailbox (Microsoft Graph). It covers the daily approval batch, my email sequence (first email + 3 follow-ups one day apart, in the same thread), reply/bounce/unsubscribe syncing and compliance.

How to work:

1. **Look first, then report back before writing code.** Find:
   - the Next.js router type and how Supabase auth is set up
   - whether the Kansas Cosmetology workspace and the OC Home Services CRM are already built here, and which parts can be shared
   - how the marketing site could pass `?ref=<lead_id>`

   Show me the plan.
2. **Database:** build the tables in SPEC section 3 with row-level security (only my account), and load both CSVs. ZIP codes and phone numbers stay text. The original rows are read-only, and corrections go in a separate table.
3. **Pages:** build the dashboard, table, filters, segments, profile, data-quality view and **Outreach Mode** exactly as in SPEC section 4, including every tracking feature in section 4.9: follow-up sequence, paste reply, opt-out, today's log and target, gone quiet, message versions, tags and undo. Outreach Mode must be excellent on a phone. Start it on the "Cellphones — not contacted" queue.
4. **Marketing link:** add the `?ref=` link and inbound tracking from SPEC section 5.
5. **Import backup** button (SPEC section 6).
6. **Email module:** once steps 2–5 pass, build EMAIL-MODULE.md. Use only test addresses I control while testing, and never send to real licensees during setup. Tell me exactly what I need to click in Microsoft Entra ID / the Azure portal to register the app and grant consent.
7. **Test:** run all 20 workflow steps in SPEC section 7, all 15 email tests in EMAIL-MODULE.md section 8, and the security check. Then delete the test data. Deploy to a Vercel preview, not production, and give me the URL.

Rules:
- These are licensees, not confirmed salon owners. Don't invent owner, employee or booth-renter data.
- Contactability is not a sales score.
- Never send texts or calls automatically. Emails go out only after I approve each day's batch.
- Never expose this data publicly, and never put the service-role key in client code.
- Ask me before anything that deletes or overwrites existing data in Supabase.

When you're done, give me:
- the preview URL
- the migration file names
- the results of all 20 workflow tests and 15 email tests
- anything you couldn't finish
