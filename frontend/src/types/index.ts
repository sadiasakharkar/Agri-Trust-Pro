export type LanguageCode = "en" | "hi" | "mr";

export type PracticeType =
  | "no_till"
  | "reduced_till"
  | "cover_crop"
  | "drip_irrigation"
  | "organic_compost"
  | "agroforestry"
  | "biochar"
  | "residue_retention";

export interface FarmProfile {
  farmer_id: string;
  state: string;
  district: string;
  village?: string;
  farm_size_hectares: number;
  crop: "wheat" | "rice" | "cotton" | "sugarcane" | "pulses" | "millets" | "other";
  irrigation_type: "rainfed" | "flood" | "drip" | "sprinkler";
  soil_organic_carbon_pct: number;
  language: LanguageCode;
}

export interface MrvEstimateResponse {
  estimated_annual_co2e_tons: number;
  confidence_score: number;
  mrv_method: string;
  model_version: string;
  explanation: string;
}

export interface RecommendationItem {
  practice: PracticeType;
  impact_score: number;
  rationale: string;
  estimated_cost_inr_per_hectare: number;
}
