import type { RecommendationItem } from "../types";

export function RecommendationList({ items }: { items: RecommendationItem[] }) {
  if (!items.length) {
    return <div className="card muted">No recommendations yet.</div>;
  }

  return (
    <div className="card">
      <h3>Recommended Next Steps</h3>
      <ul className="recommendation-list">
        {items.map((item) => (
          <li key={item.practice}>
            <strong>{item.practice.replace(/_/g, " ")}</strong>
            <p>{item.rationale}</p>
            <span>Impact: {item.impact_score} | Cost: INR {item.estimated_cost_inr_per_hectare}/ha</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
