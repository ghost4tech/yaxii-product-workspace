const ENGLISH_MESSAGES = {
  brandName: "Yaxii Product Workspace",
  commandMenu: "Command menu",
  comfortable: "Comfortable",
  compact: "Compact",
  density: "Density",
  developmentFixture: "Development fixture",
  direction: "Direction",
  entry: "Entry",
  extended: "Extended",
  focusMode: "Focus Mode",
  keyboardShortcuts: "Keyboard shortcuts",
  light: "Light",
  dark: "Dark",
  locale: "Locale",
  localeSample: "Locale preview",
  openCommands: "Open commands",
  preferences: "Preferences",
  reducedMotion: "Reduced motion",
  system: "System",
  theme: "Theme",
} as const;

const LOCALIZED_SAMPLES: Record<string, string> = {
  ar: "معاينة اللغة",
  fr: "Aperçu de la langue",
};

export type MessageKey = keyof typeof ENGLISH_MESSAGES;
export type Translate = (key: MessageKey) => string;

function languageFromLocale(locale: string): string {
  return locale.replace("_", "-").split("-")[0]?.toLowerCase() ?? "en";
}

export function createTranslator(locale: string): Translate {
  const language = languageFromLocale(locale);

  return (key) => {
    if (key === "localeSample") {
      return LOCALIZED_SAMPLES[language] ?? ENGLISH_MESSAGES.localeSample;
    }

    return ENGLISH_MESSAGES[key];
  };
}
