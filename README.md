<div align="center">

# NecrotixLab

**An independent digital lab for web products, publishing, creative work, community systems and emerging CAD/CNC services.**

[![NecrotixLab CI](https://github.com/drnecrotix/NecrotixLab/actions/workflows/ci.yml/badge.svg)](https://github.com/drnecrotix/NecrotixLab/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](LICENSE)

[Live website](https://necrotixlab.com/) · [Documentation](docs/wiki/Home.md) · [Admin guide](docs/wiki/Admin-Dashboard.md) · [Deployment and updates](docs/wiki/Updates-and-CI.md)

</div>

---

## About

NecrotixLab is no longer a conventional personal portfolio. It is the digital studio and experimental platform of **Dr. Necrotix**, combining public work, editorial publishing, software tools, community projects, digital products and technical services in one independently operated system.

The public website and custom CMS are a single Next.js application. Content is stored in PostgreSQL, managed through the protected `/admin` workspace and published without relying on WordPress or a hosted page builder.

| Area | Purpose |
| --- | --- |
| **Digital products** | Websites, dashboards, portals, utilities and custom web systems |
| **Editorial and creative work** | Journal, gallery, visual stories, case studies and Wiki publications |
| **Communities** | Community platforms, Discord ecosystems, automation and operational tools |
| **Engineering** | Developing CAD, technical drawing and CNC programming capabilities |
| **Operations** | CMS, analytics, security, monitoring, commerce and production deployment |

> NecrotixLab is an independent creator-led project, not an agency platform.

---

## Public experience

### Editorial Lab homepage

The homepage presents NecrotixLab as an active studio rather than a project archive.

- original interactive Hero
- editorial introduction and capability map
- Engineering / CNC Lab toolpath visualization
- CMS-powered Journal
- selected case studies with completed work prioritized
- services and ways of working
- active and planned work in **Now in the Lab**
- focused project contact entry point

### Content and work

- project archive with categories, status filters and detailed case studies
- Journal with reusable publication types, taxonomies, comments, replies and likes
- artwork, photography and video gallery
- Wiki with articles, search, categories and FAQ
- Journey and Career Dossier
- flexible CMS pages
- contact and service-request flows
- configurable navigation and footer

### Lab Services

NecrotixLab includes service discovery and guided request tools for:

- new websites and web platforms
- WordPress and custom website support
- website inspection, SEO, accessibility and technical analysis
- future remote PC assistance
- developing technical drawing, CAD preparation and CNC program services

Engineering services remain marked **Coming Soon** until their workflows and sample programs are validated.

### Free tools

The platform includes or is preparing focused browser utilities:

- Website Inspector
- Accessibility Check
- SEO Intelligence
- Site Crawl / Broken Links
- Email Domain Security
- WHOIS Lookup
- DXF Inspector
- G-code Viewer
- DXF, SVG and Gerber to G-code workflows

Future manufacturing utilities are intentionally scoped as lightweight preparation and inspection tools rather than direct machine control.

---

## Administration system

The protected `/admin` area is organized into **Content**, **Commerce**, **Appearance**, **Publishing & SEO**, **Tools** and **Administration**.

### Content

| Module | Capabilities |
| --- | --- |
| **Homepage** | Identity, Hero content, section visibility, media and social metadata |
| **Journey** | Work history, timeline content and public presentation |
| **Career Dossier** | Professional profile, experience, skills and resume content |
| **Wiki** | Main page, articles, categories, FAQ and search structure |
| **Projects** | Status, case-study content, media, technologies, links and SEO |
| **Journal** | Rich-text publications, taxonomies, scheduling, preview and revisions |
| **Comments** | Moderation, replies, search and article context |
| **Gallery** | Images, video, metadata, EXIF-assisted forms, ordering and visibility |
| **Pages** | Custom standalone pages with rich content and reusable slugs |
| **Media** | Shared asset library used throughout the site and Store |

### Commerce and services

- downloadable and externally hosted digital products
- free and paid product flows
- Creem and Lemon Squeezy integrations
- protected download grants
- cart, orders and fulfillment context
- service requests and configurable website estimates
- centralized service pricing
- service monitoring

### Appearance and publishing

- nested navigation management
- configurable footer
- media watermark controls
- PWA installation, offline and reader settings
- content revisions
- global and content-level SEO
- Open Graph and X/Twitter previews
- redirects
- configurable Site Mode

Supported Site Modes:

```text
NORMAL · MAINTENANCE · COMING_SOON · PRIVATE · ARCHIVE
```

### Operations and security

- compact operational Dashboard
- Audience & Traffic with visitor, device, location and IP context
- live-page activity without duplicate visitor states
- data export and retention controls
- Site Health checks and seven-day error log
- Security analysis and configurable protection layers
- authentication throttling
- API integrations
- staged GitHub self-updater

| Role | Scope |
| --- | --- |
| `OWNER` | Full system control and owner-only operations |
| `ADMIN` | Content, commerce and sensitive operational tools |
| `EDITOR` | Editorial workflows with restricted administrative access |

---

## Architecture

```text
Browser
  ├─ Public experience
  ├─ Admin CMS
  └─ PWA and offline reader
          │
       Next.js
  ├─ Server Components and Actions
  ├─ Auth.js authorization
  ├─ API routes and monitoring
  └─ Prisma data access
          │
      PostgreSQL
```

Private Store assets are served through protected application routes rather than exposed as public file URLs. Supported deployments can use persistent local storage or S3-compatible object storage.

---

## Technology

| Layer | Technologies |
| --- | --- |
| **Application** | Next.js 16, React 19, TypeScript |
| **Database** | PostgreSQL, Prisma 6 |
| **Authentication** | Auth.js / NextAuth v5, bcrypt |
| **Interface** | Tailwind CSS, Framer Motion, GSAP, Lenis, Three.js |
| **Content** | Tiptap and structured CMS data |
| **Validation** | Zod and server-side normalization |
| **Commerce** | Creem, Lemon Squeezy |
| **Storage** | Private filesystem, Cloudflare R2 and S3-compatible workflows |
| **Mail** | Nodemailer / SMTP |
| **Testing** | TypeScript, ESLint, Node test runner, Playwright |
| **Automation** | GitHub Actions and staged production updater |

---

## Local development

Requirements:

- supported Node.js LTS release
- npm
- PostgreSQL

```bash
git clone https://github.com/drnecrotix/NecrotixLab.git
cd NecrotixLab
npm ci
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure the database, Auth secret, owner seed credentials and public site URL, then run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Development URLs:

- Public application: `http://localhost:3000`
- Administration: `http://localhost:3000/admin`

Use the environment-specific installation guides for production deployments.

---

## Commands

```bash
npm run dev                  # Development server
npm run build                # Standard production build
npm run build:n0c            # N0C / WASM compatibility build
npm run start                # Start the production build
npm run lint                 # ESLint
npm run typecheck            # TypeScript validation
npm run test:unit            # Unit tests
npm run test:visual          # Playwright responsive tests
npm run production:preflight # Production environment checks
npm run security:client-boundaries
npm run security:client-bundle
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:deploy
npm run db:status
npm run db:seed
npm run db:studio
```

---

## Environment and private data

Never commit database credentials, Auth secrets, SMTP credentials, payment-provider keys, storage credentials or private API tokens.

Private Store uploads default to:

```text
<project>/storage/store-private
```

Production deployments should use a persistent absolute path where possible:

```env
STORE_PRIVATE_STORAGE_PATH="/absolute/private/path/necrotixlab-store"
```

Do not place protected digital products directly inside `public/`.

---

## Quality and CI

Pull requests are checked for:

- application versioning on deployable changes
- Prisma schema and migration consistency
- TypeScript correctness and ESLint compliance
- standard and N0C-compatible production builds
- updater regressions
- client boundary and bundle safety
- protected public-design changes
- responsive Playwright smoke tests
- desktop and mobile overflow
- live production responsive health

Intentional protected visual changes may require the `design-approved` label.

---

## Documentation

| Guide | Description |
| --- | --- |
| [Wiki Home](docs/wiki/Home.md) | Documentation index |
| [Requirements](docs/wiki/Requirements.md) | Runtime, database and environment requirements |
| [N0C / PlanetHoster](docs/wiki/Installation-N0C.md) | Passenger and N0C deployment |
| [cPanel](docs/wiki/Installation-cPanel.md) | Generic cPanel deployment |
| [Home Server](docs/wiki/Installation-Home-Server.md) | Self-hosting and reverse proxy setup |
| [Admin Dashboard](docs/wiki/Admin-Dashboard.md) | CMS modules and workflows |
| [SEO and Meta Tags](docs/wiki/SEO-and-Meta-Tags.md) | Search and social metadata |
| [Troubleshooting](docs/wiki/Troubleshooting.md) | Known deployment and runtime issues |
| [Updates and CI](docs/wiki/Updates-and-CI.md) | Versioning, updater and workflows |
| [License and Credits](docs/wiki/License-and-Credits.md) | Attribution and redistribution |

---

## Contributing

Create a focused branch and open a pull request against `main`.

```bash
git switch -c feat/my-change
npm run typecheck
npm run lint
npm run build
git push -u origin feat/my-change
```

Keep unrelated features in separate pull requests and ensure CI succeeds before merge.

---

## License and credits

NecrotixLab is distributed under the MIT License. The original MIT notice for **PersonalBlog** by **Syahril Arfian Almazril (Arfazrll)** is preserved in [LICENSE](LICENSE).

- Original foundation: PersonalBlog / Arfazrll
- NecrotixLab direction and project-specific development: Dr. Necrotix
- Additional work: repository contributors
- Third-party libraries and services remain subject to their own licenses, terms and trademarks

See [License and Credits](docs/wiki/License-and-Credits.md) for complete attribution.
