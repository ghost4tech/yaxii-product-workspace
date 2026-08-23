import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const pluginRoot = path.resolve(projectRoot, "../..");
const releaseFlag = process.argv.indexOf("--release-root");
const releaseRoot = releaseFlag === -1 ? null : process.argv[releaseFlag + 1];
if (releaseFlag !== -1 && !releaseRoot) throw new Error("--release-root requires a directory.");
const targetRoot = releaseRoot ? path.resolve(releaseRoot) : pluginRoot;
const domain = "yaxii-product-workspace";
const gettextArguments = new Map([["__", [0, 1]], ["_x", [0, 1, 2]], ["_n", [0, 1, 3]]]);

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relative) : [relative];
  }));
  return groups.flat();
}

const manifestPath = path.join(targetRoot, "assets/build/.vite/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entry = manifest["src/main.tsx"];
if (!entry || typeof entry.file !== "string") {
  throw new Error("The production manifest has no Product Workspace entry script.");
}

const script = await readFile(path.join(targetRoot, "assets/build", entry.file), "utf8");
const extractionSource = await readFile(
  path.join(pluginRoot, `languages/source/${domain}.js`),
  "utf8",
);

function gettextSignatures(contents, fileName) {
  const source = ts.createSourceFile(fileName, contents, ts.ScriptTarget.Latest, false);
  const signatures = new Set();
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const name = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression) ? expression.name.text : "";
      const indexes = gettextArguments.get(name);
      if (indexes) {
        const values = indexes.map((index) => {
          const argument = node.arguments[index];
          return argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))
            ? argument.text
            : null;
        });
        if (values.every((value) => value !== null) && values.at(-1) === domain) {
          signatures.add(`${name}\u0000${values.join("\u0000")}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return signatures;
}

const expected = gettextSignatures(extractionSource, "translation-source.js");
const built = gettextSignatures(script, entry.file);
const missing = [...expected].filter((signature) => !built.has(signature));
const unexpected = [...built].filter((signature) => !expected.has(signature));
if (missing.length > 0 || unexpected.length > 0) {
  throw new Error(`Built entry translation mismatch: ${missing.length} missing, ${unexpected.length} unexpected.`);
}

const forbiddenLocaleSystems = [
  /\b(?:changeLanguage|setLanguage|setLocaleData)\s*\(/u,
  /\bi18next\b/u,
  /localStorage\.(?:getItem|setItem)\([^)]*(?:language|locale)/iu,
];
const sourceRoot = path.join(projectRoot, "src");
const sourceFiles = (await listFiles(sourceRoot)).filter((file) => /\.[jt]sx?$/u.test(file));
const localizationEscapes = [];
for (const file of sourceFiles) {
  const contents = await readFile(path.join(sourceRoot, file), "utf8");
  if (forbiddenLocaleSystems.some((pattern) => pattern.test(contents))) localizationEscapes.push(file);
}
if (localizationEscapes.length > 0) {
  throw new Error(`Custom locale system detected:\n${localizationEscapes.join("\n")}`);
}

if (releaseRoot) {
  const files = await listFiles(targetRoot);
  const forbidden = files.filter((file) => /\.(?:po|mo)$/iu.test(file)
    || /^languages\/.*\.json$/iu.test(file));
  if (forbidden.length > 0) {
    throw new Error(`Release contains development translation catalogs:\n${forbidden.join("\n")}`);
  }
  if (!files.includes(`languages/${domain}.pot`)) {
    throw new Error("Release is missing the canonical POT source template.");
  }
} else {
  const releaseManifest = JSON.parse(await readFile(path.join(pluginRoot, "release-manifest.json")));
  const includes = releaseManifest.include ?? [];
  if (!includes.includes("assets/build/*") || !includes.includes("languages/*.pot")) {
    throw new Error("Release manifest must include built assets and the canonical POT template.");
  }
  if (includes.some((pattern) => /languages\/.*\.(?:po|mo|json)$/iu.test(pattern))) {
    throw new Error("Release manifest includes development translation catalogs.");
  }
}

process.stdout.write(
  `Validated ${built.size}/${expected.size} WordPress-extractable messages in ${entry.file}; no custom locale system`
    + (releaseRoot ? "; release catalogs are compliant.\n" : ".\n"),
);
