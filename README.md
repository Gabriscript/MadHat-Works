# MadHat Proposals

Internal proposal management system for **MadHat Works** — a premium digital agency for local businesses.

Proposals are created from templates, shared via a unique private link, accepted by the client with a typed signature, and archived as a branded PDF.

## Stack

- **Next.js 14** (App Router, React 18, TypeScript)
- **TailwindCSS** — brand tokens hard-coded in `tailwind.config.js`
- **Prisma ORM** + **SQLite** (dev)
- **Server Actions** for all mutations
- **@react-pdf/renderer** for server-side PDF generation
- **gray-matter** + **marked** for Terms / Privacy markdown
- **sonner** for toast notifications

## Routes

### Public
| Route | Purpose |
|---|---|
| `/` | Landing page (linked to admin) |
| `/terms` | Terms & Conditions (EN · IT toggle) |
| `/privacy` | Privacy Policy (EN · IT toggle) |

### Client-facing
| Route | Purpose |
|---|---|
| `/proposal/[token]` | Branded proposal view + legal acceptance flow |

### Admin
| Route | Purpose |
|---|---|
| `/admin` | List of proposals with status, pricing, actions |
| `/admin/new` | Create proposal (start blank or from any template) |
| `/admin/edit/[id]` | Edit / change status / copy link / download PDF |
| `/admin/templates` | Manage reusable templates |
| `/admin/templates/new` | Create a new template |
| `/admin/templates/edit/[id]` | Edit a template |
| `/api/pdf/[id]` | Download generated PDF by acceptance id |

## Setup

```bash
yarn install
yarn db:generate
yarn db:push        # creates prisma/dev.db
node prisma/seed.mjs   # seeds 4 templates + Terms versions
yarn dev               # http://localhost:3000
```

## Default templates (auto-seeded)

1. **Starter** — €349 setup + €29/month
2. **Growth** — €499 setup + €199/month (suggested 6 months)
3. **Full Service** — €799 setup + €599/month (suggested 12 months)
4. **Custom** — blank starting point

All fields on a template are editable from `/admin/templates/edit/[id]`. When a template is applied during proposal creation, **every** field can still be overridden — nothing is locked.

## How acceptance works

1. Admin generates a proposal → status `PENDING` → copies the private `/proposal/[token]` link.
2. Client opens the link, reviews the proposal, ticks the two consent boxes and types their full name as digital signature.
3. The server action `acceptProposal`:
   - validates the form,
   - records IP, user agent, browser language,
   - computes an evidence hash over the active Terms + Privacy markdown,
   - stores a `ProposalAcceptance` row + flips the proposal to `ACCEPTED` (transactional),
   - renders a branded PDF via `@react-pdf/renderer` and writes it to `public/pdfs/<acceptanceId>.pdf`.
4. The admin (and the client, on the success screen) can download the PDF from `/api/pdf/<acceptanceId>`.

## Security notes

- Proposal tokens are 24 random bytes (~192 bits) base64url-encoded — not guessable.
- Server actions validate every input with **zod**.
- The acceptance endpoint is rate-limited per-IP (in-memory, 6/min).
- Acceptance is transactional: the row + status flip happen together.
- Terms / Privacy markdown files are content-hashed at acceptance time — the hash is persisted as evidence.

## Editing Terms / Privacy

Markdown lives in `/content/`:

- `terms-en.md`, `terms-it.md`
- `privacy-en.md`, `privacy-it.md`

The frontmatter `version` controls what is shown / recorded. Bumping the version is enough — the content hash is recomputed on every load and on every acceptance.

## Production notes

- Move `DATABASE_URL` to Postgres for production (`prisma migrate deploy`).
- Set a real `NEXT_PUBLIC_BASE_URL`.
- Front the `/admin` routes with auth (NextAuth, Clerk, basic-auth middleware — your call). The current build is open by design for the MVP.
