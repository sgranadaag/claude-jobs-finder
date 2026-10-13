# Portales de empleo

> Lo mantiene `job-scout`: puede agregar portales nuevos y debe anotar cuando uno no es accesible (bloqueo, login requerido) para usar otra estrategia la siguiente vez.

| Portal | URL | Enfoque | Estrategia de acceso | Notas |
|---|---|---|---|---|
| LinkedIn Jobs | https://www.linkedin.com/jobs | General, remoto global | WebSearch `site:linkedin.com/jobs/view` (bloquea fetch directo) | Fuente principal en LATAM |
| Get on Board | https://www.getonbrd.com | Tech LATAM, salarios publicados | WebFetch | Filtra por remoto y salario. `/jobs/programming/remote` da 404 (2026-10-12); usar `/empleos/programacion` y `/jobs/tag/<tech>` (ej. `/jobs/tag/nestjs`, `/jobs/tag/react`), que listan salario, modalidad y fecha. Algunas URLs de ofertas vistas en WebSearch dan 404 (expiradas). Muchas ofertas son híbridas en Santiago: revisar modalidad |
| Torre | https://torre.ai | LATAM remoto | WebSearch / WebFetch | |
| We Work Remotely | https://weworkremotely.com | Remoto global | WebFetch (RSS disponible) | Revisar restricción de país |
| Remote OK | https://remoteok.com | Remoto global | WebFetch (`/api` JSON) | Suele publicar salario |
| Remotive | https://remotive.com | Remoto global | WebFetch (`/api/remote-jobs`) | API funciona con `?category=software-dev&limit=N`; expone `candidate_required_location` (2026-10-12). Pocas ofertas abiertas a LATAM |
| Himalayas | https://himalayas.app | Remoto global | WebFetch | Indica países permitidos |
| Working Nomads | https://www.workingnomads.com | Remoto global | WebFetch | |
| Wellfound | https://wellfound.com | Startups | WebSearch | Login para detalles |
| Jobgether | https://jobgether.com | Remoto, filtra por país | WebSearch / WebFetch | |
| Arc.dev | https://arc.dev/remote-jobs | Remoto para devs LATAM | WebFetch | |
| Revelo | https://www.revelo.com | LATAM → empresas EE. UU. | WebSearch | Talent network |
| Turing | https://www.turing.com/jobs | Remoto global | WebSearch | Talent network |
| Hacker News — Who is hiring | https://news.ycombinator.com | Startups | WebSearch hilo del mes actual | Buscar "REMOTE" + "LATAM"/"worldwide" |
| Computrabajo | https://co.computrabajo.com | Colombia | WebFetch | Mayormente salarios bajos |
| Magneto | https://www.magneto365.com | Colombia | WebFetch | |
| elempleo | https://www.elempleo.com | Colombia | WebFetch | |
