import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const output = path.resolve(projectRoot, "../../languages/source/yaxii-product-workspace.js");
const domain = "yaxii-product-workspace";
const translationArguments = new Map([["__", 1], ["_x", 2], ["_n", 3]]);
const userAttributes = new Set(["aria-label", "placeholder", "title"]);
const userProperties = new Set(["description", "heading", "hint", "label", "message", "title"]);
const allowed = new Set([
  "Ctrl D", "Ctrl K", "Ctrl S", "Esc", "SKU", "Yaxii COD Theme", "Yaxii Dev",
  "Yaxii Product Workspace", "Yaxii Shipping Manager", "Yaxii Smart Form", "auto-from-name",
  "Ctrl ⏎",
]);

function sourceKind(file) {
  return file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function resolveModule(specifier, importer) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/")
    ? path.join(sourceRoot, specifier.slice(2))
    : path.resolve(path.dirname(importer), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function literalText(node) {
  return ts.isStringLiteralLike(node) ? node.text : null;
}

function lineOf(tree, node) {
  return tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
}

function humanText(value) {
  const text = value.replace(/\s+/gu, " ").trim();
  if (!/[A-Za-z]/u.test(text) || allowed.has(text)) return null;
  if (/^(?:https?:\/\/|#|[A-Z0-9_-]+$)/u.test(text)) return null;
  return text;
}

function withinTranslation(node) {
  let current = node.parent;
  while (current && !ts.isStatement(current)) {
    if (ts.isCallExpression(current) && ts.isIdentifier(current.expression)
      && translationArguments.has(current.expression.text)) return true;
    current = current.parent;
  }
  return false;
}

function translatorComment(source, tree, node) {
  const ranges = ts.getLeadingCommentRanges(source, node.getFullStart()) ?? [];
  let comments = ranges.map((range) => source.slice(range.pos, range.end))
    .filter((comment) => /translators:/iu.test(comment));
  if (!comments.length) {
    const nearby = source.slice(Math.max(0, node.getStart(tree) - 350), node.getStart(tree));
    const matches = [...nearby.matchAll(/\/\*\s*translators:[\s\S]*?\*\//giu)];
    const latest = matches.at(-1)?.[0];
    if (latest) comments = [latest];
  }
  return comments.join("\n").replace(/^\s*\/\*+\s*/u, "/* translators: ")
    .replace(/\s*\*\/\s*$/u, " */");
}

const pending = [path.join(sourceRoot, "main.tsx")];
const visited = new Set();
const messages = new Map();
const failures = [];

while (pending.length) {
  const file = pending.pop();
  if (!file || visited.has(file)) continue;
  visited.add(file);
  const source = await readFile(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, sourceKind(file));
  const relative = path.relative(projectRoot, file).replaceAll("\\", "/");

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const resolved = resolveModule(node.moduleSpecifier.text, file);
      if (resolved) pending.push(resolved);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      const expected = translationArguments.get(name);
      if (expected !== undefined) {
        const domainValue = literalText(node.arguments[expected]);
        const messageArguments = name === "_n" ? node.arguments.slice(0, 2) : node.arguments.slice(0, expected);
        const values = messageArguments.map(literalText);
        if (domainValue !== domain || values.some((value) => value === null)) {
          failures.push(`${relative}:${lineOf(tree, node)} invalid gettext arguments`);
        } else {
          const key = JSON.stringify([name, ...values]);
          messages.set(key, { comment: translatorComment(source, tree, node), name, values });
        }
      }
      const called = ts.isIdentifier(node.expression) ? node.expression.text : "";
      const errorArgument = node.arguments.at(-1);
      const errorText = errorArgument ? literalText(errorArgument) : null;
      if ((called === "setError" || called === "fail") && errorText
        && humanText(errorText) && !withinTranslation(errorArgument)) {
        failures.push(`${relative}:${lineOf(tree, node)} untranslated error text`);
      }
    }
    if (ts.isJsxText(node)) {
      const text = humanText(node.text);
      if (text) failures.push(`${relative}:${lineOf(tree, node)} untranslated JSX: ${text}`);
    }
    if (ts.isJsxAttribute(node) && userAttributes.has(node.name.text)
      && node.initializer && ts.isStringLiteral(node.initializer)) {
      const text = humanText(node.initializer.text);
      if (text) failures.push(`${relative}:${lineOf(tree, node)} untranslated ${node.name.text}: ${text}`);
    }
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && userProperties.has(node.name.text)) {
      const text = literalText(node.initializer);
      if (text && !/^[a-z][A-Za-z0-9_]*$/u.test(text) && humanText(text) && !withinTranslation(node.initializer)) {
        failures.push(`${relative}:${lineOf(tree, node)} untranslated ${node.name.text}: ${text}`);
      }
    }
    if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteralLike(node.expression)) {
      const text = humanText(node.expression.text);
      if (text && !withinTranslation(node.expression)) {
        failures.push(`${relative}:${lineOf(tree, node)} untranslated JSX expression: ${text}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}

if (failures.length) {
  throw new Error(`Production localization violations:\n${[...new Set(failures)].join("\n")}`);
}

const lines = [
  "/* Generated by npm run i18n:source. Do not edit. */",
  "/* This file is an extraction source only and is not enqueued. */",
];
for (const { comment, name, values } of [...messages.values()].sort((left, right) =>
  JSON.stringify(left.values).localeCompare(JSON.stringify(right.values)))) {
  if (comment) lines.push(comment);
  else if (values.some((value) => /%(?:\d+\$)?[sd]/u.test(value))) {
    lines.push("/* translators: Keep all placeholders unchanged. */");
  }
  const argumentsList = name === "_n"
    ? [...values.slice(0, 2), "2", domain]
    : [...values, domain];
  lines.push(`wp.i18n.${name}(${argumentsList.map((value) => typeof value === "number" ? value : JSON.stringify(value)).join(", ")});`);
}
const generated = `${lines.join("\n")}\n`;
if (process.argv.includes("--check")) {
  const current = await readFile(output, "utf8").catch(() => "");
  const normalizedCurrent = current.replace(/\r\n/gu, "\n");
  if (normalizedCurrent !== generated) throw new Error("Generated JavaScript translation source is stale. Run npm run i18n:source.");
} else {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, generated, "utf8");
}
process.stdout.write(`Checked ${visited.size} production modules and generated ${messages.size} JavaScript messages.\n`);
