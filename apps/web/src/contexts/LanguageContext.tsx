import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { arabicToEnglish, type Locale } from '@/i18n/translations';

const STORAGE_KEY = 'asa-force-locale';
const englishToArabic = Object.fromEntries(
  Object.entries(arabicToEnglish).map(([arabic, english]) => [english, arabic]),
);

const arabicEntries = Object.entries(arabicToEnglish).sort(
  ([a], [b]) => b.length - a.length,
);
const englishEntries = Object.entries(englishToArabic).sort(
  ([a], [b]) => b.length - a.length,
);

function replaceKeepingWhitespace(value: string, translated: string) {
  const start = value.match(/^\s*/)?.[0] ?? '';
  const end = value.match(/\s*$/)?.[0] ?? '';
  return `${start}${translated}${end}`;
}

export function translateText(value: string, locale: Locale): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact = locale === 'en'
    ? arabicToEnglish[trimmed]
    : englishToArabic[trimmed];
  if (exact) return replaceKeepingWhitespace(value, exact);

  const entries = locale === 'en' ? arabicEntries : englishEntries;
  let result = value;
  for (const [source, target] of entries) {
    if (source.length >= 4 && result.includes(source)) {
      result = result.split(source).join(target);
    }
  }

  if (locale === 'en') {
    result = result
      .replace(/إعادة الإرسال بعد\s+(\d+)\s+ثانية/g, 'Resend in $1 seconds')
      .replace(/عدد الموظفين:\s*(\d+)/g, 'Employees: $1')
      .replace(/أسبوع:\s*/g, 'Week: ')
      .replace(/المدير:\s*/g, 'Manager: ')
      .replace(/الوردية:\s*/g, 'Shift: ')
      .replace(/أيام العمل:\s*/g, 'Work days: ')
      .replace(/ملاحظات الإدارة:\s*/g, 'Administration notes: ');
  }
  return result;
}

function localizeElement(root: ParentNode, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    if (node.parentElement?.closest('script, style')) continue;
    const translated = translateText(node.data, locale);
    if (translated !== node.data) node.data = translated;
  }

  const elements = root instanceof Element
    ? [root, ...root.querySelectorAll<HTMLElement>('*')]
    : [...root.querySelectorAll<HTMLElement>('*')];
  for (const element of elements) {
    for (const attribute of ['placeholder', 'title', 'aria-label'] as const) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const translated = translateText(value, locale);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }
}

interface LanguageContextValue {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (arabic: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ar';
  });

  const setLocale = useCallback((nextLocale: Locale) => {
    localStorage.setItem(STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  const t = useCallback(
    (arabic: string) => translateText(arabic, locale),
    [locale],
  );

  useEffect(() => {
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    localizeElement(document.body, locale);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.parentNode) {
          localizeElement(mutation.target.parentNode, locale);
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            localizeElement(node as Element, locale);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
            localizeElement(node.parentNode, locale);
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    isRTL: locale === 'ar',
    setLocale,
    toggleLocale,
    t,
  }), [locale, setLocale, toggleLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
