# Booking QA - CMS 1.3.97 / addon 1.4.0

Local checks: TypeScript, changed-source ESLint, all 195 unit tests, client-boundary audit (233 components), production build and git diff checks. Native regression cases cover no-provider readiness, service identifiers, notice/horizon/blocked dates/buffers, Sofia daylight-saving gaps and repeated times, idempotency, conflict handling, serialized concurrent request simulation, admin status transitions, legacy mutation rejection and persistent request caps. Endpoint tests verify origin/body/contact validation, inactive addon rejection and private success responses.

Production native BookingScreen compiled DOM fixture passed service/date/slot selection, contact submission and pending confirmation without iframe or browser contact storage. A new Playwright smoke case exercises the actual native UI/API/database under CI; it was not executed locally because no browser binary is available here.

All 38 PostgreSQL SQL migrations executed in PGlite with existing reservations preserved, notification uniqueness/cascade constraints and detached project preservation checked. Concurrent native unit tests use a serialized transaction double; they do not constitute a live multi-process PostgreSQL race test. CI deploys migrations against PostgreSQL 16.

Deployment checks: actual shared SMTP delivery, organizer recipient email, meeting links/instructions, calendar acceptance, and configured reminder/notification/retention cron. No external booking account, Cal.diy installation, OAuth meeting generation or separate booking hostname is needed. External calendars are not checked for conflicts.

CI investigation: desktop and mobile failures were the native POST returning 403. Browser trace showed a legitimate Origin/Host pair; Next reconstructed an internal request hostname. The corrected same-origin policy checks browser-facing Host and forwarded protocol, with regression cases for internal rewriting, TLS proxying, hostile origins, credentials and wrong ports/schemes. Visual smoke now asserts the POST response before checking confirmation.

Updater DOM checks verified one reload after an observed successful update and healthy matching runtime; historical success, failures and responses from the old runtime do not reload. The status API exposes its bundled runtime version to authenticated admins. Restart/network interruptions retain the current page and retry readiness checks.

## CMS 1.3.98 / addon 1.4.1 appointment experience

All 198 unit tests pass, including Monday-first month grids, leap years, Europe/Sofia spring/autumn month boundaries and monthly filtered CSV export. TypeScript, changed-source ESLint, production build and the client-boundary audit (234 components) pass. The production compiled DOM fixture exercises the four-step wizard, month calendar, contact preservation when editing, review before POST, and pending confirmation without iframe or browser contact storage.

The Playwright native booking case now follows service, date/time, contact and review before asserting the real POST and database record. It remains for CI desktop/mobile execution; no local browser binary is available, so the DOM fixture is not a visual screenshot review. Existing SMTP and deployment checks above still apply.
