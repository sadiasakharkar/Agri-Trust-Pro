import type { MrvEstimateResponse } from "../types";

export function MrvCard({ result }: { result: MrvEstimateResponse | null }) {
  if (!result) {
    return (
      <article className="card muted">
        <p className="eyebrow">Carbon Score</p>
        <h3>Estimate Pending</h3>
        <p className="small">Run a carbon estimate to see annual impact and confidence.</p>
      </article>
    );
  }

  return (
    <article className="card success">
      <p className="eyebrow">Carbon Score</p>
      <h3>Estimated Annual Carbon</h3>
      <p className="metric">{result.estimated_annual_co2e_tons} tCO2e</p>
      <div className="data-row">
        <span>Confidence</span>
        <strong>{(result.confidence_score * 100).toFixed(0)}%</strong>
      </div>
      <div className="data-row">
        <span>Model</span>
        <strong>{result.model_version}</strong>
      </div>
      <p className="small">{result.explanation}</p>
    </article>
  );
}
