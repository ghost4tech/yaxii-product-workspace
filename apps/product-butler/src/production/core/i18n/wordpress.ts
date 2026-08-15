export const TEXT_DOMAIN = "yaxii-product-workspace";

interface WordPressI18n {
  __: (text: string, domain: string) => string;
  _n: (single: string, plural: string, count: number, domain: string) => string;
  _x: (text: string, context: string, domain: string) => string;
  sprintf: (format: string, ...values: Array<string | number>) => string;
}

function i18n(): WordPressI18n | undefined {
  return window.wp?.i18n;
}

export function __(text: string, domain = TEXT_DOMAIN): string {
  return i18n()?.__(text, domain) ?? text;
}

export function _x(text: string, context: string, domain = TEXT_DOMAIN): string {
  return i18n()?._x(text, context, domain) ?? text;
}

export function _n(single: string, plural: string, count: number, domain = TEXT_DOMAIN): string {
  return i18n()?._n(single, plural, count, domain) ?? (count === 1 ? single : plural);
}

export function sprintf(format: string, ...values: Array<string | number>): string {
  const wordpressI18n = i18n();
  if (wordpressI18n) {
    return wordpressI18n.sprintf(format, ...values);
  }

  let nextValue = 0;
  return format.replace(/%(?:(\d+)\$)?[ds]/g, (_match, position?: string) => {
    const index = position ? Number(position) - 1 : nextValue++;
    return String(values[index] ?? "");
  });
}
