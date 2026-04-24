import { createContext, useContext, useEffect, useState } from 'react';
import ru from '../i18n/ru';
import ky from '../i18n/ky';
import en from '../i18n/en';

const DICTIONARIES = { ru, ky, en };

export const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'ky', label: 'KG' },
  { code: 'en', label: 'EN' },
];

const I18nContext = createContext(null);

function getInitialLang() {
  const saved = localStorage.getItem('lang');
  if (saved && DICTIONARIES[saved]) return saved;
  return 'ru';
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  function t(key) {
    const dict = DICTIONARIES[lang] || ru;
    return dict[key] || key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
