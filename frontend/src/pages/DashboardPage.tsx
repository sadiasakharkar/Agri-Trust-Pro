import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { fetchMrvEstimate, fetchRecommendations, parseVoiceIntent } from "../api/aiClient";
import { db } from "../api/firebase";
import { EvidenceRecorder } from "../components/EvidenceRecorder";
import { MrvCard } from "../components/MrvCard";
import { RecommendationList } from "../components/RecommendationList";
import { VerifierQueue } from "../components/VerifierQueue";
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

const objectives: Objective[] = ["carbon", "yield", "cost", "water"];

export function DashboardPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<FarmProfile>({ ...defaultProfile, language });
  const [mrv, setMrv] = useState<MrvEstimateResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [objective, setObjective] = useState<Objective>("carbon");
  const [voiceText, setVoiceText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const { items, enqueue, bumpRetry, dequeue, isOnline } = useOfflineQueue();
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
      setStatusMessage("Carbon estimate updated successfully.");
      await persistMrv(result);
    } catch (error) {
      console.error(error);
      enqueue("mrv_estimate", { profile: { ...profile, language }, practices: selectedPractices });
      setStatusMessage("Network issue detected. Carbon request is queued.");
    }
  };

  const onRecommend = async () => {
    try {
      const result = await fetchRecommendations({ ...profile, language }, objective);
      setRecommendations(result.recommendations);
      setStatusMessage("Recommendations are ready.");
    } catch (error) {
      console.error(error);
      enqueue("recommendations", { profile: { ...profile, language }, objective });
      setStatusMessage("Network issue detected. Recommendation request is queued.");
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
        bumpRetry(item.id);
      }
    }

    setStatusMessage("Pending actions synced.");
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
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Farmer Workspace</p>
            <h2>{t("dashboard")}</h2>
          </div>
          <span className={isOnline ? "status-chip online" : "status-chip offline"}>{isOnline ? "Online" : "Offline"}</span>
        </div>

        <div className="form-grid">
          <div className="form-block">
            <label className="field-label" htmlFor="state">
              State
            </label>
            <select id="state" value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
              {INDIA_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="form-block">
            <label className="field-label" htmlFor="district">
              District
            </label>
            <input id="district" value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} />
          </div>

          <div className="form-block">
            <label className="field-label" htmlFor="farm-size">
              Farm Size (ha)
            </label>
            <input
              id="farm-size"
              type="number"
              min={0.1}
              step={0.1}
              value={profile.farm_size_hectares}
              onChange={(e) => setProfile({ ...profile, farm_size_hectares: Number(e.target.value) })}
            />
          </div>
        </div>

        <p className="field-label">Main Goal</p>
        <div className="segmented-row">
          {objectives.map((item) => (
            <button
              key={item}
              type="button"
              className={objective === item ? "segment active" : "segment"}
              onClick={() => setObjective(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={onEstimate}>
            {t("estimateCarbon")}
          </button>
          <button className="secondary-button" type="button" onClick={onRecommend}>
            {t("getAdvice")}
          </button>
        </div>

        <div className="voice-panel">
          <p className="small">Need help? Speak naturally and get guided support.</p>
          <div className="button-row compact">
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
        </div>

        <div className="sync-row">
          <span className="status-chip">Queued: {items.length}</span>
          <span className="status-chip">Retries: {items.reduce((sum, item) => sum + item.retryCount, 0)}</span>
          <button className="secondary-button" type="button" onClick={syncQueue} disabled={!isOnline || !items.length}>
            Sync Pending
          </button>
        </div>

        {statusMessage && <p className="status-inline">{statusMessage}</p>}
      </section>

      <section className="content-grid">
        <MrvCard result={mrv} />
        <RecommendationList items={recommendations} />
        <EvidenceRecorder farmerId={profile.farmer_id} />
        <VerifierQueue />
      </section>
    </main>
  );
}
