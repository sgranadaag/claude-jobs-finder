# jobs-finder

Sistema personal de búsqueda y aplicación a ofertas de empleo (software engineering), ejecutado como un workflow de Claude Code.

## Flujo

| Paso | Entrada | Quién lo ejecuta | Por qué |
|------|---------|------------------|---------|
| 1. Buscar | `/find-jobs` | subagente `job-scout` | Mucha navegación web; se aísla para no llenar el contexto principal |
| 2. Preparar | `/tailor-cv` | subagente `cv-tailor` (uno por oferta, en paralelo) | Cada oferta es independiente y necesita contexto limpio |
| 3. Aplicar | `/apply` | sesión principal + navegador | Requiere tus sesiones, intervención humana (login, captcha, preguntas) y confirmación antes de enviar |

## Archivos

- `docs/profile.md` — **fuente de verdad** del perfil (transcripción fiel del CV). Todo lo que se diga sobre el candidato debe salir de aquí (incluye "Contacto": nombre, email, teléfono, ubicación, LinkedIn, GitHub).
- `docs/writing-style.md` — voz del usuario (extraída de sus README) para los textos redactados.
- `docs/preferences.md` — criterios de búsqueda, salario (con ajuste por cobertura y experiencia transferible), filtros, rúbrica de score y respuestas reutilizables del usuario.
- `docs/answer-bank.md` — **banco de respuestas** por tema/tecnología, con la voz del usuario. `/apply` lo adapta a cada formulario y lo amplía con respuestas nuevas.
- `docs/CV ATS Format EN.pdf` / `ES.pdf` — CV original.
- `data/sources.md` — portales de empleo que usa el scout (lo mantiene el propio scout).
- `data/offers.md` — **histórico** de todas las ofertas vistas (incluye descartadas), usado para no repetir.
- `data/applications.md` — registro global de aplicaciones.
- `applications/<id>/` — una carpeta por oferta:
  - `offer.md` — copia de la oferta, score y la **única tabla de requisitos** (scout la crea, cv-tailor la afina; de ella salen score y salario)
  - `cv.md` — contenido del CV adaptado, en formato fijo (cv-tailor)
  - `<Nombre>_CV_<Empresa>.pdf` — CV final, generado por el script
  - `application.md` — corto: CV, salario con su cálculo, "¿por qué?", carta y pendientes (cv-tailor)
  - `application-log.md` — qué se llenó/envió, preguntas literales con sus respuestas y resultado (apply)
- `.claude/templates/data/` — plantillas versionadas de `sources.md`, `offers.md` y `applications.md`. `data/` no se versiona: si falta un archivo, se crea copiando su plantilla.
- `.claude/templates/cv.html` — estilo del CV (réplica del original). Si cambia, se regeneran los PDF con el script.
- `.claude/scripts/build-cv.mjs <ID> [--keep-html]` — convierte `applications/<ID>/cv.md` en el PDF con la plantilla y Edge headless.
- `.claude/settings.json` — permisos pre-autorizados (búsqueda web, escritura en `applications/`, `data/` y el banco de respuestas, script del CV, Claude in Chrome) para reducir confirmaciones.

## Estados de una oferta (`data/offers.md`)

`descartada` → no cumple filtros duros (no se procesa, solo evita repetir)
`nueva` → listada por el scout
`preparada` → tiene CV y datos de aplicación
`borrador` → formulario lleno y guardado en el portal, sin enviar (falta pulsar "enviar")
`aplicada` / `fallida` / `omitida` → resultado de `/apply`

## Reglas no negociables

1. **No inventar nada.** Ni skills, ni años, ni cargos, ni métricas, ni certificaciones, ni respuestas. Solo se permite reordenar, seleccionar, omitir, reformular y traducir información que exista en `docs/`. Si algo no está, se marca como `PENDIENTE USUARIO`.
2. Solo la sesión principal edita `data/offers.md` cuando hay subagentes en paralelo (los `cv-tailor` no lo tocan, para evitar conflictos de escritura).
3. Nunca se envía una aplicación sin confirmación explícita del usuario.
4. Documentos de identidad (cédula, pasaporte) no se guardan en ningún archivo: si un formulario los pide, se le piden al usuario en el momento. `docs/`, `data/` y `applications/` no se versionan.
