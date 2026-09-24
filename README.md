<div align="center">

<img src="docs/assets/necrotixlab-banner.webp" alt="NecrotixLab CMS - experimental open-source CMS built with TypeScript, Next.js and PostgreSQL" width="100%" />

# NecrotixLab CMS

**An open-source CMS and digital lab for publishing, projects, services and modular tools.**

[![CI](https://github.com/drnecrotix/NecrotixLab/actions/workflows/ci.yml/badge.svg)](https://github.com/drnecrotix/NecrotixLab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-27c987.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-111827)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)

[Live site](https://necrotixlab.com) · [Documentation](docs/wiki/Home.md) · [Installation](docs/wiki/Requirements.md) · [Addons guide](docs/wiki/Addons.md) · [Contribute](#contributing)

</div>

## What is NecrotixLab?

NecrotixLab is the independent, experimental CMS behind [necrotixlab.com](https://necrotixlab.com). It combines a public site and a protected administration area in one Next.js application. Content lives in PostgreSQL through Prisma. The project is in active development, so review the [release notes](docs/releases/) and deployment requirements before upgrading a production installation.

### Included in the CMS

| Area | Capabilities |
| --- | --- |
| Publishing | Journal, custom pages, Wiki, comments, scheduling, revisions and SEO metadata |
| Portfolio | Projects and case studies, gallery, media library and homepage sections |
| Services | Service pages, request flows, pricing configuration and monitoring |
| Commerce | Digital products, private downloads, orders and optional payment integrations |
| Operations | Dashboard, audience analytics, site health, security settings and updater |
| Appearance | Navigation, footer, site modes, PWA settings and watermarks |

The public **Tools** collection is managed as the **Tools addon**. An initial installation does not activate it automatically. Admins can install and configure it from **Admin → Addons**. Addon source is kept under [`Addons/`](Addons/), separate from the CMS modules.

> Current addon boundary: ZIP imports validate and stage packages. New executable addon routes require a reviewed CMS build; uploading a ZIP alone does not run arbitrary server code. See the [Addons guide](docs/wiki/Addons.md).

## Stack

- Next.js 16, React 19, TypeScript and Tailwind CSS
- PostgreSQL and Prisma
- Auth.js, server actions and API routes
- Tiptap for rich content
- Node test runner, ESLint, TypeScript checks and Playwright
- Optional S3-compatible storage, SMTP and payment integrations

This is a server application with database-backed routes. It cannot be deployed as a static HTML export or on PHP-only hosting.

## Get started locally

**Requirements:** Node.js 22, npm and PostgreSQL 14+ ([full requirements](docs/wiki/Requirements.md)).

```bash
git clone https://github.com/drnecrotix/NecrotixLab.git
cd NecrotixLab
npm ci
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`. Set at least `DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD` and `NEXT_PUBLIC_SITE_URL` in `.env.local`. Use your own owner identity and strong secrets; never commit that file.

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000` for the site and `http://localhost:3000/admin` for the CMS. For a production server use `npm run db:deploy` and the matching [N0C](docs/wiki/Installation-N0C.md), [cPanel](docs/wiki/Installation-cPanel.md) or [home server](docs/wiki/Installation-Home-Server.md) guide. Run `npm run production:preflight` before a production build.

## Addons

The admin Addons page has **Available**, **Installed** and **Add New** views. The catalogue reads addon manifests from the GitHub `Addons/` directory. A package may be installed from its published archive or uploaded as a ZIP. Each addon has a separate folder and `manifest.json`; compatible Tools functionality can be activated and configured in its own settings page.

For the package format, versioning, GitHub publishing steps and current execution limits, read [Create and install an Addon](docs/wiki/Addons.md).

## Development and verification

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

`npm run build:n0c` is available for supported shared-host environments where native SWC cannot run. Run `npm run test:visual` when changing responsive UI. CI also validates production builds, updater behavior and deployment-sensitive changes.

## Documentation

- [Wiki index](docs/wiki/Home.md) and [Admin Dashboard](docs/wiki/Admin-Dashboard.md)
- [Requirements](docs/wiki/Requirements.md) and [Troubleshooting](docs/wiki/Troubleshooting.md)
- [Addons: create, publish and install](docs/wiki/Addons.md)
- [Updates and CI](docs/wiki/Updates-and-CI.md)
- [License and credits](docs/wiki/License-and-Credits.md)

## Contributing

Issues and focused pull requests are welcome. Create a branch from `main`, keep unrelated changes separate, and run the relevant checks before opening a PR. For addon contributions, follow the manifest and packaging rules in the [Addons guide](docs/wiki/Addons.md). Never include credentials, private customer data or production uploads in a PR.

## License and attribution

NecrotixLab is licensed under [MIT](LICENSE). The original PersonalBlog copyright notice by S. A. Almazril is retained. See [License and Credits](docs/wiki/License-and-Credits.md) for attribution and redistribution details. Third-party integrations remain subject to their own terms.
