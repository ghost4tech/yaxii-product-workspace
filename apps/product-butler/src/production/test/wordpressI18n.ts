type TranslationMap = Record<string, string>;

function interpolate(format: string, values: Array<string | number>): string {
  let nextValue = 0;
  return format.replace(/%(?:(\d+)\$)?[ds]/g, (_match, position?: string) => {
    const index = position ? Number(position) - 1 : nextValue++;
    return String(values[index] ?? "");
  });
}

export function installWordPressI18n(translations: TranslationMap): () => void {
  const previous = window.wp;
  window.wp = {
    ...previous,
    i18n: {
      __: (text) => translations[text] ?? text,
      _n: (single, plural, count) => translations[count === 1 ? single : plural] ?? (count === 1 ? single : plural),
      _x: (text, context) => translations[`${context}\u0004${text}`] ?? translations[text] ?? text,
      sprintf: (format, ...values) => interpolate(format, values),
    },
  };
  return () => { window.wp = previous; };
}
