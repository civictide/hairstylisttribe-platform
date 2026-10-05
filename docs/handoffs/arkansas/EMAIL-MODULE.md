# Email module: Microsoft 365 sending, daily approval, follow-up sequences, reply sync

This adds email outreach to the Arkansas workspace (and to any other list in the same app, such as Kansas and OC Home Services). If the Kansas email module is already built, reuse it: the connection, suppression list, daily batch and sending worker are shared, and only the list (`'ar'`) and its sequences are new. Emails go out from the owner's **Microsoft 365 business mailbox** through the official Microsoft Graph API. Nothing sends without the owner approving that day's batch, and every send, reply, bounce and unsubscribe shows up in the app automatically.

> **Verify against Microsoft's current documentation** before building on any Graph endpoint, permission name or limit mentioned here. If something behaves differently than described, stop and report it. Don't guess.

---

## 1. Connection (Microsoft 365 business account)

- Register an app in **Microsoft Entra ID** (Azure portal → App registrations) for the owner's tenant.
- Use **delegated** permissions with the owner signing in: `Mail.Send`, `Mail.ReadWrite`, `offline_access`, `User.Read`.
  - Do **not** use application permissions. They would let the app send as any mailbox in the tenant.
  - If the tenant requires admin consent, the owner (as admin) grants it once.
- Add a **Settings → Email → Connect Microsoft 365** button that runs the OAuth sign-in. Store the refresh token **encrypted** in a server-only Supabase table (`mail_connection`). The client never sees a token.
- Show the connected mailbox address and a **Disconnect** button.
- **Recommended:** send from a separate mailbox on a separate outreach domain (for example `ovi@getcivictide.com` rather than the main domain), set up in the same tenant with SPF, DKIM and DMARC configured. The app should support picking which connected mailbox sends.

## 2. Data model (Supabase, row-level security, owner-only; tokens server-only)

```sql
create table public.mail_connection (
  id uuid primary key default gen_random_uuid(),
  mailbox text not null,                 -- sending address
  refresh_token_enc text not null,       -- encrypted; never selectable from the client
  connected_at timestamptz default now(),
  status text default 'active'           -- active | expired | revoked
);

create table public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  list text not null,                    -- 'ar' | 'ks' | 'oc' | …
  steps jsonb not null,                  -- see 3.1
  skip_weekends boolean default false,
  active boolean default true
);

create table public.email_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  list text not null,
  sequence_id uuid references public.email_sequences(id),
  to_email text not null,                -- edited email if present, else source email
  step smallint not null default 0,      -- index of the NEXT step to send
  next_send_date date,
  status text not null default 'active', -- active | replied | unsubscribed | bounced | finished | stopped
  first_message_id text,                 -- Graph id of Email 1 in Sent Items (for threading)
  conversation_id text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  unique (lead_id, sequence_id)
);

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.email_enrollments(id),
  lead_id text not null, list text not null,
  step smallint not null,
  batch_date date not null,
  subject text, body_html text,          -- snapshot of exactly what was approved
  status text not null default 'pending_review', -- pending_review | approved | sending | sent | failed | skipped
  graph_message_id text, internet_message_id text, conversation_id text,
  error text, sent_at timestamptz,
  unique (enrollment_id, step)           -- a step can never be sent twice
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  lead_id text, list text, enrollment_id uuid,
  kind text not null,                    -- reply | auto_reply | bounce | unsubscribe
  from_email text, subject text, snippet text,
  graph_message_id text unique,
  received_at timestamptz
);

create table public.email_suppression (
  email text primary key,                -- lowercased
  reason text not null,                  -- unsubscribed | bounced | do_not_contact | manual
  source text, added_at timestamptz default now()
);
```

Every send and every inbound event **also** writes a row to the list's activity table (`ar_activity` for Arkansas):
- **A send:** `channel='email'`, `direction='out'`, `message_version` = the step's version, details "Email 2 of 4: <subject>".
- **A reply:** `direction='in'`, `outcome='Replied'`, details = a quoted snippet.

The existing automatic status rules then apply (section 4.2 of SPEC.md).

## 3. Email sequences

### 3.1 Steps
`steps` is an ordered array:

```json
[
  {"offset_days": 0, "subject": "Quick question, {first_name}", "body": "…", "version": "E1"},
  {"offset_days": 1, "reply": true, "body": "…", "version": "E2"},
  {"offset_days": 2, "reply": true, "body": "…", "version": "E3"},
  {"offset_days": 3, "reply": true, "body": "…", "version": "E4"}
]
```

- **Default the owner asked for:** the first email plus **3 follow-ups, one day apart** (offsets 0, 1, 2, 3). All offsets are editable, and the editor offers a gentler preset (0, 2, 5, 9).
- `offset_days` counts from the day Email 1 was **sent**.
- With `skip_weekends`, Saturday and Sunday don't count. A step that would land on a weekend moves to Monday.
- Merge fields: `{first_name}` (NAME_FIRST), `{name}`, `{license_type}`, `{city}`.
- Every email automatically gets the required footer (section 6).
- The sequence editor has a live preview with a real lead's data and **Send test to me**.

### 3.1b Editing
- Edits in the sequence editor apply to **every email not sent yet**, including people already partway through. Already-sent emails stay exactly as sent: `email_messages` stores a snapshot.
- On the daily approval screen:
  - Editing one message changes only that message.
  - **Undo my edits** regenerates it from the sequence.
  - Pending messages that weren't edited by hand are regenerated whenever the sequence changes.
- Each step can have a version A and an optional version B. The sequence can send A, send B, or split (alternate A/B per new enrollment). The version is fixed per person, so reply rates compare cleanly.
- The text-message versions in Outreach Mode stay separate from email versions.
- The OC Home Services reference HTML (`OC-CRM-Handoff/reference-OC-Home-Services.html`, **Email outreach**) shows working versions of the sequence editor, the daily approval screen and the versions report. Match it.

### 3.2 Threading
- Follow-ups with `"reply": true` go **in the same thread** as Email 1.
- Suggested approach (verify it):
  1. Create a reply draft from Email 1 in Sent Items (`POST /me/messages/{first_message_id}/createReply`).
  2. Set its recipient to the lead's address and set the body (`PATCH`). A reply draft made from your own sent message would otherwise be addressed to you.
  3. Send it (`POST /me/messages/{id}/send`).
- Email 1 itself:
  1. Create it as a draft (`POST /me/messages`), so you get its `id`, `conversationId` and `internetMessageId`.
  2. Send it (`POST /me/messages/{id}/send`).
  3. Find the copy in Sent Items by `internetMessageId` and save its id as `first_message_id`.
- **Test that follow-ups appear in one conversation** both in Outlook and in a Gmail recipient's inbox.

### 3.3 Enrollment
- On the list page, a **Start email sequence** action enrolls the selected people or the current filter. Outreach Mode has the same action for the current person.
- **Never enroll** someone who has no email, is on `email_suppression`, has status Client / Not interested / Bad contact / Do not contact, or is already in an active enrollment.
- A reply on **any** channel (text, call or email) stops every active enrollment for that lead.

## 4. The daily batch (never sends without approval)

1. **Build.** A Vercel Cron job runs every morning (for example 6:00 a.m. America/Chicago; Arkansas is on Central time).
   - It creates `email_messages` rows with `pending_review` for that date.
   - First come follow-ups that are due: active enrollments with `next_send_date` on or before today.
   - Then new people for Email 1, taken from the queue the owner picked (for example "Cellphones + email — not contacted", or any saved view), up to the remaining room under the **daily cap**.
   - Planning hint, shown in settings: once a 4-step sequence is running, daily volume is about 4 × new people per day. Settings shows "with a cap of N you can start about N/4 new people per day."
2. **Review.** A **Today's emails** page shows each message (recipient, step, subject, body) with:
   - editing of that one message
   - **Skip** for this person today
   - **Approve all**, or approve selected messages
   - a running count against the cap

   Nothing changes to `approved` without the owner clicking.
3. **Send.** A worker (Vercel Cron every few minutes, or a queue) sends `approved` messages:
   - Only within a sending window (default 8:30 a.m.–4:30 p.m. Central, Monday–Friday unless weekends are allowed).
   - With randomized spacing (default 60–180 seconds between sends).
   - On HTTP 429 or other throttling, honor `Retry-After` and pause. Never retry in a tight loop.
   - Idempotency: mark a message `sending` before calling Graph. The `unique (enrollment_id, step)` constraint means a re-run can never double-send. A failure → `failed` with the error, shown on the review page with a **Retry** button.
   - On success: `sent`, store the ids, write the activity row, then advance the enrollment (`step+1` and the next `next_send_date`, or `finished` after the last step).
4. **Daily cap** and **sending window** are settings. Keep the cap well below Microsoft's current sending limits for the account (look them up; don't hard-code them).

## 5. Replies, auto-replies and bounces (inbox sync)

- Subscribe to new Inbox messages with Microsoft Graph change notifications → a Vercel route (`/api/mail/notify`) with validation-token handling.
  - Renew the subscription on a schedule before it expires (a Vercel Cron job).
  - **Also** run a fallback **delta query** on the Inbox every ~15 minutes, so nothing is missed if a notification drops.
- For each new inbound message, fetch it with `internetMessageHeaders`, `from`, `subject`, `conversationId` and `bodyPreview`. Classify it:
  - **Auto-reply / out of office:** the `Auto-Submitted` header is not `no`, or there are `X-Auto-Response-Suppress` or `X-Autoreply` headers, or the subject starts with "Automatic reply" / "Out of Office" → `kind='auto_reply'`. **Does not stop the sequence.**
  - **Bounce / delivery failure:** from postmaster or MAILER-DAEMON, or a delivery-failure report → `kind='bounce'`. Find the original recipient, stop the enrollment (`bounced`), add the address to `email_suppression` (`bounced`), and log "Email bounced". Don't change a status above 2. Below that, set **Bad contact** only if the lead has no phone.
  - **Real reply:** everything else that matches → `kind='reply'`. Stop all enrollments for the lead (`replied`), write the inbound activity row (`outcome='Replied'`, quoted snippet), and show a **New reply** badge and live toast through Supabase Realtime.
- **Matching order:**
  1. `conversationId` equals an enrollment's `conversation_id`.
  2. The sender address equals the enrollment's `to_email`.
  3. The sender address equals the lead's source or edited email, or the email in remarks (`Unnamed: 8`).

  Unmatched messages are ignored. Never act on mail that matches no lead.
- Run the same opt-out keyword check as the workspace's **Paste reply** feature on the reply text. "stop", "unsubscribe" or "remove me" also triggers the unsubscribe flow below.

## 6. Unsubscribe and compliance (CAN-SPAM)

Every email gets a footer the owner configures once in settings:
- the sender's **physical postal address** (required; block sending until it's set)
- a clear **unsubscribe link**: `https://<site>/u/<token>`, where the token is a signed per-enrollment value

**Unsubscribe page:**
- It's public and needs no login. It shows "Unsubscribe <email> from Civic Tide emails?" with one **Unsubscribe** button. Requiring a click (a POST) stops link-scanning security tools from unsubscribing people by accident.
- On confirm:
  - add the address to `email_suppression` (`unsubscribed`)
  - stop all of that lead's enrollments (`unsubscribed`)
  - set the lead's status to **Do not contact**
  - log "Unsubscribed via email link"
  - show a confirmation
- It must work for at least 30 days after the email. Honor it immediately, well within the legal 10 business days.
- Check the suppression list **right before every send**, not only when building the batch.
- The suppression list is **shared across all lists** (Arkansas, Kansas, OC, future ones).
- Microsoft Graph only lets apps set custom `x-` headers, so a standard `List-Unsubscribe` header may not be possible this way. Verify it, and if it isn't possible, rely on the footer link.
- Subject lines must be accurate, and the "from" must be the owner's real name and mailbox.
- **Texts are not part of this module.** Texting stays manual, from the owner's own phone.

## 7. In the app

- **Profile:**
  - an **Email sequence** card: the sequence name, "Email 2 of 4 sent Oct 3", the next send date, status (active / replied / unsubscribed / bounced / finished), and **Stop sequence**
  - the full thread (subjects, snippets) in the outreach history
- **Table:** an optional "Email sequence" column (step and status) and a filter by sequence status.
- **Dashboard:**
  - Emails today: sent, replies, bounces, unsubscribes
  - Sequence performance per step and per version: sent, reply rate, unsubscribe rate, bounce rate
  - a warning banner if the bounce rate is above 3% or unsubscribes are above 1% for the day
- **Outreach Mode:** a **Start email sequence** button, and a badge when the person is already in one.
- **Settings → Email:**
  - connection status
  - sending mailbox
  - daily cap, sending window and spacing
  - skip weekends
  - postal address and footer text
  - the sequence editor (steps, offsets, subject and bodies, versions, preview, test send)
  - the suppression list (search, add manually, export)

## 8. Acceptance tests (all must pass before calling it done)

Use **test addresses the owner controls**. Never test-send to real licensees.

1. Connect Microsoft 365. The mailbox shows in settings. No token ever reaches the browser (check network responses).
2. Send a test from the sequence editor, and it arrives with the footer, postal address and unsubscribe link.
3. Enroll 3 test leads (test emails). The morning batch shows 3 Email 1 messages as `pending_review`. **Nothing sends before Approve.**
4. Approve. The messages send within the window with spacing. Each lead's history shows "Email 1 of 4", and the next send date is +1 day.
5. Simulate the next day (or run the job with a date override). The follow-ups are first in the batch and send **in the same thread** in Outlook and in a Gmail test inbox.
6. Reply from test lead A. Within 15 minutes, lead A shows **New reply**, the inbound history entry and status Responded, the enrollment is `replied`, and no further emails are scheduled for A.
7. An auto-reply from test lead B is logged as `auto_reply` and B's sequence **continues**.
8. Send to a non-existent address. The bounce is detected, the enrollment is `bounced`, and the address is added to the suppression list.
9. Click the unsubscribe link for lead C and confirm. C becomes Do not contact and is suppressed, the enrollment is `unsubscribed`, and C is excluded from the next batch. The same address can't be enrolled in another list.
10. Set the cap to 2 with 3 due follow-ups and 5 new people. The batch holds 2 messages, both follow-ups.
11. Run the send job twice at once. There are no duplicate sends (check Sent Items).
12. With skip weekends on, a step due on Saturday is scheduled for Monday.
13. Force a 429 (or mock it). The worker waits for `Retry-After`, then continues.
14. Signed out, every email page and API route except `/u/<token>` and the Graph webhook returns 401 or redirects. The webhook rejects requests that fail validation.
15. Remove all test data and test subscriptions afterward.

## 9. Don'ts
- Don't send anything without the owner's approval for that day's batch.
- Don't send texts automatically.
- Don't hard-code Microsoft sending limits; read them from settings and the docs.
- Don't store tokens or the service-role key anywhere the client can read.
- Don't email anyone on the suppression list or with status Do not contact, ever.
- Don't use the owner's main domain mailbox for volume if a separate outreach mailbox is available. Recommend one.
