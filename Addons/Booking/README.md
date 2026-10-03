# Booking Addon 1.4.0

Standalone appointment booking for NecrotixLab CMS 1.3.97 or later. Cal.diy installation, account, origin and webhooks are not required for new bookings. No payment functionality is included.

## Setup

1. Deploy the CMS and run `npm run db:deploy`. The native booking migration adds a source marker and short-lived abuse counters without deleting old reservations.
2. Install/activate Booking from Admin > Addons. In Booking settings add up to eight named services with category, duration, platform, real meeting URL or joining instructions. Blank service names remove entries; service identifiers remain stable across edits.
3. Configure timezone (default Europe/Sofia), working weekdays, daily opening/closing times, blocked dates, notice, booking horizon and buffer. All services share one organizer and one schedule. By default requests need approval; pending requests reserve their time. Times are offered on a 15-minute grid.
4. Set organizer email for host notifications and configure the existing CMS SMTP settings. Zoom/Meet/Teams links are entered manually; choosing a platform does not generate a conference or connect an external calendar. Viber/phone can use contact instructions.
5. Set a strong BOOKING_CRON_SECRET. Schedule authenticated POST `/api/booking/notifications` every five minutes for retry delivery and retention cleanup; `/api/booking/reminders` every five minutes if reminders are enabled. Alternatively schedule `/api/booking/retention` daily. Use `Authorization: Bearer <BOOKING_CRON_SECRET>`. The application does not create hosting cron jobs.
6. Test `/booking`, an approval, rescheduling and decline, actual SMTP delivery and calendar invitation acceptance before sharing the page.

## Booking and administration

The public form requires first name, last name, email, international phone number, service and available time. Server-side validation enforces these fields. Personal data is sent in POST JSON, not URLs or browser storage. Slot responses disclose only available times, not reservations or customer details.

Reservation creation and admin changes serialize under a PostgreSQL advisory transaction lock. The server rechecks current addon settings and busy intervals before inserting or moving an appointment; pending and confirmed bookings both occupy time. Retries use a request UUID to return the same reservation without duplicating jobs. Conflicting submissions fail and ask for another time. Database counters limit successful requests to five per IP/email in a fixed 30-minute bucket. Configure the trusted reverse proxy to overwrite client IP forwarding headers. Counters contain bucket-specific hashes, not raw contact data, and expire after at most one hour; cleanup removes them. This is basic abuse protection, not identity verification.

OWNER/ADMIN can approve, decline, move and edit joining details from reservation details. Rescheduling approves the new slot and sends an update. Nonexistent or ambiguous local times during daylight-saving transitions are rejected. The public client contacts the organizer through `/contact` to request changes or cancellation; there are no anonymous mutation links. Public UI and emails distinguish approved, pending, rescheduled and declined. Existing completed status remains available for historic records.

Cal.diy-era records remain intact, read-only to native administration, and block their known active times. Optional existing signed provider webhooks can still synchronize legacy records; they cannot modify native request IDs. Native booking never calls the provider or requires CALDIY_* environment variables. If you still have real external bookings, manage them at the original provider until they conclude.

## SMTP and calendars

The existing transactional outbox queues client/organizer emails after create or admin update, attempts immediate delivery through NecrotixLab SMTP, and retries from cron. Missing SMTP does not roll back reservations: jobs remain pending and must be monitored in reservation details. Email delivery cannot be guaranteed by saving a booking alone. Reminders and optional private project creation remain available.

Calendar settings choose all confirmed bookings or individually selected bookings, and client/host/both/no recipients. Pending requests receive status information without a calendar invitation. ICS invitations use stable UID and increasing sequence; declines send cancellation when an addon invitation was previously delivered. Recipients accept invitations in their calendar app. There is no direct account synchronization, silent insertion or conflict detection against external calendars. Private notes are excluded from calendar files.

## Retention and export

CMS reservations/history are deleted 30 days after meeting end, or after cancellation/rejection/supersession for terminal records. Future active appointments are kept. Cleanup removes booking contacts, private booking notes and linked notification/reminder jobs; independent work projects are detached and preserved. Projects, backups, external provider data/calendars and downloaded exports have separate lifetimes.

OWNER/ADMIN can export all retained reservations, filtered results, or 1-200 selected records as UTF-8 CSV. All/filtered exports are capped at 5000 records with an explicit request to narrow filters. CSV includes contact and private booking information; responses are private/no-store and spreadsheet formula prefixes are neutralized. Keep downloaded exports private. Calendar ICS exports are a separate feature limited to 200 confirmed upcoming records.

## Package boundaries

The compiled CMS wrappers, Prisma schema/migrations and addon source must be upgraded together. Install/activate toggles enable the already compiled addon; uploading its ZIP alone cannot deploy new API routes or schema migrations. Deactivation prevents new native bookings while history/export and scheduled retention remain available. Uninstallation keeps retained records rather than destroying them immediately.
