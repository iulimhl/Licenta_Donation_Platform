import { useCallback, useMemo, useState } from "react";
import { LanguageContext } from "./useLanguage";
import { translations } from "./translations";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    localStorage.getItem("language") || "en"
  );

  const setLanguage = useCallback((nextLanguage) => {
    const supportedLanguage = translations[nextLanguage] ? nextLanguage : "en";
    localStorage.setItem("language", supportedLanguage);
    setLanguageState(supportedLanguage);
  }, []);

  const t = useCallback((path) => {
    return path.split(".").reduce(
      (current, key) => current?.[key],
      translations[language]
    ) || path;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
