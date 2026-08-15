/// <reference types="vite/client" />

interface WordPressMediaAttachment {
  alt?: string;
  id: number;
  url: string;
}

interface WordPressMediaFrame {
  on: (event: "select", callback: () => void) => void;
  open: () => void;
  state: () => { get: (name: "selection") => { toJSON: () => WordPressMediaAttachment[] } };
}

interface Window {
  wp?: {
    i18n?: {
      __: (text: string, domain: string) => string;
      _n: (single: string, plural: string, count: number, domain: string) => string;
      _x: (text: string, context: string, domain: string) => string;
      sprintf: (format: string, ...values: Array<string | number>) => string;
    };
    media?: (options: {
      button?: { text: string };
      library: { type: "image" };
      multiple: boolean;
      title?: string;
    }) => WordPressMediaFrame;
  };
}
