import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { I18nManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Locale, StringKey } from '@/constants/strings';

const LOCALE_KEY = '@asa_locale';
const DEFAULT_LOCALE: Locale = 'ar';

interface LanguageContextValue {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  isRTL: true,
  setLocale: async () => {},
  t: (key) => translations[DEFAULT_LOCALE][key] ?? key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Load persisted locale on mount
  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then((stored) => {
      if (stored === 'ar' || stored === 'en') {
        setLocaleState(stored);
        const wantRTL = stored === 'ar';
        if (I18nManager.isRTL !== wantRTL) {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(wantRTL);
        }
      }
    });
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    await AsyncStorage.setItem(LOCALE_KEY, newLocale);
    setLocaleState(newLocale);

    const wantRTL = newLocale === 'ar';
    if (I18nManager.isRTL !== wantRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(wantRTL);
      // Prompt user to restart for layout direction to take effect
      Alert.alert(
        newLocale === 'ar' ? 'تم تغيير اللغة' : 'Language Changed',
        newLocale === 'ar'
          ? 'أعد تشغيل التطبيق لتطبيق التغيير الكامل.'
          : 'Restart the app to fully apply the layout direction.',
      );
    }
  }, []);

  const t = useCallback(
    (key: StringKey): string => translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key,
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, isRTL: locale === 'ar', setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
