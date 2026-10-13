---
name: tailor-cv
description: Generates the tailored CV and application data for the recorded offers, without inventing information. Use when the user wants to prepare offers to apply to, or to run step 2 of the workflow.
argument-hint: "[space-separated IDs | minimum score, default 60]"
---

Step 2 of the workflow (see `CLAUDE.md`).

1. Read `data/offers.md` and pick the offers to prepare:
   - If `$ARGUMENTS` has IDs, those.
   - If it has a number, the `new` offers with score ≥ that number.
   - If it is empty, the `new` offers with score ≥ 60.
   Show the list to the user before starting. If there are none, say so and stop.
2. Launch one `cv-tailor` subagent per offer, passing the ID. Launch them in parallel in batches of up to 4.
3. When each one finishes, update its row in `data/offers.md`: status `prepared` if `<Name>_CV_<Company>.pdf` and `application.md` exist; otherwise leave it `new` and note the problem in Notes. Only you edit this file; the subagents don't.
4. Show a summary per offer: mandatory coverage, resulting salary, transferable and no-basis requirements, and the consolidated list of pending items. If the same pending item repeats, suggest adding it to `docs/preferences.md` so it doesn't come up again.
5. Recommend that the user reviews each offer's PDF before running `/apply`.
