import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translate, type LangCode } from './translations';

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  speechLang: string;
  dir: 'ltr' | 'rtl';
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANG_STORAGE_KEY = 'medimate_lang';

function loadLang(): LangCode {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored as LangCode;
  } catch {
    // Storage unavailable — default to English.
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LangCode>(loadLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore — the choice still applies for this session.
    }
  }, [lang]);

  const value = useMemo<LanguageContextValue>(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
    return {
      lang,
      setLang,
      speechLang: meta.speechLang,
      dir: meta.dir,
      t: (key, vars) => translate(key, lang, vars),
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
