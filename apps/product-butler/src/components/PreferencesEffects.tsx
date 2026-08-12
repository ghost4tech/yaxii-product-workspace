import { useEffect } from 'react';
import { usePrefsStore, ACCENTS } from '@/stores/prefsStore';

/** Applies user preferences (theme, density, accent, motion) to the document root. */
export function PreferencesEffects() {
  const { theme, density, accent, reduceMotion } = usePrefsStore((s) => s.prefs);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark =
        theme === 'dark' ||
        (theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', density);
    root.setAttribute('data-reduce-motion', String(reduceMotion));
  }, [density, reduceMotion]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent === 'graphite') {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--brand');
      return;
    }
    root.style.setProperty('--primary', ACCENTS[accent].hsl);
    root.style.setProperty('--ring', ACCENTS[accent].hsl);
    root.style.setProperty('--brand', ACCENTS[accent].hsl);
  }, [accent]);

  return null;
}
