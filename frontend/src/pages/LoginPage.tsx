import { useMemo, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

import { auth } from "../api/firebase";
import { useLanguage } from "../context/LanguageContext";

interface LoginPageProps {
  onAuthenticated: () => void;
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [error, setError] = useState("");

  const recaptchaId = useMemo(() => "recaptcha-container", []);

  const sendOtp = async () => {
    setError("");
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaId, { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(result);
    } catch (err) {
      setError("Could not send OTP. Check Firebase setup.");
      console.error(err);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    try {
      await confirmation.confirm(otp);
      onAuthenticated();
    } catch (err) {
      setError("OTP verification failed.");
      console.error(err);
    }
  };

  return (
    <main className="auth-layout">
      <section className="card auth-card">
        <h1>{t("login")}</h1>
        <label>
          {t("phone")}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button type="button" onClick={sendOtp} className="primary-button">
          {t("sendOtp")}
        </button>

        <label>
          OTP
          <input value={otp} onChange={(e) => setOtp(e.target.value)} />
        </label>
        <button type="button" onClick={verifyOtp} className="secondary-button">
          {t("verifyOtp")}
        </button>
        <div id={recaptchaId} />
        {error && <p className="error-text">{error}</p>}
      </section>
    </main>
  );
}
