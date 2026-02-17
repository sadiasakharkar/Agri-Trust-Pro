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
  const [status, setStatus] = useState("");

  const recaptchaId = useMemo(() => "recaptcha-container", []);

  const sendOtp = async () => {
    setError("");
    setStatus("");
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaId, { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(result);
      setStatus("OTP sent successfully. Please enter the code.");
    } catch (err) {
      setError("Could not send OTP. Check Firebase setup.");
      console.error(err);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    setError("");
    setStatus("");
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
        <p className="eyebrow">Secure Sign In</p>
        <h2>{t("login")}</h2>
        <p className="small">Use your registered mobile number for easy, secure access.</p>

        <label className="field-label" htmlFor="phone-input">
          {t("phone")}
        </label>
        <input id="phone-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />

        <button type="button" onClick={sendOtp} className="primary-button full-width">
          {t("sendOtp")}
        </button>

        <label className="field-label" htmlFor="otp-input">
          OTP
        </label>
        <input id="otp-input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />

        <button type="button" onClick={verifyOtp} className="secondary-button full-width">
          {t("verifyOtp")}
        </button>

        <div id={recaptchaId} />
        {status && <p className="status-inline">{status}</p>}
        {error && <p className="error-text">{error}</p>}
      </section>
    </main>
  );
}
