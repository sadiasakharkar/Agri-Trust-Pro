import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../api/firebase";

interface EvidenceItem {
  id: string;
  farmerId: string;
  latitude: number;
  longitude: number;
  soilOrganicCarbon: number;
  note: string;
  reviewStatus?: "pending" | "approved" | "rejected";
}

export function VerifierQueue() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [status, setStatus] = useState("");

  const loadQueue = async () => {
    try {
      const q = query(collection(db, "evidence_uploads"), orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EvidenceItem, "id">) }));
      setItems(rows);
    } catch (error) {
      console.error(error);
      setStatus("Could not load verifier queue.");
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const review = async (item: EvidenceItem, decision: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "evidence_uploads", item.id), {
        reviewStatus: decision,
        reviewedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "verification_reviews"), {
        evidenceId: item.id,
        farmerId: item.farmerId,
        decision,
        reviewedAt: serverTimestamp(),
      });

      setStatus(`Evidence ${decision}.`);
      await loadQueue();
    } catch (error) {
      console.error(error);
      setStatus("Review action failed.");
    }
  };

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Verifier Desk</p>
          <h3>Evidence Review Queue</h3>
        </div>
        <button className="secondary-button" type="button" onClick={() => void loadQueue()}>
          Refresh
        </button>
      </div>

      {!items.length && <p className="small">No evidence records available.</p>}

      {items.map((item) => (
        <div key={item.id} className="queue-item">
          <div className="data-row">
            <strong>{item.farmerId}</strong>
            <span className="status-chip">{item.reviewStatus || "pending"}</span>
          </div>
          <p className="small">Coordinates: {item.latitude}, {item.longitude}</p>
          <p className="small">Soil C: {item.soilOrganicCarbon}%</p>
          <p className="small">{item.note || "No note provided"}</p>
          <div className="button-row compact">
            <button className="secondary-button" type="button" onClick={() => review(item, "approved")}>
              Approve
            </button>
            <button className="voice-button" type="button" onClick={() => review(item, "rejected")}>
              Reject
            </button>
          </div>
        </div>
      ))}

      {status && <p className="status-inline">{status}</p>}
    </section>
  );
}
