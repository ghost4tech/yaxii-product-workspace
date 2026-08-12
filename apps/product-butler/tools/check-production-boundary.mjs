import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = path.resolve(projectRoot, "../../assets/build/assets");
const forbiddenText = [
  "consumerKey",
  "consumerSecret",
  "/wc/v3",
  "Access-Control-Allow-Origin",
  "woo-tier-store",
  "woo-stores-store",
  "Bulk CSV",
  "AI descriptions",
  "fonts.googleapis.com",
  "lovable.dev",
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(fullPath) : [fullPath];
    }),
  );
  return groups.flat();
}

const files = await collectFiles(buildRoot);
const failures = [];

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const forbidden of forbiddenText) {
    if (contents.includes(forbidden)) {
      failures.push(`${path.basename(file)} contains forbidden production text: ${forbidden}`);
    }
  }

  if (path.extname(file) === ".css") {
    const fontOnly = contents.startsWith("@font-face") && !contents.includes("#yaxii-product-workspace");
    if (!fontOnly && !contents.includes("#yaxii-product-workspace")) {
      failures.push(`${path.basename(file)} is missing the plugin root selector`);
    }
    if (/(?:^|\})\s*(?:html|body|:root|\*)\b/u.test(contents)) {
      failures.push(`${path.basename(file)} contains a global root selector`);
    }
    if (/url\(["']?https?:/u.test(contents)) {
      failures.push(`${path.basename(file)} loads a remote asset`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Production boundary violations:\n${failures.join("\n")}`);
}

process.stdout.write(`Checked ${files.length} built assets; production boundary is clean.\n`);
