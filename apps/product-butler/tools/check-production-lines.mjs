import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const limit = 300;
const excludedPrefixes = [
  "components/ui/",
  "components/deferred/",
  "services/",
];
const excludedFiles = new Set([
  "components/ProLock.tsx",
  "components/UpgradeModal.tsx",
  "components/WooCommerceSetup.tsx",
  "lib/mockData.ts",
  "pages/Analytics.tsx",
  "pages/License.tsx",
  "pages/NotFound.tsx",
  "pages/Stores.tsx",
  "pages/Team.tsx",
  "stores/storesStore.ts",
  "stores/tierStore.ts",
  "test/example.test.ts",
]);

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

const failures = [];
let checked = 0;
for (const file of await collectFiles(sourceRoot)) {
  const relative = path.relative(sourceRoot, file).replaceAll("\\", "/");
  const extension = path.extname(relative);
  const excluded = excludedFiles.has(relative) || excludedPrefixes.some((prefix) => relative.startsWith(prefix));
  if (excluded || !new Set([".css", ".ts", ".tsx"]).has(extension)) continue;

  checked += 1;
  const lines = (await readFile(file, "utf8")).split(/\r?\n/u).length;
  if (lines > limit) failures.push(`${relative}: ${lines} lines`);
}

if (failures.length > 0) {
  throw new Error(`Maintained production files exceed ${limit} lines:\n${failures.join("\n")}`);
}

process.stdout.write(`Checked ${checked} maintained production files; all are <= ${limit} lines.\n`);
