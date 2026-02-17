import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";

import { auth } from "./api/firebase";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

function AppShell() {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<"farmer" | "verifier" | "admin">("farmer");

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setIsAuthenticated(Boolean(user));
      if (!user) {
        setRole("farmer");
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const claimRole = String(tokenResult.claims.role || "farmer");
        if (claimRole === "admin" || claimRole === "verifier") {
          setRole(claimRole);
        } else {
          setRole("farmer");
        }
      } catch (error) {
        console.error(error);
        setRole("farmer");
      }
    });
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

      {isAuthenticated ? (
        <DashboardPage canReviewEvidence={role === "admin" || role === "verifier"} />
      ) : (
        <LoginPage onAuthenticated={() => setIsAuthenticated(true)} />
      )}
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
