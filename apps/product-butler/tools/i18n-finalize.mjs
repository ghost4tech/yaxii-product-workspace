import { readFile, readdir, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const languages = path.join(root, "languages");
const domain = "yaxii-product-workspace";
const sourceMap = JSON.parse(await readFile(path.join(languages, "source-map.json"), "utf8"));
const builtPath = sourceMap[`languages/source/${domain}.js`];

if (typeof builtPath !== "string") {
  throw new Error("The JavaScript translation source is not mapped to a built asset.");
}

const hash = createHash("md5").update(builtPath).digest("hex");

async function removeStaleHashCatalogs(locale) {
  const current = `${domain}-${locale}-${hash}.json`;
  const pattern = new RegExp(`^${domain}-${locale}-[a-f0-9]{32}\\.json$`, "u");
  const stale = (await readdir(languages)).filter((file) => pattern.test(file) && file !== current);
  await Promise.all(stale.map((file) => unlink(path.join(languages, file))));
}

for (const locale of ["ar", "fr_FR"]) {
  await removeStaleHashCatalogs(locale);
  await unlink(path.join(languages, `${domain}-${locale}-yaxii-product-workspace-app.json`))
    .catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
}
process.stdout.write(`Retained only path-hashed JavaScript catalogs for ${builtPath}.\n`);
