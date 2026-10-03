# Booking Addon 1.3.0

Cal.diy booking surface for NecrotixLab. Requires CMS 1.3.95 or later with the matching compiled wrappers.

## Architecture and delivered features

Cal.diy runs separately, preferably at `https://booking.necrotixlab.com`, with its own PostgreSQL database. NecrotixLab does not embed the Cal.diy monorepo into its build and does not copy its database. The addon provides install/activate/deactivate/uninstall, an administrator-only service editor (up to eight services), responsive light/dark presentation, BG/EN surrounding interface, an embedded calendar and an always-visible direct-link fallback.

Cal.diy owns event types, availability, guest booking, timezones, conflict checks, approval, confirmations, cancellation and rescheduling. Configure and test these in the selected Cal.diy release. Changing the addon’s duration label does not change the actual event type. A signed webhook copies bounded reservation details into a dedicated CMS database table for administrator review. Calendar OAuth tokens stay in Cal.diy.

Google and Outlook calendar connection buttons lead to the corresponding Cal.diy apps. OAuth tokens remain in Cal.diy. The addon does not report a connection as active merely because a setup button exists. Samsung Calendar displays the connected Google calendar on the phone; this is not a direct Samsung API integration.

Booking 1.2 adds native email reminders, customer history and private project tracking. A full sales CRM, local payment/refund accounting, deposits and enterprise/team features remain outside this increment. Cal.diy remains the scheduling engine; its removed enterprise Workflows are not assumed to exist. Some booking features, translations or integrations may differ by the deployed Cal.diy release.

## Installation

1. Deploy an audited, pinned Cal.diy release from https://github.com/calcom/cal.diy to a separate Node.js application and PostgreSQL database. Confirm the host permits a second Node.js process and supports the selected release’s Node/build requirements. An FTP upload alone is not an installation. Use upstream release instructions, migrations, strong authentication/encryption secrets and SMTP.
2. Set Cal.diy’s `NEXT_PUBLIC_WEBAPP_URL` and applicable auth/public origin settings to the actual HTTPS hostname. Configure the instance to allow its booking pages to be framed by the NecrotixLab origin, following upstream guidance. Do not disable security headers globally.
3. Create the host account, event types and actual availability. For the MVP use one provider and two services, no payment requirement. Set duration, buffers, minimum notice, timezone, booking fields and approval policy in Cal.diy.
4. In NecrotixLab set `CALDIY_ORIGIN=https://booking.necrotixlab.com` and restart. Only an HTTPS origin is accepted; no path, credentials, query or fragment. CSP allows this exact frame origin while keeping `frame-ancestors 'none'` for NecrotixLab. An origin change requires a full reload of already-open pages.
5. Admin > Addons > Available > Booking > Install. Installation leaves it inactive. Open Settings and enter each exact `username/event-slug`, public title, description and matching duration label.
6. Run the acceptance checks below, then activate from Installed. `/services` shows the booking button only when installed, active and configured with at least one valid service. `/booking` provides a contact fallback when disabled or configuration cannot be loaded.
7. Admin > Addons > Installed > Booking > ZIP exports the addon package. Importing a matching archive installs the included package contract, not arbitrary uploaded server code. New code still requires a reviewed CMS deployment.

Deactivate/uninstall disables only the NecrotixLab entry point. It does not cancel existing appointments or disable direct public Cal.diy booking links. Existing settings are retained, and the external database is untouched.

## Calendar setup

- Google: configure the upstream Google OAuth application (`GOOGLE_API_CREDENTIALS` in versions using that setting), enable Calendar API and register the exact redirect URI shown by your Cal.diy instance. Connect via the Google Calendar app page. Select calendars to check for conflicts and a destination calendar for bookings. OAuth testing mode/token lifetime must be reviewed before real use.
- Microsoft: configure the upstream Outlook OAuth application in Microsoft Entra using the redirect URI and environment keys required by your pinned release. Connect through the `office365-calendar` app. Verify the supported account type, permissions and refresh behavior.
- Samsung: connect the same Google account on the Galaxy device. Settings > Accounts and backup > Manage accounts > Google > Sync account > Calendar. In Samsung Calendar select the Google calendar when saving an event. Device-local events do not automatically enter the Google calendar used for conflict checks.

Do not put client secrets or calendar credentials in CMS page content, addon archives, browser code or GitHub. Authorization is performed on Cal.diy’s own connection pages. The CMS has no OAuth tokens.

## Acceptance checks

- Install remains inactive; activation without origin/services exposes no booking button.
- Book on desktop and a real narrow/mobile viewport; switch service, language, light/dark theme and timezone.
- Connect a real test Google/Microsoft account; a busy external event removes the slot, and a confirmed booking appears in the configured calendar.
- Two visitors try the same slot simultaneously: the engine confirms only one booking. Verify buffers and blocked days.
- Approval-required booking stays pending until approved; confirmation email status matches the actual booking status.
- Cancellation/rescheduling email links work, free the old slot and update the external calendar.
- Europe/Sofia summer/winter transitions and visitor timezones give matching start/end times.
- Samsung displays the same Google event after device sync. Verify sync delay; do not promise instant updates.
- Frame blocked/unavailable: use Open separately; do not interpret iframe onLoad as evidence of a successful booking or calendar connection.
- Deactivation hides the CMS flow; external appointments and direct links still exist.

Cal.diy upstream explicitly recommends personal/non-production use. Do not enable real client bookings until the pinned release passes security, concurrency, notification and recovery checks. Keep database backups and an update plan.

## Source references

- https://github.com/calcom/cal.diy
- https://github.com/calcom/cal.diy/tree/main/packages/embeds/embed-core
- https://github.com/calcom/cal.diy/tree/main/packages/app-store/googlecalendar
- https://github.com/calcom/cal.diy/tree/main/packages/app-store/office365calendar
- https://www.samsung.com/ph/support/mobile-devices/how-to-sync-your-google-calendar-on-your-samsung-galaxy-device/

Addon source is MIT; no Cal.diy source is bundled in this package. Cal.diy must be installed separately under its own license and deployment requirements.

## Reservation records in the CMS

Deploy the included Prisma migration with `npm run db:deploy` before using `/admin/bookings`. The existing CMS self-updater also runs migrate deploy. Generate the Prisma client during the build. No existing table is dropped or rewritten.

Set a fresh random 32+ character `CALDIY_WEBHOOK_SECRET` in the CMS environment and the identical secret in Cal.diy's webhook settings. Use the actual HTTPS CMS URL plus `/api/booking/webhook` as the subscriber URL. Use the default upstream JSON payload, not a custom template. Enable BOOKING_CREATED, BOOKING_REQUESTED, BOOKING_CONFIRMED, BOOKING_REJECTED, BOOKING_CANCELLED and BOOKING_RESCHEDULED. MEETING_ENDED is accepted when the payload supplies the booking UID and start/end times.

The endpoint validates HMAC SHA-256 against the raw body, limits the body to 64 KB, ignores duplicate/stale events and serializes database changes inside a PostgreSQL transaction. Rescheduled bookings preserve their old UID history. Record fields: UID, service title, attendee name/email/timezone, start/end, notes, reason and status. There is no public reservation-list API. `/admin/bookings` requires OWNER or ADMIN and provides status filters and pagination; the dashboard links to it. Approve/cancel/reschedule in Cal.diy, then its webhook updates the CMS.

Deactivation of the public addon still allows synchronization while installed. Uninstall stops webhook ingestion but retains existing records. Existing reservations from before webhook setup are not automatically imported. Set up delivery retries in the selected Cal.diy release and test retry, out-of-order creation/reschedule, pending approval, cancellation and database outage. Do not treat a reservation as recorded locally until a signed delivery succeeds.

## Native Booking workflows (1.2)

Deploy CMS 1.3.93 and run `npm run db:deploy`. The new migration adds private notes, the `BookingProject` and `BookingReminder` tables, and indexes. Existing reservations are retained. These projects do not create public portfolio entries or send data to the external Workspace integration.

Admin > Reservations now has Upcoming, Past and Unconfirmed views, search by customer/service, status filters and pagination. Details show private administrator notes, the latest 30 reservations for the same email, project progress and the latest 20 reminder records. Customers has email search and pagination. Projects has status filters and pagination. Only OWNER/ADMIN can read or modify these records. Customer identities are inferred from attendee email, not from a new account/verified CRM identity. New webhook emails are trimmed and lowercased; detail history matches legacy email casing too.

In Booking Settings enable either workflow independently:

- Email reminder: disabled, 1, 24 or 48 hours before the appointment. Only a confirmed booking with a valid attendee email and a future reminder time is queued. A booking confirmed after its reminder time does not immediately send a late reminder. Offsets represent elapsed hours, including daylight saving changes.
- Automatic private project: create one project per confirmed reservation, idempotently. An administrator can also create a project manually from a confirmed/completed booking and update its title, notes and progress. Cancelling a reservation does not automatically cancel project work. On a UID-changing reschedule the previous project moves to the new reservation if it does not already have a project; existing project progress/notes survive.

Workflows default to disabled, including configurations saved by older addon versions. Changes apply to subsequent webhook events; there is no automatic historical backfill. The worker pauses when the addon is deactivated/uninstalled or reminders are disabled. Existing settings and records stay available.

### Reminder worker

1. Configure CMS SMTP under API Integrations or via the existing EMAIL_USER/EMAIL_APP_PASSWORD/SMTP_* variables.
2. Set an independent random `BOOKING_CRON_SECRET` of at least 32 characters in the CMS environment. Do not reuse the webhook secret. Restart the CMS.
3. Configure your server scheduler to POST the actual HTTPS CMS `/api/booking/reminders` every five minutes, with `Authorization: Bearer <BOOKING_CRON_SECRET>`. Store the secret in the scheduler's secret store, not in a public URL or GitHub. This PR does not create a hosted scheduler.
4. Enable the reminder interval. Send a test signed confirmation for a disposable attendee with a sufficiently distant appointment. Inspect the queued record from the administrator detail page. Invoke the worker at the due time and confirm delivery.

Each call handles at most ten due records. Atomic compare-and-set claims and a ten-minute lease prevent simultaneous workers claiming the same job. SMTP failure retries after five/ten minutes, with three total attempts. Expired leases are recoverable; an expired final attempt is marked FAILED. A stable Message-ID aids mail-provider deduplication but does not guarantee it. Delivery is at least once: a crash after SMTP acceptance and before the SENT database update can produce a duplicate. Check mailbox/provider logs before manually retrying a failed/uncertain job. There is no retry button in this increment.

A cancellation or reschedule cancels queued/in-progress old reminders; the worker checks the current booking, start time and configured interval again before sending. A message already in SMTP transmission cannot be recalled. Enable either Cal.diy reminders or addon reminders for the same event type to avoid duplicates. Google/Microsoft/Samsung calendar synchronization remains owned by Cal.diy and is unaffected by this worker.

### Admin booking overview

The Dashboard shows pending approval totals, future confirmed appointments and the five latest requests for OWNER/ADMIN users only while Booking is installed and active. The Reservations navigation and dashboard shortcut follow the same activation rule. Inactive addons preserve reservation history for direct administrator access but hide the dashboard overview. Query failures show an unavailable message instead of zero totals. New records arrive through signed Cal.diy webhooks; this panel does not import historical provider bookings or approve requests locally.

Payment setup is excluded from this version. Configure Cal.diy event types without a payment requirement. No checkout, payment configuration or payment verification is implemented by this addon.

Next increments: authenticated client access, CRM follow-ups, Workspace project synchronization and reminder templates.

### Workflow acceptance checks

- Existing addon configuration leaves both workflows off.
- Confirm a future reservation twice: one private project and one reminder key.
- Pending/rejected/cancelled bookings produce no new project or reminder.
- Reschedule to a new UID: old reminder cancels, current reminder gets the new time, project notes survive.
- Update private/project notes, reload, and ensure public `/projects` does not expose them.
- Run concurrent cron requests: only one worker claims the job; SMTP failure retries and then shows FAILED.
- Cancel before delivery: no new message; verify the in-flight limitation above.
- Deactivate/uninstall: worker returns disabled and sends nothing.
- Test narrow/desktop screens, light/dark, keyboard focus and reduced-motion behavior.

Architecture follows Cal.diy's event-type/booking separation: settings and public embed are presentation, webhook is the scheduling boundary, pure workflow policy defines eligibility, and the CMS owns its private project/reminder persistence. Public scheduling still renders the real Cal.diy booker; native admin views use tabs, compact divided rows, understated borders, theme tokens and small reduced-motion-aware hover effects. No upstream source has been copied into the addon.

## Add to calendar

Confirmed/completed reservations show Google Calendar, Outlook personal, Microsoft 365 and .ics export in the administrator detail view. The .ics file can be opened/imported by supported calendar apps, including Apple Calendar and Samsung where the device supports .ics import. For Samsung, syncing the same Google account remains the reliable fallback.

Exports include only the appointment title, UTC start/end and a generic confirmation instruction. Attendee email/name, attendee notes, private notes and project details are excluded. RFC 5545 escaping, CRLF lines and UTF-8 octet-aware line folding prevent content-line injection and preserve non-English text.

An administrator can open a private customer calendar link and share it with that attendee. Native reminder emails include that link when AUTH_SECRET has at least 32 characters and the configured public site URL is correct. The signed page at `/booking/calendar/[id]?token=...` offers the same providers and .ics download without an account. It displays the appointment title/time; calendar links and downloads also contain the platform and joining details. The token is bound to the booking ID, attendee email, event version and time range; webhook changes invalidate it, and it expires 30 days after the appointment ends. Anyone holding the link can access these appointment and joining details. Never publish it. Do not rotate a valid AUTH_SECRET merely to enable this feature; rotation invalidates sessions and existing private links.

The .ics endpoint `/api/booking/calendar/[id]` requires OWNER/ADMIN authentication or the matching private token. Pending/cancelled/rejected/superseded reservations cannot be exported. Calendar pages and downloads are no-store, noindex and no-referrer; calendar pages are excluded from the PWA offline cache and traffic pageview tracking.

This is a one-time calendar copy, not a subscribed calendar or OAuth synchronization. Save the event in the provider's confirmation form. Later cancellation/rescheduling does not automatically modify a manually added copy. Repeated imports can create duplicates even with a stable .ics UID. If Cal.diy already synchronized the appointment, avoid adding another copy.

Sources: https://www.rfc-editor.org/rfc/rfc5545 ; https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events ; https://learn.microsoft.com/en-gb/answers/questions/1008125/is-it-possible-to-launch-the-outlook-app%28calendar%29


## Contact form, meeting platforms and calendar invitations (1.3)

CMS 1.3.95 / addon 1.3.0 adds a client-side first step with separate first and last name, email, international telephone number and an explicit service selection. Categories come from the configured service catalogue, not from an invented static list. The selected event type's Cal.diy calendar is opened only after these fields validate. The names, email and `attendeePhoneNumber` are prefilled through Cal.diy's supported query parameters. These values remain in memory on the CMS page; they are not written to browser storage. They are necessarily visible to the external booking server and may appear in its access logs. Set appropriate logging and retention there.

**Provider configuration is required:** on every Cal.diy event type set name to separate required first/last fields, require email, and make `attendeePhoneNumber` visible and required. The CMS's preliminary form cannot enforce Cal.diy's independent direct links or API. Test both the CMS and direct provider paths before enabling real bookings. This release does not remotely modify Cal.diy event-type settings or deploy Cal.diy.

Booking settings add category, meeting platform (Cal.diy, Zoom, Google Meet, Viber, Teams, phone or other), joining instructions and optional numeric Cal.diy event type ID per service. Use the numeric ID to match webhooks reliably; the fallback matches the Cal.diy event title exactly. The platform must match the provider's actual event location. Connect Google Meet/Zoom/Teams in Cal.diy so it can create the conference URL. For Viber supply the organizer's contact instructions. Merely choosing a label does not create a conference. Signed webhooks read attendee phone, organizer email, actual video URL/location and provider iCal UID. Real provider location takes precedence over a configured display label. Missing meeting links are explicitly described as awaiting organizer joining details.

The webhook transaction persists a `BookingNotification` outbox record for each valid client/organizer recipient. After responding, Next's `after()` handler attempts delivery with the configured CMS SMTP account. Booking information emails are enabled by default; they show pending/confirmed/cancelled/rejected status, category/service, date/time, timezone, platform and joining details. Pending requests never receive a new calendar invitation. No real email is sent until a signed provider event arrives on an active installation with working SMTP. Organizer recipients come from the signed provider payload, not from public visitor input. Notifications are supplementary to Cal.diy scheduling messages; retain the original provider message for cancellation/reschedule links.

Admin > Booking Settings provides calendar scope **All confirmed bookings** or **Only individually selected bookings**, and recipients **Client and organizer / Client only / Organizer only / None**. Calendar invitations are independent of the informational email checkbox: invitation delivery necessarily uses email even when informational emails are off. Existing external events are not removed by changing these preferences. Pending/unconfirmed events cannot create invitations. In reservation details, set the per-booking selection or send one invitation; in the list, select rows or send for all upcoming confirmed reservations, capped at 200. A manual send selects that booking in individual mode. Already delivered or queued identical invites are not sent again. Delivery status appears in reservation details. Read-only .ics downloads support selected/all upcoming confirmed bookings, also capped at 200, and require OWNER/ADMIN.

Invitations are RFC 5545/5546 `METHOD:REQUEST`; supported clients offer acceptance into the recipient's calendar. They do not silently write into arbitrary Google/Outlook/Samsung accounts. Cal.diy remains responsible for OAuth-connected organizer calendars. Keep one system responsible for calendar invitations: if Cal.diy already sends them, choose **None** for addon invitations to avoid duplicates. Use an SMTP identity authorized to send for the organizer. Provider UID is preserved where available; on a UID-changing reschedule the previous local calendar UID is retained and the sequence is incremented. Cancelled/rejected events send `METHOD:CANCEL` when a previous addon invitation was delivered. Calendar applications still determine how invitation updates and cancellation are handled. Manually imported .ics events may require manual updating; downloads are not a live subscription.

Deploy the additive `20261003060000_booking_notifications` migration with `npm run db:deploy`; existing reservation history remains. Schedule POST `/api/booking/notifications` every five minutes with `Authorization: Bearer BOOKING_CRON_SECRET` (32+ characters). This is separate from the existing reminder endpoint and works with reminders disabled. The worker handles ten records, uses compare-and-set claims and ten-minute leases, retries with five/ten-minute delays and stops after three attempts. Stale booking versions are skipped. A state/content fingerprint suppresses duplicate provider messages describing an already-delivered identical booking. SMTP acceptance followed by a process crash can still duplicate delivery; stable Message-ID/UID help deduplication but do not guarantee it. Verify mailbox logs before retrying an uncertain delivery.

Acceptance: submit missing/invalid fields through CMS and direct provider links; book each category/platform; receive pending email without invitation; approve and verify client/organizer invitation delivery under all and selected modes; test each recipient setting; test repeated webhooks and created/confirmed duplicates; reschedule without duplicate calendar event; cancel and check the same UID cancellation; disable addon before cron; test SMTP retry and delivery status. Confirm dates across DST and actual Zoom/Meet/Viber joining instructions. No payments are configured by this addon.

Provider contracts reviewed: `calcom/cal.diy` `packages/features/bookings/lib/getBookingFields.ts`, `packages/features/bookings/Booker/hooks/useInitialFormValues.ts`, `packages/features/webhooks/lib/sendPayload.ts`, `packages/features/bookings/lib/getWebhookPayloadForBooking.ts` and `packages/types/Calendar.d.ts`.
