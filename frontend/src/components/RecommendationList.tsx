import type { RecommendationItem } from "../types";

const formatPractice = (practice: string) =>
  practice
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

export function RecommendationList({ items }: { items: RecommendationItem[] }) {
  if (!items.length) {
    return (
      <article className="card muted">
        <p className="eyebrow">Recommendations</p>
        <h3>Advice Pending</h3>
        <p className="small">Choose an objective and request recommendations.</p>
      </article>
    );
  }

  return (
    <article className="card">
      <p className="eyebrow">Recommendations</p>
      <h3>Suggested Next Steps</h3>
      <ul className="recommendation-list">
        {items.map((item) => (
          <li key={item.practice}>
            <div className="data-row">
              <strong>{formatPractice(item.practice)}</strong>
              <span className="impact-pill">Impact {item.impact_score}</span>
            </div>
            <p>{item.rationale}</p>
            <span className="small">Estimated cost: INR {item.estimated_cost_inr_per_hectare} per hectare</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
