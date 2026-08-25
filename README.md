# Uma Legacy

Search your own Uma Musume veterans in the browser. Export a `data.json` dump with [UmaExtractor](https://github.com/xancia/UmaExtractor), then drop it on this page.

UmaExtractor needs to run while the game is on **Enhance → List** (Veteran List). The dump stays in this browser (IndexedDB). Nothing is uploaded to a server.

## What it does

- Load your extractor dump (file, drop, or paste)
- Filter sparks in two columns:
  - **All** — combined stars on the main parent and both grandparents (up to 9★)
  - **Main Parent** — stars on the veteran herself (up to 3★)
- Use **Show sparks** (All / Main / GP 1 / GP 2) to change which sparks cards display; this does not change the filters
- Click **Add** under a color to insert a search box and star picker, then pick the factor
- Combine factors with **All (AND)** or **Any (OR)** inside a combination, then add more combinations for extra AND/OR groups
- Save named presets in this browser, or export / import a JSON filter file
- Search by name, skill, spark, or parent, and sort the results
- Keep the last dump on this device so you can come back later

Live site: https://pant4321.github.io/uma-legacy/

That URL is the production build committed on this branch (`index.html` and `assets/`). Run `npm run build` after UI changes so those files stay current.

## Develop

```bash
npm install
npm test
npm run dev
```

The dev server is at `http://localhost:5173/uma-legacy/`.

Character names, skill names, and spark labels are bundled from public uma.guide data. Icons load from uma.guide and fall back to a letter if the URL 404s.
