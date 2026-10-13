# jobs-finder

Workflow personal de [Claude Code](https://claude.com/claude-code) para buscar ofertas de software engineering, adaptar el CV a cada una **sin inventar nada** y dejar las postulaciones llenas en el portal.

```
/find-jobs [cantidad] [enfoque]       → busca, puntúa y registra ofertas nuevas
/tailor-cv [IDs | score mínimo]       → genera el CV y los datos de aplicación por oferta
/apply [IDs] [sin enviar]             → llena los formularios en Chrome y registra el resultado
```

> Los datos personales (`docs/`), el histórico (`data/`) y las postulaciones (`applications/`) **no se suben al repo** (ver `.gitignore`); solo se versionan sus carpetas. Para usarlo hay que crear los archivos con los formatos de [Formato de `docs/`](#formato-de-docs) y [Formato de `data/`](#formato-de-data).

## Flujo de trabajo

```
 docs/ (perfil, CV, preferencias)
   │
   ▼
 1. /find-jobs ── job-scout ──► data/offers.md          (histórico, sin repetidos)
                               applications/<id>/offer.md (oferta + score + requisitos)
   │
   ▼
 2. /tailor-cv ── cv-tailor ──► applications/<id>/cv.md ─► .claude/scripts/build-cv.mjs ─► PDF
                  (uno por      applications/<id>/application.md (salario, por qué, carta)
                   oferta)
   │
   ▼
 3. /apply ── sesión principal + Chrome ──► formulario del portal
                                          applications/<id>/application-log.md
                                          data/applications.md
```

| Paso | Quién lo hace | Por qué así |
|---|---|---|
| 1. Buscar | Subagente `job-scout` | Navega muchas páginas; aislarlo evita llenar el contexto de la sesión principal |
| 2. Preparar | Subagente `cv-tailor`, uno por oferta y en paralelo | Cada oferta es independiente y se beneficia de un contexto limpio |
| 3. Aplicar | La sesión principal con Claude in Chrome | Usa las sesiones del navegador del usuario y necesita su intervención (login, captcha, preguntas sin respuesta en los docs, confirmación antes de enviar) |

### 1. `job-scout` — búsqueda y score

1. Lee el perfil, las preferencias y `data/offers.md`. Nada que ya esté en el histórico (en cualquier estado) se vuelve a listar.
2. Recorre los portales de `data/sources.md` combinando los roles objetivo con las tecnologías fuertes del perfil.
3. **Cómo extrae los datos:**
   - Usa la API o el RSS del portal cuando existe (Remote OK, Remotive, We Work Remotely).
   - Si no, abre el listado con WebFetch (Get on Board, Himalayas…).
   - Si el portal bloquea el acceso directo, como LinkedIn o Wellfound, busca con `site:` en WebSearch.
   - De cada candidata abre la página de la oferta y copia la descripción **íntegra**. Nunca puntúa con solo el título.
   - Cuando un portal falla o cambia de URL, lo anota en `data/sources.md` para la próxima búsqueda.
4. Aplica los filtros duros de `docs/preferences.md`: remoto desde tu país, salario mínimo, antigüedad máxima y que sea del sector. Las ofertas que no pasan quedan `descartada`, con el motivo.
5. Calcula el score con la rúbrica de `docs/preferences.md`:

   | Criterio | Peso |
   |---|---|
   | Requisitos | 45 |
   | Salario | 30 |
   | Recencia | 15 |
   | Región de la empresa | 10 |

6. Por cada oferta crea `applications/<id>/offer.md`, con la **única tabla de requisitos** de la oferta, y agrega una fila a `data/offers.md`.

### 2. `cv-tailor` — CV y datos de aplicación

1. **Afina la tabla de requisitos.** Le asigna a cada requisito un estado:

   | Estado | Cuenta como |
   |---|---|
   | `cubierto` | 1 |
   | `transferible: <equivalente>` | 1 |
   | `solo proyecto personal` / `solo formación` | 0.5 |
   | `sin base` | 0 |

   Si piden Angular y el perfil tiene React, el requisito es transferible y cuenta como cubierto.
2. **Escribe `cv.md`.** Parte del CV original en el idioma de la oferta y solo reordena, recorta y reformula. El formato visual lo pone el script, que replica el CV original.
3. **Genera el PDF** con `node .claude/scripts/build-cv.mjs <id>`.
4. **Escribe `application.md`**, que es corto:
   - Salario calculado: lo que ofrece la empresa o el objetivo, ajustado por la cobertura de requisitos.
   - "¿Por qué este rol?" y "¿por qué esta empresa?".
   - La carta.
   - Los pendientes.
5. **Se autoverifica frase por frase** contra `docs/profile.md`.

### 3. `/apply` — llenar y enviar

1. Abre la oferta en Chrome con las sesiones del usuario y llega al formulario.
2. Lee **todas** las preguntas y luego las responde:
   - Parte de `docs/answer-bank.md` y reparte el material para no repetir nada en la misma postulación.
   - Usa las reglas de `docs/writing-style.md`: tono natural, nunca "0 años" y sin fechas por tecnología.
3. Sube el PDF de la oferta sin reemplazar el CV del perfil del portal.
4. **No envía sin confirmación del usuario.** Con `sin enviar`, la postulación queda como borrador en el portal.
5. Registra en `application-log.md` las preguntas literales con su respuesta. Agrega al banco las respuestas nuevas y a `preferences.md` los datos que aporte el usuario.

### Estados de una oferta (`data/offers.md`)

| Estado | Significado |
|---|---|
| `descartada` | No pasa los filtros duros; solo sirve para no repetirla |
| `nueva` | Listada por el scout |
| `preparada` | Tiene CV y `application.md` |
| `borrador` | Formulario lleno y guardado en el portal, sin enviar |
| `aplicada` / `fallida` / `omitida` | Resultado de `/apply` |

## Reglas

1. **No se inventa nada.** Ni skills, ni años, ni cargos, ni métricas, ni respuestas. Se permite reordenar, seleccionar, omitir, reformular y traducir lo que ya está en `docs/`.
2. Las tecnologías transferibles cuentan para el score y el salario, pero **nunca se afirman**: "No he trabajado con Angular, pero sí con React…".
3. Nada se envía sin confirmación explícita.
4. Solo la sesión principal edita `data/offers.md`; los subagentes en paralelo no lo tocan.

## Estructura

```
.claude/                                todo lo del dominio de Claude Code
  agents/job-scout.md, cv-tailor.md     subagentes
  skills/find-jobs, tailor-cv, apply    comandos /find-jobs, /tailor-cv, /apply
  scripts/build-cv.mjs                  cv.md → HTML → PDF (Edge headless)
  templates/
    cv.html                             estilo del CV (réplica del CV original)
    data/                               plantillas de sources.md, offers.md y applications.md
  settings.json                         permisos pre-autorizados
CLAUDE.md                               instrucciones del proyecto para Claude
docs/                 (no versionado)   datos personales — ver formato abajo
data/                 (no versionado)   ver formato abajo
  sources.md                            portales y cómo acceder a cada uno
  offers.md                             histórico de ofertas
  applications.md                       registro global de postulaciones
applications/         (no versionado)   una carpeta por oferta:
  <fuente>-<YYYYMMDD>-<vacante>/
    offer.md                            oferta íntegra, score y tabla de requisitos
    cv.md                               contenido del CV adaptado
    <Nombre>_CV_<Empresa>.pdf           CV final
    application.md                      salario, "¿por qué?", carta, pendientes
    application-log.md                  campos, preguntas literales y resultado
```

## Requisitos

- Claude Code, con Claude in Chrome conectado para `/apply` (`claude --chrome`).
- Node.js 18 o superior.
- Microsoft Edge, que se usa en modo headless para generar el PDF.
  - Ruta esperada: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
  - Si está en otra ruta, se ajusta en `.claude/scripts/build-cv.mjs`.

## Formato de `docs/`

Crea estos archivos. Todos son Markdown, salvo los PDF del CV. Los agentes **solo** pueden usar los hechos que aparezcan aquí.

### `docs/CV ATS Format EN.pdf` y `docs/CV ATS Format ES.pdf`

- Son tu CV original en inglés y en español.
- Definen la redacción base y el formato visual que replica `.claude/templates/cv.html`.

### `docs/profile.md` — fuente de verdad

Es una transcripción fiel del CV, más los proyectos y certificaciones. Si algo cambia en tu carrera, se actualiza aquí primero.

```markdown
# Perfil — fuente de verdad

## Contacto
- Name: <nombre completo>
- Email: <email>
- Phone: <teléfono con indicativo>
- Location: <ciudad, país>
- Work mode: Remote
- LinkedIn: <url>
- GitHub: <url>

## Career Summary (CV)
<párrafo del CV original>

## Descripción corta (ES)
<párrafos de presentación en español>

## Summary of Qualifications — Proficient in
<lista separada por comas, tal cual en el CV>

Otras tecnologías mencionadas en la experiencia: <lista>

## Languages
- <idioma> — <nivel>
- English — <nivel>

## Career History

### <Empresa> — <Ciudad>, <País>
**<Cargo> — <Equipo, si aplica>** · <Mes. AAAA> – <Mes. AAAA | Present>

<párrafos del CV, sin cambiar cifras>

Skills: <skills del cargo>

## Leadership
### <Empresa> — <Ciudad>, <País> · <fechas>
<párrafos>

Skills: <...>

## Open-source projects
- **<nombre>** — <url> — <descripción>. Tech: <...>

## Certifications
- **<nombre>** — <emisor> · Issued <Mes. AAAA> — <url de verificación>
  - <aprendizajes confirmados, marcados como formación>

## Education
- **<Institución>** — <Ciudad, País> · <fechas> — <título>
```

> Si hay diferencias entre el CV en inglés y el CV en español, por ejemplo en una fecha, se deja una nota aclarando cuál es la correcta.

### `docs/preferences.md` — búsqueda, salario y respuestas personales

```markdown
# Preferencias de búsqueda

## Objetivo
- Roles: <lista>
- Seniority: <Senior / Lead …>
- Modalidad: 100% remoto, contratable desde <país>
- Región de la empresa: <prioridad, ej. LATAM → resto de América → otras>
- Idioma de la postulación: el de la oferta

## Salario
- Objetivo: <USD/mes>        # se declara si la oferta no publica salario
- Mínimo aceptable: <USD/mes>
- Expectativa a declarar: rango → mínimo + 25%; valor único → ese valor; sin salario → objetivo
- Ajuste por cobertura de requisitos: ≥ 80% sin ajuste; 60–79% × 0.8; < 60% × 0.6 (nunca bajo el mínimo ni bajo el mínimo del rango)

### Experiencia transferible
| Piden | Equivalente en el perfil |
|---|---|
| <Angular, Vue> | <React> |

## Filtros duros
- <presencial/híbrido, restricción de país, salario bajo el mínimo, antigüedad > 30 días…>

## Rúbrica de score (0–100)
<pesos y tablas de puntos por requisitos, salario, recencia y región>

## Datos para formularios
- Disponibilidad / preaviso: <…>
- Tipo de contratación aceptada: <…>

## Respuestas reutilizables
- <pregunta normalizada>: <respuesta> (AAAA-MM-DD)
```

### `docs/writing-style.md` — tu voz

- Contiene rasgos de cómo escribes, frases literales tuyas de referencia y las reglas para responder formularios: no repetir, no poner "0 años", sin fechas por tecnología y tono natural.
- Lo ideal es sacarlo de textos que hayas escrito tú, como los README de tus proyectos.

```markdown
# Estilo de escritura del usuario
## Rasgos
- <…>
## Respuestas a formularios
- <reglas>
## Evitar
- <clichés, exageraciones…>
## Frases de referencia (literales del usuario)
- "<…>"
```

### `docs/answer-bank.md` — banco de respuestas

Tiene una respuesta base por tema o tecnología, escrita con tu voz y solo con hechos del perfil. `/apply` lo amplía con las respuestas nuevas.

```markdown
# Banco de respuestas
## Patrones
### Tecnología equivalente
No he trabajado con <X>, pero sí con <Y>, …
### Sin base parecida
No he tenido la oportunidad de trabajar con esta herramienta.

## Trayectoria
### <tema>
<respuesta>

## Tecnologías
### <tecnología>
<respuesta>

## Proceso
### Disponibilidad
<respuesta>
```

## Formato de `data/`

Las plantillas están versionadas en [`.claude/templates/data/`](.claude/templates/data/). Para empezar, cópialas:

```bash
cp .claude/templates/data/*.md data/
```

Si te olvidas, no pasa nada: `job-scout` crea `sources.md` y `offers.md`, y `/apply` crea `applications.md` a partir de las plantillas cuando no existen. Después los mantienen los propios agentes.

| Archivo | Qué es | Plantilla |
|---|---|---|
| `data/sources.md` | Portales de empleo y cómo acceder a cada uno (API, RSS, WebFetch o búsqueda `site:`). El scout lo actualiza cuando un portal falla o encuentra uno nuevo | Trae unos 17 portales ya probados, enfocados en remoto y LATAM |
| `data/offers.md` | Histórico de todas las ofertas vistas, incluidas las descartadas, para no repetirlas. Define el formato de ID (`<fuente>-<YYYYMMDD>-<vacante>`), que es también el nombre de la carpeta en `applications/` | Encabezado y tabla vacía |
| `data/applications.md` | Una fila por intento de postulación; el detalle está en `applications/<id>/application-log.md` | Encabezado y tabla vacía |
