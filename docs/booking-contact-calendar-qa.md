# Booking QA - CMS 1.3.97 / addon 1.4.0

Local checks: TypeScript, changed-source ESLint, all 194 unit tests, client-boundary audit (233 components), production build and git diff checks. Native regression cases cover no-provider readiness, service identifiers, notice/horizon/blocked dates/buffers, Sofia daylight-saving gaps and repeated times, idempotency, conflict handling, serialized concurrent request simulation, admin status transitions, legacy mutation rejection and persistent request caps. Endpoint tests verify origin/body/contact validation, inactive addon rejection and private success responses.

Production native BookingScreen compiled DOM fixture passed service/date/slot selection, contact submission and pending confirmation without iframe or browser contact storage. A new Playwright smoke case exercises the actual native UI/API/database under CI; it was not executed locally because no browser binary is available here.

All 38 PostgreSQL SQL migrations executed in PGlite with existing reservations preserved, notification uniqueness/cascade constraints and detached project preservation checked. Concurrent native unit tests use a serialized transaction double; they do not constitute a live multi-process PostgreSQL race test. CI deploys migrations against PostgreSQL 16.

Deployment checks: actual shared SMTP delivery, organizer recipient email, meeting links/instructions, calendar acceptance, and configured reminder/notification/retention cron. No external booking account, Cal.diy installation, OAuth meeting generation or separate booking hostname is needed. External calendars are not checked for conflicts.
