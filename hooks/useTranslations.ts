
import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

const TRANSLATIONS = { en, bn };

export function useTranslations() {
  const { language } = useSettings();
  const langCode = language === 'bn' ? 'bn' : 'en';
  const currentTranslations = (TRANSLATIONS as any)[langCode] || TRANSLATIONS.en;

  // FIX: Enhanced t function to support interpolation via an optional options object
  const t = useCallback((key: string, arg2?: string | Record<string, any>, arg3?: Record<string, any>): string => {
    const defaultValue = typeof arg2 === 'string' ? arg2 : undefined;
    const options = (typeof arg2 === 'object' ? arg2 : arg3) as Record<string, any> | undefined;

    let translation = currentTranslations[key] || (TRANSLATIONS.en as any)[key] || defaultValue || key;

    if (options) {
      Object.keys(options).forEach((k) => {
        const val = options[k];
        translation = translation.split(`{${k}}`).join(String(val));
      });
    }

    return translation;
  }, [currentTranslations]);

  return { t, currentLanguage: langCode };
}
