import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import enUS from "./en-US.json";
import ptBR from "./pt-BR.json";

export type Language = "en-US" | "pt-BR";
export type Translations = typeof enUS;

const translations: Record<Language, Translations> = {
  "en-US": enUS,
  "pt-BR": ptBR,
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "app-language";

function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return path;
    }
  }
  return typeof result === "string" ? result : path;
}

export function resolveLanguage(selectedLanguage: string | null | undefined): Language {
  if (selectedLanguage === "pt-BR") {
    return "pt-BR";
  }
  return "en-US";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "pt-BR") return "pt-BR";
    }
    return "en-US";
  });

  const setLanguage = useCallback((lang: Language) => {
    const resolved = resolveLanguage(lang);
    setLanguageState(resolved);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, resolved);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[language], key);
    },
    [language]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const contextValue = { language, setLanguage, t };
  
  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return { language: context.language, setLanguage: context.setLanguage };
}
