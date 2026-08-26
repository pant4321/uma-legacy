import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");

async function copyIfExists(from, to) {
  if (!existsSync(from)) return;
  await cp(from, to, { recursive: true });
}

await rm("assets", { recursive: true, force: true });
await copyIfExists(path.join(dist, "assets"), "assets");
await copyIfExists(path.join(dist, "index.html"), "index.html");
await copyIfExists(path.join(dist, "favicon.svg"), "favicon.svg");
await copyIfExists(path.join(dist, ".nojekyll"), ".nojekyll");
await copyIfExists(path.join(dist, "sample-data.json"), "sample-data.json");
