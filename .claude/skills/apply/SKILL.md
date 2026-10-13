---
name: apply
description: Applies to offers in "prepared" (or "draft") status using the browser, filling the forms with the generated data and the answer bank, and recording what was sent and the result. Use only when the user asks to apply (step 3 of the workflow).
argument-hint: "[space-separated IDs | empty = all prepared] [no-submit]"
disable-model-invocation: true
---

Step 3 of the workflow (see `CLAUDE.md`). It runs in the main session (not in a subagent) because it needs the browser, the user's sessions and their confirmation.

## Preparation

1. Read `data/offers.md` and take the offers given in `$ARGUMENTS`, or all offers with status `prepared`. Show them sorted by score and confirm with the user which ones to apply to. If `$ARGUMENTS` says "no-submit", fill everything and leave each application as a draft.
2. Read `docs/answer-bank.md`, `docs/writing-style.md` ("Form answers" section) and `docs/preferences.md` ("Reusable answers" and salary).
3. Load the available browser skill (Claude in Chrome, or else the built-in browser) before the first browser action.

## For each offer

1. Read `applications/<ID>/application.md` (CV, salary, "why?", cover letter, pending items) and `offer.md` (requirements table). Contact data lives in "Contact" in `docs/profile.md`. ID documents and other sensitive data are not stored in any file: if the form requires them, ask the user at that moment and don't record them in the log. If there are pending items the form will ask for, ask the user before starting.
2. Open the offer URL and get to the form (Apply / Easy Apply / external ATS such as Greenhouse, Lever, Ashby, Workable).
3. If it asks for login, account creation, captcha or email verification: **stop and ask the user to do it**. Don't create accounts without permission.
4. Read **all** the form questions before answering any of them. Then:
   - Map each question to the `docs/answer-bank.md` topics that fit it and **spread the material so nothing repeats**: the same project, achievement or certification never appears in two answers ("why this company?" and the cover letter count too).
   - Adapt each base answer to the question, without adding facts. Answer in the offer's language. If it asks for a transferable technology, use the "Equivalent technology" pattern; if there is no basis, "No similar basis".
   - Salary (gross or net): the value in `application.md`.
   - Questions that depend on the user and are not in the docs or in "Reusable answers": ask the user; never assume.
   - Optional demographic questions: blank or "Prefer not to say".
5. Upload `applications/<ID>/<Name>_CV_<Company>.pdf` (without updating the board's profile with that CV or setting it as default). If the browser can't upload files, ask the user to upload it and give them the absolute path.
6. **Before submitting**: show the user a summary of every field and answer and wait for their explicit confirmation. Nothing is sent without it. In "no-submit" mode, leave the application in preview or as a draft.
7. Submit and capture the result (confirmation message, reference number, error).
8. If you wrote a new answer that will be useful for other offers, or the user corrected one, add or update it in `docs/answer-bank.md`. If the user provided new personal data (salary, previous processes, etc.), add it to "Reusable answers" in `docs/preferences.md`.

## Log (always, even if it fails, is skipped or stays as a draft)

Create or extend `applications/<ID>/application-log.md`:

```markdown
## Attempt <YYYY-MM-DD HH:mm>
- URL / platform: ...
- Result: applied | draft | blocked | failed | skipped
- Confirmation / reference: ...
- CV: <file> (name it has on the board)
- Declared salary: <value>
- Fields:
  | Field | Value |
  |---|---|
- Screening questions (literal question text and the answer sent, in full):
  1. **<question exactly as it appears>**
     <answer>
- Data provided by the user: ...
- Issues: ...
```

Then add a row to `data/applications.md` (if it doesn't exist, create it by copying `.claude/templates/data/applications.md`) and update the status in `data/offers.md` (`applied`, `draft`, `failed` or `skipped`, with the reason in Notes).

At the end, show a summary of all the applications of the session.
