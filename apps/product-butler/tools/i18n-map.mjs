import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const pluginRoot = path.resolve(projectRoot, "../..");
const manifestPath = path.join(pluginRoot, "assets/build/.vite/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entry = manifest["src/main.tsx"];
if (!entry || typeof entry.file !== "string") {
  throw new Error("The production manifest does not contain the Product Workspace entry script.");
}
const map = {
  "languages/source/yaxii-product-workspace.js": `assets/build/${entry.file}`,
};
const output = path.join(pluginRoot, "languages/source-map.json");
await writeFile(output, `${JSON.stringify(map, null, 2)}\n`, "utf8");
process.stdout.write(`Mapped JavaScript translations to ${entry.file}.\n`);
