import type { MrvEstimateResponse } from "../types";

export function MrvCard({ result }: { result: MrvEstimateResponse | null }) {
  if (!result) {
    return (
      <div className="card muted">
        <p>No carbon estimate yet.</p>
      </div>
    );
  }

  return (
    <div className="card success">
      <h3>Estimated Annual Carbon</h3>
      <p className="metric">{result.estimated_annual_co2e_tons} tCO2e</p>
      <p>Confidence: {(result.confidence_score * 100).toFixed(0)}%</p>
      <p className="small">{result.explanation}</p>
    </div>
  );
}
