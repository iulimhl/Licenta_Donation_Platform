import { createContext, useContext, useMemo, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    localStorage.getItem("language") || "en"
  );

  function setLanguage(nextLanguage) {
    const supportedLanguage = translations[nextLanguage] ? nextLanguage : "en";
    localStorage.setItem("language", supportedLanguage);
    setLanguageState(supportedLanguage);
  }

  function t(path) {
    return path.split(".").reduce(
      (current, key) => current?.[key],
      translations[language]
    ) || path;
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
