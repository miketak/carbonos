# A verdict workbook for the QA testers

## Context

The QA team records verdicts by typing PASS or FAIL into the Pass/Fail column of a Google Doc that `make qa-docs` produces from `docs/qa/<persona>/*.md` through pandoc. The user asked whether a spreadsheet with one row per step would be easier for the human tester. It would: a sheet gives a dropdown instead of free text, tallies the verdicts per case by formula, filters to the failures, and lands in Google Sheets the same way the DOCX lands in Google Docs. The decisions taken with the user: the workbook sits **alongside** the DOCX export; **one workbook per persona, one sheet per procedure, plus a Summary sheet**; built **from the Markdown**, exactly as `qa-docs` does today; **governance only for now**. The mining pack is ignored in this change: it is not parsed, not checked and not edited. The parser takes a `--persona` so mining can follow later with the same command. The TypeScript qa CLI is not touched.

## Decisions

1. **Library: openpyxl** (`openpyxl>=3.1,<4`), in a new uv dependency group `qa-docs` so the docs CI job's default group is unchanged. `uv lock` once, commit `uv.lock`; `uv run --locked` then fails loudly on a stale lock.
2. **Code**: new `scripts/qa_sheets.py` (Markdown parser + workbook writer + `--check`), and `scripts/publish_qa_docs.py` calls it after the DOCX loop, reusing `BuildInfo.detect()`, `source_files()`, `doc_name()`, `_display()`, `REPO_URL` and the `out_dir` handling in `build()`.
3. **Verdict vocabulary**: PASS, FAIL, N/A (the README says PASS or FAIL; N/A matches the drivers' NA status; MANUAL is a driver status, not a human verdict).
4. **No CSV, no ADR**: CSV loses the validation and the Summary; ADR 0007 already frames the procedures as a source with generated projections, and a workbook is one more projection.

## Parser (`scripts/qa_sheets.py`)

Dataclasses `Step(number, action, expected, is_setup)`, `Case(id, title, rationale, steps)`, `Section(letter, title, cases)`, `Procedure(number, title, objective, covers, estimated, version, run_after, prerequisites, sections, known_non_goals, change_notes, source)`. A line-based state machine over `# Procedure N:`, `**Objective.**`, `**Covers**`, `**Estimated time:**`, `**Procedure version:**`, `**Run this procedure**`, `## Prerequisites`, `## X. Title`, `### X1. Title` (an optional rationale paragraph follows), the pipe tables, `## Sign-off`, `**Known non-goals:**`, `## Change notes`; joins wrapped lines, skips `<!-- -->` comments. `split_row()` honours `\|`; `strip_markdown()` removes `**`, backticks, turns `[text](url)` into text, unescapes `\|`. `step_id()` gives `3.A1.2`; step numbers like `1a` (the mining pack has 12) pass through as text. A setup step is one whose expected result is empty after stripping.

Fail with `SystemExit` naming file and line when: a step-table header differs from `Step | Action | Expected result | Pass/Fail | Notes` (every governance table uses it); a case or a procedure has zero steps; a case id repeats inside a procedure; a table appears outside a case. (The mining pack would fail the duplicate-id check today, two `### F3.` cases in its procedure 2; that is left for the follow-up that brings mining in.)

## Workbook (`build/qa-docs/<persona>-qa-procedures.xlsx`)

- **Read me** (first sheet): title, `BuildInfo.subtitle`, persona, how to fill in (one verdict per step, grey rows are setup and take none, Notes for observations, sign-off on Summary), links to the Drive folder named in the how-to and to `REPO_URL/tree/<ref>/docs/qa/<persona>`.
- **Summary**: a sign-off block per procedure (procedure, version string prefilled from `**Procedure version:**` plus the build subtitle, Tester, Date, Issues filed), then one row per case: Procedure, Case, Title, Verdict steps (literal count), PASS / FAIL / N/A via `COUNTIF('03 Activity data'!$G$12:$G$15,"PASS")` over the case's exact row span, Blank as the difference, Result `=IF(FAIL>0,"FAIL",IF(Blank>0,"",IF(PASS>0,"PASS","N/A")))`, a totals row. Plain A1 references with quoted sheet names only, so Google Sheets imports them.
- **One sheet per procedure**, named by `doc_name()` truncated to 31 characters with `[]:*?/\` removed, collisions detected. Rows 1 to 7: title, subtitle, Objective, Covers, Estimated time, Run this procedure, Prerequisites. Row 8 headers: Section, Case, Step, Step id, Action, Expected result, Pass/Fail, Notes. Each case opens with a bold merged title row (`A1. Title`, rationale beneath in italics); then one row per step. Setup rows grey with no validation. Data validation list `PASS,FAIL,N/A` on the verdict cells; conditional fills green/red/grey; freeze panes at A9; autofilter over the step rows; wrap text on Action, Expected result and Notes; widths about 9/8/6/9/55/70/10/30; A4 landscape, one page wide, header row repeated when printing. Known non-goals and Change notes as a labelled footer block two rows under the last step.

After writing, print one line like the DOCX build does: `built build/qa-docs/governance-qa-procedures.xlsx -> 8 procedures, 87 cases, 421 steps, 405 verdict steps`. `--check` parses the persona, builds the workbook into `BytesIO`, reloads it with openpyxl to assert the sheet count and one COUNTIF, and prints the counts without writing.

## Files touched

- `pyproject.toml`: `[dependency-groups] qa-docs = ["openpyxl>=3.1,<4"]`.
- `uv.lock`: regenerated.
- `scripts/qa_sheets.py`: new, as above.
- `scripts/publish_qa_docs.py`: build the workbook after the DOCX files; `--no-xlsx` to skip.
- `Makefile`: `qa-docs` runs with `--group qa-docs` and defaults `PERSONA` to governance for the workbook; new `qa-sheets-check` target (governance); `docs-check` calls it; `.PHONY` and help text.
- `.github/workflows/docs.yml`: `uv sync --locked --group qa-docs`, one step running `qa-sheets-check`.
- `docs/how-to/publish-qa-procedures.md`: second output node in the Mermaid diagram, a section "The verdict workbook", a troubleshooting row for a stale lock.
- `docs/reference/makefile.md`: the `qa-docs` row and a `qa-sheets-check` row.
- `docs/qa/README.md`, `docs/qa/governance/README.md`: one sentence each that the same steps are available as a workbook, one row per step.

## Risks

1. A generated procedure changes shape (a new header block line, a table outside a case): `qa-sheets-check` in `docs-check` and CI fails loudly.
2. Google Sheets import occasionally shifts merged cells or conditional formats: keep the formatting minimal and import one workbook by hand in the first round.
3. Two titles sharing their first 28 characters collide after truncation: detected at build time.
4. A developer machine without the group synced: `--group qa-docs` in the Makefile syncs it.

## Verification

```
uv lock && git diff --stat uv.lock
uv run --locked --group qa-docs python scripts/qa_sheets.py --check --persona governance
make qa-docs PERSONA=governance    # 9 DOCX, 1 XLSX, counts 8/87/421 printed (pandoc needed)
make docs-check
```

Then open `build/qa-docs/governance-qa-procedures.xlsx` (Google Sheets or LibreOffice), set two verdicts, and confirm the Summary counts move. Deliver as one PR, squash-merged on green, like the earlier pieces.
