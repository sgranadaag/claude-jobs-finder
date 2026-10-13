# jobs-finder

Personal system for finding and applying to job offers (software engineering), run as a Claude Code workflow.

**Project language: English.** Agents, skills, rules, formats, file headers and status values are written in English. Content that goes to an employer follows the offer's language (Spanish offers get Spanish CVs and answers). The user's own texts in `docs/` (e.g. Spanish answers in the answer bank, the Spanish short description) stay as they are.

## Flow

| Step | Entry point | Who runs it | Why |
|------|-------------|-------------|-----|
| 1. Search | `/find-jobs` | `job-scout` subagent | Heavy web browsing; isolated so it doesn't fill the main context |
| 2. Prepare | `/tailor-cv` | `cv-tailor` subagent (one per offer, in parallel) | Each offer is independent and benefits from a clean context |
| 3. Apply | `/apply` | main session + browser | Needs the user's sessions, human intervention (login, captcha, questions) and confirmation before submitting |

## Files

- `docs/profile.md` — **source of truth** for the profile (faithful transcription of the CV). Everything said about the candidate must come from here (includes "Contact": name, email, phone, location, LinkedIn, GitHub).
- `docs/writing-style.md` — the user's voice (extracted from their READMEs) for written texts, plus the rules for form answers.
- `docs/preferences.md` — search criteria, salary (with coverage adjustment and transferable experience), filters, scoring rubric and the user's reusable answers.
- `docs/answer-bank.md` — **answer bank** by topic/technology, in the user's voice. `/apply` adapts it to each form and extends it with new answers.
- `docs/CV ATS Format EN.pdf` / `ES.pdf` — original CV.
- `data/sources.md` — job boards used by the scout (maintained by the scout itself).
- `data/offers.md` — **history** of every offer seen (including discarded ones), used to avoid repeats.
- `data/applications.md` — global log of applications.
- `applications/<id>/` — one folder per offer:
  - `offer.md` — copy of the offer, score and the **only requirements table** (the scout creates it, cv-tailor refines it; score and salary come from it)
  - `cv.md` — tailored CV content, in a fixed format (cv-tailor)
  - `<Name>_CV_<Company>.pdf` — final CV, built by the script
  - `application.md` — short: CV, salary with its calculation, "why?", cover letter and pending items (cv-tailor)
  - `application-log.md` — what was filled/sent, literal questions with their answers, and the result (apply)
- `.claude/templates/data/` — versioned templates for `sources.md`, `offers.md` and `applications.md`. `data/` is not versioned: if a file is missing, create it by copying its template.
- `.claude/templates/cv.html` — CV style (replica of the original). If it changes, rebuild the PDFs with the script.
- `.claude/scripts/build-cv.mjs <ID> [--keep-html]` — turns `applications/<ID>/cv.md` into the PDF using the template and headless Edge.
- `.claude/settings.json` — pre-authorized permissions (web search, writing to `applications/`, `data/` and the answer bank, the CV script, Claude in Chrome) to reduce prompts.

## Offer status (`data/offers.md`)

`discarded` → fails the hard filters (not processed, only kept to avoid repeats)
`new` → listed by the scout
`prepared` → has a CV and application data
`draft` → form filled and saved on the board, not submitted
`applied` / `failed` / `skipped` → result of `/apply`

## Non-negotiable rules

1. **Invent nothing.** No skills, years, roles, metrics, certifications or answers that aren't in `docs/`. Only reordering, selecting, omitting, rephrasing and translating existing information is allowed. If something is missing, mark it `PENDING USER`.
2. Only the main session edits `data/offers.md` while subagents run in parallel (the `cv-tailor` instances don't touch it, to avoid write conflicts).
3. An application is never submitted without the user's explicit confirmation.
4. ID documents (national ID, passport) are not stored in any file: if a form asks for them, ask the user at that moment. `docs/`, `data/` and `applications/` are not versioned.
