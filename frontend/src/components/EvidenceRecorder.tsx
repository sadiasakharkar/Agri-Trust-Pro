import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "../api/firebase";

export function EvidenceRecorder({ farmerId }: { farmerId: string }) {
  const [latitude, setLatitude] = useState(20.59);
  const [longitude, setLongitude] = useState(78.96);
  const [soilOrganicCarbon, setSoilOrganicCarbon] = useState(0.8);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const saveEvidence = async () => {
    try {
      await addDoc(collection(db, "evidence_uploads"), {
        farmerId,
        latitude,
        longitude,
        soilOrganicCarbon,
        note,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "audit_trail"), {
        farmerId,
        action: "evidence_created",
        latitude,
        longitude,
        createdAt: serverTimestamp(),
      });

      setStatus("Evidence saved.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to save evidence now.");
    }
  };

  return (
    <section className="card">
      <h3>Evidence Record</h3>
      <p className="small">Geo-tag + soil test entries for audit-ready MRV.</p>

      <p>Latitude</p>
      <input type="number" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} />

      <p>Longitude</p>
      <input type="number" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))} />

      <p>Soil organic carbon (%)</p>
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        value={soilOrganicCarbon}
        onChange={(e) => setSoilOrganicCarbon(Number(e.target.value))}
      />

      <p>Field note</p>
      <input value={note} onChange={(e) => setNote(e.target.value)} />

      <button className="secondary-button" type="button" onClick={saveEvidence}>
        Save Evidence
      </button>
      {status && <p className="small">{status}</p>}
    </section>
  );
}
