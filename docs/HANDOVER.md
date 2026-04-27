# Clubhouse — Handover

**Last updated:** 2026-04-27 (initial scaffold)
**Status:** Idea — scaffolded, no code written yet
**Repo:** github.com/PaddyGallivan/clubhouse
**D1 record:** `asgard-brain` products table (added 2026-04-27)
**Live URL:** none yet

This document is the source of truth for picking the project up in a fresh session, on a different machine, or in a different Claude account. Read it first; assume nothing else carries over.

---

## Vision (Paddy's words, paraphrased)

> An app for sport clubs. For players, coaches, sponsors, supporters, volunteers, parents — everyone. Everything a sport club could possibly need goes through here.

Clubhouse is to sport CLUBS what SportPortal is to schools and SportCarnival Hub is to carnival days. It's a horizontal platform — one product hosting many clubs as tenants — not a one-off build for a single club.

## Decisions locked in (2026-04-27)

| Decision | Choice | Why |
| --- | --- | --- |
| Name | Clubhouse | Short, evocative, club-flavoured |
| Tenancy | Multi-tenant from day 1 | Avoid rip-out later when scaling beyond first club |
| v1 scope | Roster + Fixtures + Comms + Sponsors + role logins | Smallest thing worth shipping; covers ~80% of why a supporter visits a club site |
| Stack | React + Vite + Cloudflare Pages + D1 | Matches existing Asgard pattern (sportportal, division-hub, etc.) — one deploy pipeline, one DB tech |
| GitHub | PaddyGallivan/clubhouse (public) | Token only had user-namespace create perms; transfer to LuckDragonAsgard org later |
| Auth | Integrate with existing `asgard-auth` worker | Don't reinvent — it already exists in the portfolio |

## v1 feature list (must ship)

- **Roster & player profiles** — players table per club, contact details, positions, photos, jumper numbers
- **Fixtures & results** — match schedule, results, ladder, links to opposing clubs if also on Clubhouse
- **Comms / announcements** — coach to team, club to supporters; SMS/email opt-ins; threaded
- **Sponsors page** — tiered (gold/silver/bronze), logos, links, contract end dates (admin-only)
- **Role-based logins** — at minimum: Player, Coach, Committee, Sponsor, Supporter (public), Parent. Different home screens, different permissions.

## v2+ backlog (NOT v1)

In rough priority order — these are the ones a real club asked for or needs for compliance:

1. Membership & online payments (Stripe — reuses `superleague-tipping` Stripe integration?)
2. Volunteer rostering (canteen, gate, scoring, umpiring; with shift-swap)
3. Training attendance / RSVPs
4. Compliance tracking — Working with Children Check expiry per coach/volunteer/parent helper
5. Document library — constitution, child-safety policy, codes of conduct (PDFs in R2)
6. Match-day stats / live scoring (could share infra with SportPortal/Carnival Timing live scoring)
7. Awards & milestones — best & fairest, club champion, life members, hall of fame
8. Junior parent flows — parent manages child's profile, payments, transport coordination

## Multi-tenancy model — open question

Two options to decide before any code:

- **Subdomain per club** — `wcyms.clubhouse.app`, `northwilly.clubhouse.app`. Cleaner branding, more DNS work.
- **Path per club** — `clubhouse.app/wcyms`, `clubhouse.app/northwilly`. Simpler ops, less club-flexible branding.

Tenant resolution lives in middleware. D1 schema: every tenant table has a `club_id` foreign key from day 1. Don't skip this.

## Auth & roles — open question

- Email magic link via Resend (already used in Asgard)? Or Google OAuth?
- One identity = many memberships? (a parent who's also a coach AND on the committee AND a sponsor — common case in junior clubs.) Probably yes — model `users` and `memberships(user_id, club_id, role)` separately.
- Public/supporter view: no login required. Sponsor logos, fixtures, results, news visible to anyone.

## Suggested file/folder layout (for the next session to decide)

```
/apps/web         — React + Vite frontend
/apps/api         — CF Workers backend (if any beyond Pages Functions)
/packages/db      — D1 schema migrations + types
/packages/ui      — shared design system
/docs             — HANDOVER.md, ADRs, schema diagrams
/.github/workflows — CF Pages deploy (auto-trigger via gh-push pattern)
```

## How to deploy (when there's something to deploy)

Follow the KBT/Bomber Boat pattern:

1. Push to `main` on this repo
2. CF Pages auto-build picks it up via the `gh-push` worker (Luck Dragon Main account `a6f47c17`)
3. Lands at `clubhouse.pages.dev`
4. **No local builds.** No `wrangler ./dist` from a local shell. Cloud-side only.

If a `gh-push` workflow doesn't exist on this repo yet (it won't on day 1), copy the one from `kbt-trial` or `sportportal`.

## How to find this in the next session

- **Asgard dashboard** — `asgard.pgallivan.workers.dev`, click Clubhouse in the Projects tab → opens scoped chat with full context.
- **D1** — `SELECT * FROM products WHERE LOWER(project_name) LIKE '%clubhouse%'` against `asgard-brain.pgallivan.workers.dev/d1/query` with `X-Pin: 2967`.
- **GitHub** — `github.com/PaddyGallivan/clubhouse/blob/main/docs/HANDOVER.md` (this file).
- **Memory** — `clubhouse_handover.md` entry in the local Claude memory index.

## Recommended first action in next session

Don't write any code yet. Write a one-pager **product brief** in `docs/PRODUCT-BRIEF.md` covering:

- Three real clubs you'd cold-pitch this to (probably WCYMS, plus two more local ones to triangulate needs)
- The exact pages a player vs coach vs supporter sees on opening the app
- D1 schema for the v1 four features (clubs, users, memberships, players, fixtures, results, comms, sponsors)
- Decisions on the two open questions above (subdomain vs path; auth method)

Then scaffold a Vite + React app, push, watch CF Pages deploy, iterate.

## Out of scope — explicit non-goals

- One-club specific code. If you find yourself hardcoding "WCYMS" anywhere outside seed data, stop.
- Replacing SportPortal. SportPortal is for schools. Clubhouse is for clubs. Different audience, different needs, no merger.
- Replacing existing Carnival Timing live-scoring infra. If/when match-day stats land in v2+, share the existing infra rather than rebuild.

## Linked workers / infra (existing Asgard portfolio)

- `asgard-auth` — auth worker, integrate rather than reinvent
- `asgard-brain` — D1 access (PIN 2967)
- `asgard-comms` / Resend — email/SMS comms
- `gh-push` — auto-deploy worker for CF Pages

## Open questions for next session (in priority order)

1. Subdomain vs path tenancy?
2. Auth method (magic link / OAuth)?
3. Domain — register `clubhouse.app` or `clubhouse.com.au`, or stay on `.pages.dev` until v1 ships?
4. Pilot club — WCYMS as proving ground, or a club that already pays for something (longer commitment)?
5. Pricing model — freemium / per-member / sponsor-of-platform?