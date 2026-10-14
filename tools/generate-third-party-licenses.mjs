import { exec } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const frontendRoot = path.join(repositoryRoot, "apps", "product-butler");
const run = promisify(exec);
const { stdout } = await run('npm query ":not(.dev)" --json', {
  cwd: frontendRoot,
  maxBuffer: 10 * 1024 * 1024,
});
const queriedPackages = JSON.parse(stdout);

const packages = queriedPackages
  .filter((metadata) => metadata.name !== "@yaxii/product-workspace-frontend")
  .map((metadata) => ({
    license: metadata.license ?? "UNKNOWN",
    name: metadata.name,
    version: metadata.version,
  }));

packages.sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version));
const output = `${JSON.stringify({ generated_from: "apps/product-butler/package-lock.json", packages }, null, 2)}\n`;
await writeFile(path.join(repositoryRoot, "THIRD-PARTY-LICENSES.json"), output, "utf8");
process.stdout.write(`Recorded ${packages.length} production package licenses.\n`);
