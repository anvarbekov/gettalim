"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate, type Lang, type TKey } from "@/lib/i18n";
import { getStoredLang, setStoredLang } from "@/lib/storage";

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "uz",
  setLang: () => {},
  t: (key) => translate("uz", key),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const stored = getStoredLang();
    if (stored === "uz" || stored === "ru" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setStoredLang(next);
    if (typeof document !== "undefined") document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
