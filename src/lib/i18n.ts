'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { en } from '@/locales/en';
import { it } from '@/locales/it';

type Language = 'en' | 'it';

const translations = { en, it };

type TranslationContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof en;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('it');

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  const t = useMemo(() => translations[language], [language]);

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t,
  };

  return React.createElement(TranslationContext.Provider, { value: value }, children);
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};