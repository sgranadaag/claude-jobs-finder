---
name: apply
description: Applies to recorded offers by launching one job-applier subagent per offer in parallel - each one tailors the CV (tailor-cv skill), fills the form in the browser and stops before submitting - then relays the user's confirmation, records the results and cleans up. Use only when the user asks to apply (step 2 of the workflow).
argument-hint: "[space-separated IDs | minimum score, default 50] [no-submit]"
disable-model-invocation: true
---

Step 2 of the workflow (see `CLAUDE.md`). You orchestrate; each `job-applier` subagent handles one offer end to end. Only you talk to the user and only you edit the shared files (`data/offers.md`, `data/applications.md`, `docs/answer-bank.md`, `docs/preferences.md`).

## Preparation

1. Read `data/offers.md` and pick the offers:
   - If `$ARGUMENTS` has IDs, those.
   - If it has a number, the `new`, `prepared` or `draft` offers with score ≥ that number.
   - If it is empty, the `new`, `prepared` or `draft` offers with score ≥ 50.
   Show them sorted by score and confirm with the user which ones to apply to. If there are none, say so and stop. If `$ARGUMENTS` says "no-submit", the run ends at the review step and every application stays as a draft.
2. Check the Claude in Chrome extension is connected (`tabs_context_mcp`) before launching anything; if it isn't, ask the user to connect it.

## Run

3. Launch one `job-applier` subagent per offer, passing the ID (and "no-submit" if set). Launch them in parallel, in batches of up to 4 (they share the user's browser, one tab each).
4. Handle each report as it arrives:
   - `READY_TO_SUBMIT` → show the user the field summary for that offer and wait for explicit confirmation. Confirmed → resume that same agent (SendMessage to its ID) with "confirmed" plus any corrections. Not confirmed → resume it with the corrections, or tell it to leave the application as a draft. In "no-submit" mode, don't ask: record it as `draft`.
   - `BLOCKED` → tell the user what is needed (login, captcha, CV upload, pending questions). When they are done or answer, resume the same agent with that.
   - `APPLIED` / `FAILED` / `SKIPPED` → record it (next section).
   - The user says they submitted it themselves → check the agent's tab for the board's confirmation, tell the agent (if still running) to stop touching the form, log the result and close its tab, and record it as `applied`.
   ID documents and other sensitive data the user gives are relayed to the agent only, never written to any file.
5. Record each finished offer:
   - Update its status in `data/offers.md` (`applied`, `draft`, `failed` or `skipped`, with the reason, coverage and declared salary in Notes).
   - Add a row to `data/applications.md` (if it doesn't exist, create it by copying `.claude/templates/data/applications.md`).
   - Apply the agent's proposed additions to `docs/answer-bank.md` and to "Reusable answers" in `docs/preferences.md`, merging duplicates across agents. Save answers the user gives in chat there as soon as they give them.
   - Company cooldown: once an offer is `applied`, mark any other `new` / `prepared` offer from the same company as `discarded` (cooldown, with the blocking ID and date in Notes) and remove its `applications/<ID>/` folder. Don't launch two agents for the same company in one run.

## Cleanup (after every offer in the run has finished)

For every offer processed in this run whose final status is **not** `applied` (`skipped`, `blocked`, `failed`, or an unsent `draft`), delete its entire `applications/<ID>/` folder. Only offers that were actually submitted keep their folder — `applications/` only ever holds successfully-applied offers. In "no-submit" mode, keep the `draft` folders (the user will come back to them).

The row in `data/offers.md` is never deleted (it's the permanent history); note in its Notes column that the folder was removed and that the CV would need to be rebuilt if the offer becomes viable again later (e.g. after a platform cooldown like Proxify's).

At the end, show a summary of all the applications of the run.
