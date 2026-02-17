import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

const AI_BASE = process.env.AI_SERVICE_BASE_URL || "http://localhost:8000/api/v1";
const VISHNU_SECRET = process.env.VISHNU_WEBHOOK_SECRET || "dev-secret";

export const vishnuWebhook = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send({ error: "Method not allowed" });
    return;
  }

  try {
    const upstream = await fetch(`${AI_BASE}/integrations/vishnu/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vishnu-secret": VISHNU_SECRET,
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();

    await db.collection("voice_sessions").doc(data.session_id).set(
      {
        lastIntent: data.intent,
        lastReply: data.reply,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    res.status(200).send(data);
  } catch (error) {
    logger.error("vishnuWebhook failed", error as Error);
    res.status(500).send({ error: "Voice integration failed" });
  }
});
