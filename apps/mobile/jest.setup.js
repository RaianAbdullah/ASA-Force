jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'en', isRTL: false, setLocale: jest.fn(),
    t: key => require('./constants/strings').translations.en[key] || key }),
}));
