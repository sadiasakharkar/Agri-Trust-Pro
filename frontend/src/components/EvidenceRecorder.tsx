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

      setStatus("Evidence saved for verification.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to save evidence now.");
    }
  };

  return (
    <section className="card">
      <p className="eyebrow">Evidence</p>
      <h3>Field Evidence Record</h3>
      <p className="small">Add geo-coordinates and soil details to support MRV audits.</p>

      <div className="form-grid compact-grid">
        <div className="form-block">
          <label className="field-label" htmlFor="latitude">
            Latitude
          </label>
          <input id="latitude" type="number" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} />
        </div>

        <div className="form-block">
          <label className="field-label" htmlFor="longitude">
            Longitude
          </label>
          <input id="longitude" type="number" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))} />
        </div>
      </div>

      <label className="field-label" htmlFor="soil-carbon">
        Soil Organic Carbon (%)
      </label>
      <input
        id="soil-carbon"
        type="number"
        min={0}
        max={10}
        step={0.1}
        value={soilOrganicCarbon}
        onChange={(e) => setSoilOrganicCarbon(Number(e.target.value))}
      />

      <label className="field-label" htmlFor="field-note">
        Field Note
      </label>
      <input id="field-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Crop stage, irrigation, residue status" />

      <button className="secondary-button" type="button" onClick={saveEvidence}>
        Save Evidence
      </button>
      {status && <p className="status-inline">{status}</p>}
    </section>
  );
}
