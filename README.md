# Clubhouse

**Everything a sport club needs, in one place.**

Multi-tenant platform for sport clubs of any code (AFL, soccer, cricket, basketball, netball...) and any level (junior, senior, masters). One Clubhouse instance hosts many clubs; each club gets its own subdomain or path, its own data, its own admin.

## Who it's for

| Role | What they do here |
| --- | --- |
| Player | Check fixtures, RSVP to training, view roster, see stats, get comms |
| Coach | Write team comms, mark training attendance, set match-day teams, track player notes |
| Committee / admin | Manage members, finances, sponsors, volunteers, compliance |
| Sponsor | View exposure, update logo, see contract dates |
| Supporter / public | Fixtures, results, news, sponsor visibility, donate |
| Volunteer | See assigned roster, swap shifts |
| Junior parent | Manage child's profile, registration, transport coordination |

## v1 scope

The thinnest slice that's worth shipping:

- **Roster & player profiles** — players, contacts, positions, photos
- **Fixtures & results** — schedule, results, ladder
- **Comms / announcements** — coach→team, club→supporters
- **Sponsors page** — tiered logos with links
- **Role-based logins** — different views for player / coach / sponsor / supporter / parent

## v2+ candidates

Not v1, but on the roadmap:

- Membership & online payments (registrations, fees)
- Volunteer rostering (canteen, gate, scoring, umpiring)
- Training attendance / RSVPs
- Compliance tracking (Working with Children Check expiry)
- Document library (constitution, policies, codes of conduct)
- Match-day stats / live scoring
- Awards & milestones (best & fairest, life members, hall of fame)

## Stack

- Frontend: React + Vite, deployed to Cloudflare Pages
- Backend: Cloudflare Workers (where needed) + D1 (relational data)
- Auth: integrate with `asgard-auth` worker (existing in the Asgard portfolio)
- Domain: TBD — `clubhouse.pages.dev` to start

## Status

Idea / scaffolding. No code yet. See `docs/HANDOVER.md` for full state of play and how to continue.

## Part of the Asgard portfolio

Sister projects: SportPortal (schools), SportCarnival Hub (carnival timing), Division Hub (Hobsons Bay & Wyndham SSV), Family Footy Tipping. Clubhouse fills the gap for clubs themselves rather than schools or comp-level admin.