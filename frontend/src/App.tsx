import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./api/firebase";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

function AppShell() {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setIsAuthenticated(Boolean(user)));
    return () => unsubscribe();
  }, []);

  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Agri-Trust Platform</p>
          <h1>{t("appTitle")}</h1>
          <p className="subtitle">{t("tagline")}</p>
        </div>
        <div className="topbar-controls">
          <LanguageSwitcher />
        </div>
      </header>

      {isAuthenticated ? <DashboardPage /> : <LoginPage onAuthenticated={() => setIsAuthenticated(true)} />}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
