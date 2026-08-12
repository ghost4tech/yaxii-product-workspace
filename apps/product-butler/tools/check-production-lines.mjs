import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = [path.join(projectRoot, "src", "production")];
const extensions = new Set([".css", ".ts", ".tsx"]);
const limit = 300;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(fullPath) : [fullPath];
    }),
  );
  return nested.flat();
}

const files = (await Promise.all(roots.map(collectFiles)))
  .flat()
  .filter((file) => extensions.has(path.extname(file)));
const failures = [];

for (const file of files) {
  const contents = await readFile(file, "utf8");
  const lines = contents.split(/\r?\n/u).length;
  if (lines > limit) {
    failures.push(`${path.relative(projectRoot, file)}: ${lines} lines`);
  }
}

if (failures.length > 0) {
  throw new Error(`Production files exceed ${limit} lines:\n${failures.join("\n")}`);
}

process.stdout.write(`Checked ${files.length} production files; all are <= ${limit} lines.\n`);
