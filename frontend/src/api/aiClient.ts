import type { FarmProfile, LanguageCode, MrvEstimateResponse, PracticeType, RecommendationItem } from "../types";
import { auth } from "./firebase";

const API_BASE = import.meta.env.VITE_AI_API_BASE || "http://localhost:8000/api/v1";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMrvEstimate(profile: FarmProfile, practices: PracticeType[]): Promise<MrvEstimateResponse> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/mrv/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      profile,
      practices,
      baseline_yield_ton_per_hectare: 2.2,
    }),
  });
  if (!response.ok) {
    throw new Error("MRV estimate failed");
  }
  return response.json() as Promise<MrvEstimateResponse>;
}

export async function fetchRecommendations(profile: FarmProfile, objective: "carbon" | "yield" | "cost" | "water") {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      profile,
      current_practices: [],
      objective,
    }),
  });
  if (!response.ok) {
    throw new Error("Recommendation request failed");
  }
  return (await response.json()) as { recommendations: RecommendationItem[]; advisory_note: string };
}

export async function parseVoiceIntent(transcript: string, language: LanguageCode) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/voice/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ transcript, language }),
  });

  if (!response.ok) {
    throw new Error("Voice intent parsing failed");
  }

  return response.json() as Promise<{ intent: string; confidence: number; response_text: string }>;
}
