# Job boards

> Maintained by `job-scout`: it may add new boards and must note when one is not reachable (blocked, login required) so a different strategy is used next time.

| Board | URL | Focus | Access strategy | Notes |
|---|---|---|---|---|
| LinkedIn Jobs | https://www.linkedin.com/jobs | General, global remote | WebSearch `site:linkedin.com/jobs/view` (blocks direct fetch) | Main source in LATAM |
| Get on Board | https://www.getonbrd.com | Tech LATAM, published salaries | WebFetch | Filter by remote and salary. `/jobs/programming/remote` returns 404 (2026-10-12); use `/empleos/programacion` and `/jobs/tag/<tech>` (e.g. `/jobs/tag/nestjs`, `/jobs/tag/react`), which list salary, work mode and date. Some offer URLs found via WebSearch return 404 (expired). Many offers are hybrid in Santiago (Chile): check the work mode |
| Torre | https://torre.ai | LATAM remote | WebSearch / WebFetch | |
| We Work Remotely | https://weworkremotely.com | Global remote | WebFetch (RSS available) | Check country restriction |
| Remote OK | https://remoteok.com | Global remote | WebFetch (`/api` JSON) | Usually publishes salary |
| Remotive | https://remotive.com | Global remote | WebFetch (`/api/remote-jobs`) | API works with `?category=software-dev&limit=N`; exposes `candidate_required_location` (2026-10-12). Few offers open to LATAM |
| Himalayas | https://himalayas.app | Global remote | WebFetch | Lists allowed countries |
| Working Nomads | https://www.workingnomads.com | Global remote | WebFetch | |
| Wellfound | https://wellfound.com | Startups | WebSearch | Login required for details |
| Jobgether | https://jobgether.com | Remote, filters by country | WebSearch / WebFetch | |
| Arc.dev | https://arc.dev/remote-jobs | Remote for LATAM devs | WebFetch | |
| Revelo | https://www.revelo.com | LATAM → US companies | WebSearch | Talent network |
| Turing | https://www.turing.com/jobs | Global remote | WebSearch | Talent network |
| Hacker News — Who is hiring | https://news.ycombinator.com | Startups | WebSearch for the current month's thread | Search "REMOTE" + "LATAM"/"worldwide" |
| Computrabajo | https://co.computrabajo.com | Colombia | WebFetch | Mostly low salaries |
| Magneto | https://www.magneto365.com | Colombia | WebFetch | |
| elempleo | https://www.elempleo.com | Colombia | WebFetch | |
