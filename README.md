# Uma Legacy

Search your own Uma Musume veterans in the browser. Export a `data.json` dump with [UmaExtractor](https://github.com/xancia/UmaExtractor), then drop it on this page.

UmaExtractor needs to run while the game is on **Enhance → List** (Veteran List). The dump stays in this browser (IndexedDB). Nothing is uploaded to a server.

## What it does

- Load your extractor dump (file, drop, or paste)
- Filter sparks in two columns:
  - **All** — the spark can sit on the main parent or either grandparent
  - **Main Parent** — the spark must sit on the veteran herself
- Click **Add** under a color to insert a search box and star slider, then pick the factor
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
