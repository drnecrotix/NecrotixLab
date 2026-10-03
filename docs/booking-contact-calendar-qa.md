# Booking QA - CMS 1.3.96 / addon 1.3.1

Passed: TypeScript, changed-scope ESLint, all 182 unit tests, client-boundary audit (233 components), and git diff whitespace checks. Tests cover intake validation, webhook synchronization, notification retries/deduplication, calendar access and exports, status/date-change history, retention cutoff and CSV formula safety. CSV endpoint tests verify OWNER/ADMIN authorization before database reads, bounded queries, selected IDs and combined filters.

All 37 SQL migrations executed in PGlite PostgreSQL with an existing reservation preserved. Notification uniqueness/cascade and project preservation via nullable SetNull foreign key passed. This does not simulate concurrent live database workers.

Production BookingScreen compiled DOM fixture passed contact gating, invalid phone rejection, supported provider prefill and service reset. A browser binary could not be downloaded, so full browser screenshots were not available.

Deployment verification remains: actual CMS SMTP delivery, provider required contact fields, signed webhooks, Zoom/Meet OAuth or Viber joining instructions, calendar invitation acceptance and configured retry/retention cron. No live emails or calendar events were sent from this development session.

Retention applies to CMS reservations and their notification/reminder jobs. Future active bookings remain; independent projects are detached and preserved. Cal.diy, backups, external calendars and exported CSV files require separate retention handling.
