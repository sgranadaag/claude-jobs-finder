# jobs-finder

A personal [Claude Code](https://claude.com/claude-code) workflow to find software engineering job offers, tailor the CV to each one **without inventing anything**, and leave the applications filled in on the job board.

```
/find-jobs [amount] [focus]           → searches, scores and records new offers
/tailor-cv [IDs | minimum score]      → builds the CV and application data per offer
/apply [IDs] [no-submit]              → fills the forms in Chrome and records the result
```

> Personal data (`docs/`), history (`data/`) and applications (`applications/`) are **not committed** (see `.gitignore`); only their folders are. To use the workflow, create the files following [`docs/` format](#docs-format) and [`data/` format](#data-format).

**Language.** The project runs in English: agents, skills, rules, formats and status values. What goes to an employer follows the offer's language — a Spanish offer gets a Spanish CV, cover letter and answers.

## Workflow

```
 docs/ (profile, CV, preferences)
   │
   ▼
 1. /find-jobs ── job-scout ──► data/offers.md              (history, no repeats)
                               applications/<id>/offer.md (offer + score + requirements)
   │
   ▼
 2. /tailor-cv ── cv-tailor ──► applications/<id>/cv.md ─► .claude/scripts/build-cv.mjs ─► PDF
                  (one per      applications/<id>/application.md (salary, why, cover letter)
                   offer)
   │
   ▼
 3. /apply ── main session + Chrome ──► job board form
                                       applications/<id>/application-log.md
                                       data/applications.md
```

| Step | Who does it | Why this way |
|---|---|---|
| 1. Search | `job-scout` subagent | Browses many pages; isolating it keeps the main session's context clean |
| 2. Prepare | `cv-tailor` subagent, one per offer, in parallel | Each offer is independent and benefits from a clean context |
| 3. Apply | The main session with Claude in Chrome | Uses the user's browser sessions and needs their input (login, captcha, questions not answered by the docs, confirmation before submitting) |

### 1. `job-scout` — search and scoring

1. Reads the profile, the preferences and `data/offers.md`. Nothing already in the history (in any status) is listed again.
2. Goes through the boards in `data/sources.md`, combining the target roles with the profile's main technologies.
3. **How it extracts the data:**
   - Uses the board's API or RSS when there is one (Remote OK, Remotive, We Work Remotely).
   - Otherwise fetches the listing with WebFetch (Get on Board, Himalayas…).
   - If the board blocks direct access, like LinkedIn or Wellfound, it searches with `site:` in WebSearch.
   - For each candidate it opens the offer page and copies the **full** description. It never scores from the title alone.
   - When a board fails or changes its URLs, it notes that in `data/sources.md` for the next search.
4. Applies the hard filters from `docs/preferences.md`: remote from your country, minimum salary, maximum age and in-sector. Offers that fail are marked `discarded`, with the reason.
5. Computes the score with the rubric in `docs/preferences.md`:

   | Criterion | Weight |
   |---|---|
   | Requirements | 45 |
   | Salary | 30 |
   | Recency | 15 |
   | Company region | 10 |

6. For each offer it creates `applications/<id>/offer.md`, with the offer's **only requirements table**, and adds a row to `data/offers.md`.

### 2. `cv-tailor` — CV and application data

1. **Refines the requirements table.** Assigns each requirement a status:

   | Status | Counts as |
   |---|---|
   | `covered` | 1 |
   | `transferable: <equivalent>` | 0.8 |
   | `personal project only` / `training only` | 0.5 |
   | `no basis` | 0 |

   Missing the exact technology doesn't zero the requirement: if the offer asks for Angular and the profile has React, it is transferable and counts only 20% less than React would. The same coverage drives both the score and the salary.
2. **Writes `cv.md`.** Starts from the original CV in the offer's language and only reorders, trims and rephrases. The visual format comes from the script, which replicates the original CV.
3. **Builds the PDF** with `node .claude/scripts/build-cv.mjs <id>`.
4. **Writes `application.md`**, which is short:
   - Computed salary: what the company offers or the target, adjusted by requirement coverage.
   - "Why this role?" and "why this company?".
   - The cover letter.
   - Pending items.
5. **Self-checks sentence by sentence** against `docs/profile.md`.

### 3. `/apply` — fill and submit

1. Opens the offer in Chrome with the user's sessions and gets to the form.
2. Reads **all** the questions, then answers them:
   - Starts from `docs/answer-bank.md` and spreads the material so nothing repeats within the same application.
   - Follows the rules in `docs/writing-style.md`: natural tone, never "0 years" and no dates per technology.
3. Uploads the offer's PDF without replacing the CV in the board's profile.
4. **Never submits without the user's confirmation.** With `no-submit`, the application stays as a draft on the board.
5. Records the literal questions with their answers in `application-log.md`. Adds new answers to the bank and any data the user provides to `preferences.md`.

### Offer status (`data/offers.md`)

| Status | Meaning |
|---|---|
| `discarded` | Fails the hard filters; kept only to avoid repeating it |
| `new` | Listed by the scout |
| `prepared` | Has a CV and `application.md` |
| `draft` | Form filled and saved on the board, not submitted |
| `applied` / `failed` / `skipped` | Result of `/apply` |

## Rules

1. **Nothing is invented.** No skills, years, roles, metrics or answers. Reordering, selecting, omitting, rephrasing and translating what is already in `docs/` is allowed.
2. Transferable technologies count for score and salary, but are **never claimed**: "I haven't worked with Angular, but I have with React…".
3. Nothing is submitted without explicit confirmation.
4. Only the main session edits `data/offers.md`; parallel subagents don't touch it.
5. ID documents are not stored in any file; if a form asks for one, the user is asked at that moment.

## Structure

```
.claude/                                everything in Claude Code's domain
  agents/job-scout.md, cv-tailor.md     subagents
  skills/find-jobs, tailor-cv, apply    /find-jobs, /tailor-cv, /apply commands
  scripts/build-cv.mjs                  cv.md → HTML → PDF (headless Edge)
  templates/
    cv.html                             CV style (replica of the original CV)
    data/                               templates for sources.md, offers.md and applications.md
  settings.json                         pre-authorized permissions
CLAUDE.md                               project instructions for Claude
docs/                 (not versioned)   personal data — see format below
data/                 (not versioned)   see format below
  sources.md                            job boards and how to access each one
  offers.md                             offer history
  applications.md                       global application log
applications/         (not versioned)   one folder per offer:
  <source>-<YYYYMMDD>-<role>/
    offer.md                            full offer, score and requirements table
    cv.md                               tailored CV content
    <Name>_CV_<Company>.pdf             final CV
    application.md                      salary, "why?", cover letter, pending items
    application-log.md                  fields, literal questions and result
```

## Requirements

- Claude Code, with Claude in Chrome connected for `/apply` (`claude --chrome`).
- Node.js 18 or later.
- Microsoft Edge, used in headless mode to build the PDF.
  - Expected path: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
  - If it lives elsewhere, adjust it in `.claude/scripts/build-cv.mjs`.

## Getting started — initial data

Claude builds its whole knowledge base from what you put in **`docs/`**. Nothing outside that folder is used to describe you, and nothing in it is committed.

### What you provide (in `docs/`)

| File | Required | Content |
|---|---|---|
| `docs/CV ATS Format EN.pdf` | Yes | Your current CV in English. It is the source of every fact (roles, dates, achievements, skills) and of the visual format of the generated CVs |
| `docs/CV ATS Format ES.pdf` | If you apply to Spanish offers | The same CV in Spanish. Spanish offers start from its wording instead of a translation |
| `docs/info.md` (or any notes file) | Yes | Your data, in free text: full name, email, phone, city and country, LinkedIn and GitHub URLs, a short professional description, and your search preferences (target roles, target and minimum salary, work mode, countries you can be hired from, availability / notice period, accepted contract types) |
| Links to texts you wrote | Optional | READMEs, posts or articles of yours. Claude extracts your writing style from them so cover letters and answers sound like you |
| Certifications and side projects | Optional | Name, issuer, date and verification URL; project name, URL and a one-line description |

> **Don't put ID documents** (national ID, passport) or passwords in any file. If a form asks for an ID number, `/apply` asks you at that moment and doesn't store it.

### What Claude builds from it

Ask Claude something like *"build my base from docs/"*. It then:

1. Transcribes the CV faithfully into `docs/profile.md` (the source of truth) and adds your contact data, certifications and projects. If the English and Spanish CVs disagree (e.g. a date), it asks you which one is right and leaves a note.
2. Writes `docs/preferences.md` with your targets, the salary rules, the hard filters and the scoring rubric.
3. Writes `docs/writing-style.md` from the texts you linked.
4. Seeds `docs/answer-bank.md` with base answers built only from `profile.md`.
5. Copies the `data/` templates (`.claude/templates/data/`).

**Review `docs/profile.md` before the first `/find-jobs`**: everything the agents say about you comes from it. After that, the notes file (`docs/info.md`) is no longer needed and can be deleted.

## `docs/` format

These are the files Claude ends up with (you can also write them yourself). All are Markdown except the CV PDFs. The agents can **only** use facts that appear here.

### `docs/CV ATS Format EN.pdf` and `docs/CV ATS Format ES.pdf`

- Your original CV in English and in Spanish.
- They define the base wording and the visual format replicated by `.claude/templates/cv.html`.

### `docs/profile.md` — source of truth

A faithful transcription of the CV, plus projects and certifications. When something changes in your career, update it here first.

```markdown
# Profile — source of truth

## Contact
- Name: <full name>
- Email: <email>
- Phone: <phone with country code>
- Location: <city, country>
- Work mode: Remote
- LinkedIn: <url>
- GitHub: <url>

## Career Summary (CV)
<paragraph from the original CV>

## Short description (ES)
<introduction paragraphs in Spanish, used for Spanish offers>

## Summary of Qualifications — Proficient in
<comma-separated list, exactly as in the CV>

Other technologies mentioned in the experience: <list>

## Languages
- <language> — <level>

## Career History

### <Company> — <City>, <Country>
**<Role> — <Team, if any>** · <Mon. YYYY> – <Mon. YYYY | Present>

<paragraphs from the CV, without changing figures>

Skills: <role skills>

## Leadership
### <Company> — <City>, <Country> · <dates>
<paragraphs>

Skills: <...>

## Open-source projects
- **<name>** — <url> — <description>. Tech: <...>

## Certifications
- **<name>** — <issuer> · Issued <Mon. YYYY> — <verification url>
  - <confirmed learnings, marked as training>

## Education
- **<Institution>** — <City, Country> · <dates> — <degree>
```

> If the English and Spanish CVs differ, for example in a date, leave a note stating which one is correct.

### `docs/preferences.md` — search, salary and personal answers

```markdown
# Search preferences

## Target
- Roles: <list>
- Seniority: <Senior / Lead …>
- Work mode: 100% remote, hireable from <country>
- Company region: <priority, e.g. LATAM → rest of the Americas → other>
- Application language: the offer's language

## Salary
- Target: <USD/month>        # declared when the offer publishes no salary
- Minimum acceptable: <USD/month>
- Expectation to declare: range → minimum + 25%; single value → that value; no salary → target
- Coverage adjustment: ≥ 80% no adjustment; 60–79% × 0.8; < 60% × 0.6 (never below the minimum nor below the range minimum)

### Transferable experience
| Asked for | Equivalent in the profile |
|---|---|
| <Angular, Vue> | <React> |

## Hard filters
- <on-site/hybrid, country restriction, salary below minimum, older than 30 days…>

## Scoring rubric (0–100)
<weights and point tables for requirements, salary, recency and region>

## Form data
- Availability / notice period: <…>
- Accepted contract types: <…>

## Reusable answers
- <normalized question>: <answer> (YYYY-MM-DD)
```

### `docs/writing-style.md` — your voice

- Traits of how you write, literal reference sentences of yours, and the rules for form answers: no repeats, never "0 years", no dates per technology, natural tone.
- Ideally extracted from texts you wrote yourself, like your projects' READMEs.

```markdown
# User writing style
## Traits
- <…>
## Form answers
- <rules>
## Avoid
- <clichés, exaggerations…>
## Reference sentences (literal, by the user)
- "<…>"
```

### `docs/answer-bank.md` — answer bank

One base answer per topic or technology, written in your voice and only with facts from the profile. Each topic can hold an English and a Spanish version; `/apply` uses the one matching the offer and adds new answers.

```markdown
# Answer bank
## Patterns
### Equivalent technology
EN: I haven't worked with <X>, but I have with <Y>, …
ES: No he trabajado con <X>, pero sí con <Y>, …
### No similar basis
EN: I haven't had the opportunity to work with this tool.
ES: No he tenido la oportunidad de trabajar con esta herramienta.

## Background
### <topic>
EN: <answer>
ES: <answer>

## Technologies
### <technology>
EN: <answer>
ES: <answer>

## Process
### Availability
EN: <answer>
ES: <answer>
```

## `data/` format

The templates are versioned in [`.claude/templates/data/`](.claude/templates/data/). To start, copy them:

```bash
cp .claude/templates/data/*.md data/
```

If you forget, nothing breaks: `job-scout` creates `sources.md` and `offers.md`, and `/apply` creates `applications.md`, from the templates when they don't exist. After that the agents maintain them.

| File | What it is | Template |
|---|---|---|
| `data/sources.md` | Job boards and how to access each one (API, RSS, WebFetch or `site:` search). The scout updates it when a board fails or it finds a new one | Ships with ~17 tested boards, focused on remote and LATAM |
| `data/offers.md` | History of every offer seen, including discarded ones, to avoid repeats. Defines the ID format (`<source>-<YYYYMMDD>-<role>`), which is also the folder name in `applications/` | Header and empty table |
| `data/applications.md` | One row per application attempt; details live in `applications/<id>/application-log.md` | Header and empty table |
