import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { fetchMrvEstimate, fetchRecommendations, parseVoiceIntent } from "../api/aiClient";
import { db } from "../api/firebase";
import { MrvCard } from "../components/MrvCard";
import { RecommendationList } from "../components/RecommendationList";
import { EvidenceRecorder } from "../components/EvidenceRecorder";
import { INDIA_STATES } from "../constants/india";
import { useLanguage } from "../context/LanguageContext";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
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

type Objective = "carbon" | "yield" | "cost" | "water";

interface QueuedCall {
  label: "mrv_estimate" | "recommendations";
  payload: {
    profile: FarmProfile;
    practices?: PracticeType[];
    objective?: Objective;
  };
}

export function DashboardPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<FarmProfile>({ ...defaultProfile, language });
  const [mrv, setMrv] = useState<MrvEstimateResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [objective, setObjective] = useState<Objective>("carbon");
  const [voiceText, setVoiceText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const { items, enqueue, dequeue, isOnline } = useOfflineQueue();
  const { startListening, stopListening, isListening, speak } = useVoiceAssistant(language);

  const selectedPractices: PracticeType[] = useMemo(() => ["cover_crop", "reduced_till"], []);

  useEffect(() => {
    setProfile((prev) => ({ ...prev, language }));
  }, [language]);

  const persistMrv = async (result: MrvEstimateResponse) => {
    try {
      await addDoc(collection(db, "mrv_estimates"), {
        farmerId: profile.farmer_id,
        result,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      setStatusMessage("Cloud sync pending. Local result is available.");
    }
  };

  const onEstimate = async () => {
    try {
      const payload = { ...profile, language };
      const result = await fetchMrvEstimate(payload, selectedPractices);
      setMrv(result);
      setStatusMessage("Carbon estimate updated.");
      await persistMrv(result);
    } catch (error) {
      console.error(error);
      enqueue("mrv_estimate", { profile: { ...profile, language }, practices: selectedPractices });
      setStatusMessage("No internet or server issue. Estimate request queued.");
    }
  };

  const onRecommend = async () => {
    try {
      const result = await fetchRecommendations({ ...profile, language }, objective);
      setRecommendations(result.recommendations);
      setStatusMessage("Recommendations updated.");
    } catch (error) {
      console.error(error);
      enqueue("recommendations", { profile: { ...profile, language }, objective });
      setStatusMessage("No internet or server issue. Recommendation request queued.");
    }
  };

  const syncQueue = async () => {
    if (!isOnline || !items.length) return;

    for (const item of items) {
      try {
        const call = item as unknown as QueuedCall;
        if (call.label === "mrv_estimate") {
          const result = await fetchMrvEstimate(call.payload.profile, call.payload.practices ?? selectedPractices);
          setMrv(result);
          await persistMrv(result);
        }
        if (call.label === "recommendations") {
          const result = await fetchRecommendations(call.payload.profile, call.payload.objective ?? "carbon");
          setRecommendations(result.recommendations);
        }
        dequeue(item.id);
      } catch (error) {
        console.error(error);
      }
    }

    setStatusMessage("Queued actions synced.");
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
        <p className="small">Step 1: Select location and farm details</p>

        <p>State</p>
        <select value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
          {INDIA_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <p>District</p>
        <input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} />

        <p>Farm size (ha)</p>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={profile.farm_size_hectares}
          onChange={(e) => setProfile({ ...profile, farm_size_hectares: Number(e.target.value) })}
        />

        <p>Step 2: Choose your objective</p>
        <select value={objective} onChange={(e) => setObjective(e.target.value as Objective)}>
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

        <p className="small">Step 3: Voice help (works best in quiet place)</p>
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

        <div className="sync-row">
          <span className={isOnline ? "status-chip online" : "status-chip offline"}>
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="status-chip">Queued: {items.length}</span>
          <button className="secondary-button" type="button" onClick={syncQueue} disabled={!isOnline || !items.length}>
            Sync Pending
          </button>
        </div>

        {voiceText && <p className="small">Heard: {voiceText}</p>}
        {statusMessage && <p className="small">{statusMessage}</p>}
      </section>

      <MrvCard result={mrv} />
      <RecommendationList items={recommendations} />
      <EvidenceRecorder farmerId={profile.farmer_id} />
    </main>
  );
}
