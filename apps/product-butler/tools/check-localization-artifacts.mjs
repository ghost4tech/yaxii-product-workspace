import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const languages = path.join(root, "languages");
const domain = "yaxii-product-workspace";
const locales = { ar: 6, fr_FR: 2 };
const failures = [];
const identicalAllowed = new Set([
  "%s variation", "%s variations", "Descriptions", "Global", "Graphite", "Images", "Navigation",
  "Simple", "Slug", "Standard", "Stock", "Taxable", "Variable", "Variations", "Violet", "WooCommerce", "WordPress",
  "Yaxii", "Yaxii Dev", "Yaxii Product Workspace", "Yaxii Smart Form", "Yaxii COD Theme",
  "Yaxii Shipping Manager", "https://yaxii.dev/",
]);

function decode(value) {
  return JSON.parse(value);
}

function parsePo(contents) {
  return contents.split(/\r?\n\r?\n/gu).flatMap((block) => {
    const entry = { comments: [], translations: [] };
    let field = "";
    for (const line of block.split(/\r?\n/gu)) {
      if (line.startsWith("#")) {
        entry.comments.push(line);
        continue;
      }
      const match = line.match(/^(msgctxt|msgid_plural|msgid|msgstr(?:\[(\d+)\])?)\s+(".*")$/u);
      if (match) {
        field = match[1];
        const value = decode(match[3]);
        if (field.startsWith("msgstr")) entry.translations[Number(match[2] ?? 0)] = value;
        else entry[field] = value;
      } else if (/^"/u.test(line) && field) {
        const value = decode(line);
        if (field.startsWith("msgstr")) {
          const index = Number(field.match(/\[(\d+)\]/u)?.[1] ?? 0);
          entry.translations[index] = `${entry.translations[index] ?? ""}${value}`;
        } else entry[field] = `${entry[field] ?? ""}${value}`;
      }
    }
    return entry.msgid === undefined ? [] : [entry];
  });
}

function key(entry) {
  return `${entry.msgctxt ?? ""}\u0004${entry.msgid}`;
}

function placeholders(value) {
  return [...value.matchAll(/%(?:\d+\$)?[bcdeEfFgGosuxX]/gu)].map((match) => match[0]).sort();
}

function samePlaceholders(source, translation) {
  return JSON.stringify(placeholders(source)) === JSON.stringify(placeholders(translation));
}

const potEntries = parsePo(await readFile(path.join(languages, `${domain}.pot`), "utf8"))
  .filter((entry) => entry.msgid);
const pot = new Map(potEntries.map((entry) => [key(entry), entry]));

for (const [locale, pluralCount] of Object.entries(locales)) {
  const poPath = path.join(languages, `${domain}-${locale}.po`);
  const entries = parsePo(await readFile(poPath, "utf8")).filter((entry) => entry.msgid);
  const catalog = new Map(entries.map((entry) => [key(entry), entry]));
  for (const [entryKey, source] of pot) {
    const translated = catalog.get(entryKey);
    if (!translated) {
      failures.push(`${locale}: missing ${source.msgid}`);
      continue;
    }
    const expected = source.msgid_plural ? pluralCount : 1;
    for (let index = 0; index < expected; index += 1) {
      const value = translated.translations[index] ?? "";
      if (!value.trim()) failures.push(`${locale}: empty translation for ${source.msgid} [${index}]`);
      const placeholderSource = index === 0 || !source.msgid_plural ? source.msgid : source.msgid_plural;
      if (!samePlaceholders(placeholderSource, value)) {
        failures.push(`${locale}: placeholder mismatch for ${source.msgid} [${index}]`);
      }
      if (value === placeholderSource && !identicalAllowed.has(value) && !/^https?:\/\//u.test(value)
        && !/^(?:[\d\s%+./_*#()-]|SKU|UUID|JSON|Ctrl|Esc|Enter)+$/u.test(value)) {
        failures.push(`${locale}: untranslated English for ${source.msgid} [${index}]`);
      }
      if (locale === "ar") {
        if (/[٠-٩۰-۹]/u.test(value)) failures.push(`ar: non-Latin digit in ${source.msgid}`);
        if (/\p{Script=Arabic}[^\n]*,/u.test(value)) failures.push(`ar: ASCII comma in ${source.msgid}`);
        if (/\b(?:plugin|settings)\b/iu.test(value)) failures.push(`ar: untranslated generic term in ${source.msgid}`);
      }
      if (locale === "fr_FR") {
        if (/(?:^|[\s«“])(?:tu|ton|ta|tes)(?=$|[\s,.!?;:»”])/iu.test(value)) {
          failures.push(`fr_FR: informal address in ${source.msgid}`);
        }
        if (/\bplugin(?:s)?\b/iu.test(value)) failures.push(`fr_FR: use extension, not plugin, in ${source.msgid}`);
        if (/\bParamètres\b/u.test(value)) failures.push(`fr_FR: use Réglages in ${source.msgid}`);
      }
    }
  }
  for (const entryKey of catalog.keys()) {
    if (!pot.has(entryKey)) failures.push(`${locale}: obsolete catalog entry ${entryKey}`);
  }
  const mo = await stat(path.join(languages, `${domain}-${locale}.mo`)).catch(() => null);
  if (!mo || mo.size < 100) failures.push(`${locale}: missing or empty MO catalog`);
}

const sourceMap = JSON.parse(await readFile(path.join(languages, "source-map.json"), "utf8"));
const builtPath = sourceMap[`languages/source/${domain}.js`];
if (!builtPath) failures.push("source-map.json does not map the JavaScript extraction source");
else {
  const hash = createHash("md5").update(builtPath).digest("hex");
  const languageFiles = await readdir(languages);
  const sourceMessages = (await readFile(path.join(languages, "source", `${domain}.js`), "utf8"))
    .match(/wp\.i18n\.(?:__|_x|_n)\(/gu)?.length ?? 0;
  for (const locale of Object.keys(locales)) {
    const jsonPath = path.join(languages, `${domain}-${locale}-${hash}.json`);
    const hashCatalogs = languageFiles.filter((file) =>
      new RegExp(`^${domain}-${locale}-[a-f0-9]{32}\\.json$`, "u").test(file));
    if (hashCatalogs.length !== 1 || hashCatalogs[0] !== path.basename(jsonPath)) {
      failures.push(`${locale}: stale or missing built-script JSON catalogs`);
    }
    const json = JSON.parse(await readFile(jsonPath, "utf8").catch(() => "{}"));
    const messages = json.locale_data?.messages;
    if (!messages) failures.push(`${locale}: missing JavaScript translation JSON for ${builtPath}`);
    else if (Object.keys(messages).length - 1 !== sourceMessages) {
      failures.push(`${locale}: JavaScript JSON has ${Object.keys(messages).length - 1}/${sourceMessages} messages`);
    }
    const handlePath = path.join(languages, `${domain}-${locale}-yaxii-product-workspace-app.json`);
    const handleJson = await readFile(handlePath, "utf8").catch(() => "");
    const hashJson = await readFile(jsonPath, "utf8").catch(() => "");
    if (!handleJson || handleJson !== hashJson) {
      failures.push(`${locale}: stable script-handle JSON is missing or stale`);
    }
  }
}

if (failures.length) throw new Error(`Localization artifact violations:\n${failures.join("\n")}`);
process.stdout.write(`Validated ${pot.size} POT entries, ${Object.keys(locales).length} complete catalogs, placeholders, plurals, MO files, and JavaScript JSON.\n`);
