import {
  createContext,
  useContext,
  createSignal,
  createMemo,
  ParentComponent,
} from 'solid-js';
import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import type { Locale } from './types';

// Flatten nested translation object
function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, newKey));
    }
  }

  return result;
}

// Simple template resolver
function resolveTemplate(
  template: string,
  args?: Record<string, string | number>
): string {
  if (!args) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = args[key];
    return value !== undefined ? String(value) : match;
  });
}

const dictionaries = {
  en: flattenTranslations(en as unknown as Record<string, unknown>),
  'zh-CN': flattenTranslations(zhCN as unknown as Record<string, unknown>),
};

interface I18nContextValue {
  locale: () => Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>();

export const I18nProvider: ParentComponent = (props) => {
  const [locale, setLocaleState] = createSignal<Locale>('zh-CN');

  const dict = createMemo(() => dictionaries[locale()]);

  const t = (key: string, args?: Record<string, string | number>): string => {
    const template = dict()[key] ?? key;
    return resolveTemplate(template, args);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale: setLocaleState,
        t,
      }}
    >
      {props.children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
