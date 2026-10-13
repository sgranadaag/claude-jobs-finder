---
name: find-jobs
description: Searches for new job offers that fit the profile, scores them and records them in the history. Use when the user wants to search for offers or to run step 1 of the workflow.
argument-hint: "[amount] [optional focus, e.g. 'backend only' or 'Get on Board']"
---

Step 1 of the workflow (see `CLAUDE.md`).

1. Launch the `job-scout` subagent with this assignment:
   - Target number of new offers: the one given in `$ARGUMENTS`, or 15 by default.
   - Additional focus, if `$ARGUMENTS` mentions one (role, technology or specific board).
   - Reminder: read `data/offers.md` first and don't repeat anything already in it.
2. When it finishes, show the user its summary: table of new offers sorted by score and count of discarded offers by reason.
3. Offer to continue with `/tailor-cv` for the high and medium priority ones (score ≥ 50).
