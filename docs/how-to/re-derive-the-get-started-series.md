---
owner: miketak
last_reviewed: 2026-09-28
---

# Re-derive the Get started series

The Get started series of the help centre (`help/docs/get-started`) walks a
reader through Gye Nyame Gold, from an empty account to a published
report. Every figure it quotes and every screenshot it shows came from a
scripted run of the product, `frontend/e2e/help-walkthrough.mjs`, not from
memory. When a product change touches a screen the series shows, a label
it quotes, or the arithmetic of a run, run the script again and update the
articles from what it records.

## Before you start

- Docker, Java 25 and Node 22, as for the rest of the dev environment.
- A Playwright browser: `cd frontend && npx playwright install chromium`
  once. The script also accepts a headless shell already in the Playwright
  cache.

## Run the walkthrough

1. Wipe the local database and start the stack on it:

    ```bash
    make db-reset
    make backend        # in one terminal, wait for "Started CarbonosApplication"
    make frontend       # in another
    make admin EMAIL=owner@gyenyame.example PASSWORD='Nyame-2025!' NAME="Ama Owusu"
    ```

    The walkthrough needs a fresh account: it creates the organization,
    and a second run against the same database stops at the first
    duplicate.

2. Run it from `frontend/`:

    ```bash
    npm run help:walkthrough
    ```

    It signs in, does the eight steps in order with the fixture
    `help/docs/assets/gye-nyame-2025.csv`, and writes to `frontend/e2e/out/`:
    `walkthrough-log.txt` (the text of every screen, dialog and toast, in
    sections headed `## <step> <what>`, ending with the run report and the
    toasts in order), `screens/` (full-window screenshots at 1440 by 900)
    and `exports/` (the four export files of Run 001). `BASE`, `EMAIL`,
    `PASSWORD` and `OUT` override the defaults.

3. Compare the log with the articles. A figure or a quoted string that
   differs is a change to make in the article, with `last_reviewed`
   updated. Run 001 should total 86,412 t CO₂e; if it does not, a factor
   or a rule changed, and the landing page's persona figures in
   `frontend/src/features/home/landing/landingData.ts` follow the run too.

4. Replace the screenshots the articles use (the `screens:` entry of each
   step article) with the new captures. Quantize them to palette PNGs
   first, so each stays under half a megabyte:

    ```bash
    python3 -c "
    from PIL import Image; import sys
    for p in sys.argv[1:]:
        im = Image.open(p).convert('RGB')
        im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(p, optimize=True)
    " help/docs/assets/screens/*.png
    ```

5. Run `make help-check`, then the frontend Definition of Done.

## When the script stops early

The script uses the labels and buttons the screens print. When a label is
renamed, the script fails at that step with the locator in the message;
fix the locator, wipe the database again and rerun. The articles then
need the same rename, which is the point of the exercise.
