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
    media?: (options: {
      button?: { text: string };
      library: { type: "image" };
      multiple: boolean;
      title?: string;
    }) => WordPressMediaFrame;
  };
}
