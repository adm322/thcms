"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "ms";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, ms?: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "en", setLang: () => {}, t: (en) => en,
});

export function useLang() {
  return useContext(LangContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("trainhub-lang");
    if (stored === "ms") setLang("ms");
  }, []);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem("trainhub-lang", l);
  }

  function t(en: string, ms?: string): string {
    if (lang === "ms" && ms) return ms;
    return en;
  }

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
