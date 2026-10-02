# Booking addon validation

Typecheck, changed-file ESLint and all 131 unit tests pass. Unit checks cover disabled/incomplete configuration, origin and event-path validation, bounded services, embed theme/language parameters and archive manifest compatibility.

Browser UI verification is blocked: the supervised local Next.js webpack preview returned a blank page with a node:crypto UnhandledSchemeError. No claim is made that service switching, mobile layout or calendar interaction was visually verified. The preview fixture and layout changes are excluded from this PR.

No Cal.diy server or real Google/Microsoft account is configured in this environment. Booking concurrency, approval emails, OAuth token refresh, busy-calendar exclusion, cancellation/rescheduling and Samsung display sync require the separate deployment acceptance checks in Addons/Booking/README.md. The addon is inactive by default.
