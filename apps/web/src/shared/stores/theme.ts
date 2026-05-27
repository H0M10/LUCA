import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const STORAGE_KEY = 'luca:theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

const initial = getInitialTheme();
applyTheme(initial);

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const t = (window.localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    if (t === 'system') applyTheme('system');
  });
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initial,
  setTheme: (t) => {
    window.localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    set({ theme: t });
  },
}));
