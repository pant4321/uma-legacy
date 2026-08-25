# Uma Legacy

A GitHub Pages app for searching your own Uma Musume veterans. Upload a `data.json` dump from [UmaExtractor](https://github.com/xancia/UmaExtractor), then filter by sparks the way [uma.moe/database](https://uma.moe/database) does.

The dump stays in this browser (IndexedDB). Nothing is uploaded to a server.

## Use it

1. Open the game on **Enhance → List** (Veteran List).
2. Run UmaExtractor and grab `data.json`.
3. Open this page, drop the file in, and filter.

Blue and pink chips cycle 1★ → 2★ → 3★. Turn on **Advanced slot targeting** to require a spark on self, parent 1, parent 2, or grandparents instead of anywhere in the family.

## Develop

```bash
npm install
npm test
npm run dev
```

The dev server is at `http://localhost:5173/uma-legacy/`.

Character names, skill names, and spark labels are bundled from public uma.guide data. Icons load from uma.guide and fall back to a letter if the URL 404s.
