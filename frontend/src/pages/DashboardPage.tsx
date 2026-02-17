import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { fetchMrvEstimate, fetchRecommendations, parseVoiceIntent } from "../api/aiClient";
import { db } from "../api/firebase";
import { MrvCard } from "../components/MrvCard";
import { RecommendationList } from "../components/RecommendationList";
import { useLanguage } from "../context/LanguageContext";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";
import type { FarmProfile, MrvEstimateResponse, PracticeType, RecommendationItem } from "../types";

const defaultProfile: FarmProfile = {
  farmer_id: "demo-farmer",
  state: "Maharashtra",
  district: "Nashik",
  village: "Demo",
  farm_size_hectares: 2,
  crop: "millets",
  irrigation_type: "rainfed",
  soil_organic_carbon_pct: 0.8,
  language: "hi",
};

export function DashboardPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<FarmProfile>({ ...defaultProfile, language });
  const [mrv, setMrv] = useState<MrvEstimateResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [objective, setObjective] = useState<"carbon" | "yield" | "cost" | "water">("carbon");
  const [voiceText, setVoiceText] = useState("");

  const { startListening, stopListening, isListening, speak } = useVoiceAssistant(language);

  const selectedPractices: PracticeType[] = ["cover_crop", "reduced_till"];

  useEffect(() => {
    setProfile((prev) => ({ ...prev, language }));
  }, [language]);

  const onEstimate = async () => {
    const result = await fetchMrvEstimate({ ...profile, language }, selectedPractices);
    setMrv(result);

    await addDoc(collection(db, "mrv_estimates"), {
      farmerId: profile.farmer_id,
      result,
      createdAt: serverTimestamp(),
    });
  };

  const onRecommend = async () => {
    const result = await fetchRecommendations({ ...profile, language }, objective);
    setRecommendations(result.recommendations);
  };

  const onVoiceStart = () => {
    startListening(async ({ transcript, error }) => {
      if (error) {
        speak(error);
        return;
      }
      try {
        setVoiceText(transcript);
        const parsed = await parseVoiceIntent(transcript, language);
        speak(parsed.response_text);
      } catch (voiceError) {
        console.error(voiceError);
        speak("Voice processing failed. कृपया दोबारा प्रयास करें।");
      }
    });
  };

  return (
    <main className="dashboard-layout">
      <section className="hero-card">
        <h2>{t("dashboard")}</h2>
        <p>State</p>
        <input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
        <p>District</p>
        <input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} />
        <p>{t("objective")}</p>
        <select value={objective} onChange={(e) => setObjective(e.target.value as "carbon" | "yield" | "cost" | "water") }>
          <option value="carbon">Carbon</option>
          <option value="yield">Yield</option>
          <option value="cost">Cost</option>
          <option value="water">Water</option>
        </select>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={onEstimate}>
            {t("estimateCarbon")}
          </button>
          <button className="secondary-button" type="button" onClick={onRecommend}>
            {t("getAdvice")}
          </button>
        </div>
        <div className="button-row">
          <button className="voice-button" type="button" onClick={onVoiceStart}>
            {isListening ? t("stop") : t("listen")}
          </button>
          {isListening && (
            <button className="secondary-button" type="button" onClick={stopListening}>
              {t("stop")}
            </button>
          )}
        </div>
        {voiceText && <p className="small">Heard: {voiceText}</p>}
      </section>

      <MrvCard result={mrv} />
      <RecommendationList items={recommendations} />
    </main>
  );
}
