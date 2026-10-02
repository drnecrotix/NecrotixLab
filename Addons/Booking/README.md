# Booking Addon 1.0.0

Cal.diy booking surface for NecrotixLab. Requires CMS 1.3.91 or later with the matching compiled wrappers.

## Architecture and delivered features

Cal.diy runs separately, preferably at `https://booking.necrotixlab.com`, with its own PostgreSQL database. NecrotixLab does not embed the Cal.diy monorepo into its build and does not copy its database. The addon provides install/activate/deactivate/uninstall, an administrator-only service editor (up to eight services), responsive light/dark presentation, BG/EN surrounding interface, an embedded calendar and an always-visible direct-link fallback.

Cal.diy owns event types, availability, guest booking, timezones, conflict checks, approval, confirmations, cancellation and rescheduling. Configure and test these in the selected Cal.diy release. Changing the addon’s duration label does not change the actual event type. No clients or appointment records are copied to the CMS.

Google and Outlook calendar connection buttons lead to the corresponding Cal.diy apps. OAuth tokens remain in Cal.diy. The addon does not report a connection as active merely because a setup button exists. Samsung Calendar displays the connected Google calendar on the phone; this is not a direct Samsung API integration.

Not delivered: independent reminder workflows, CRM history in the CMS, project creation, payments/deposits, enterprise/team features. Cal.diy removed enterprise Workflows, so reminders must be implemented and tested separately rather than implied by the integration. Some booking features, translations or integrations may differ by the deployed Cal.diy release.

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
