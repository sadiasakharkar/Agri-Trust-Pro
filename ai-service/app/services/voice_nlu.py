from app.models.schemas import VoiceIntentRequest


def infer_intent(payload: VoiceIntentRequest) -> tuple[str, float, str]:
    transcript = payload.transcript.strip().lower()

    recommendation_keywords = ["recommend", "सलाह", "salah", "recommendation", "kya kare", "क्या करूं"]
    carbon_keywords = ["carbon", "कार्बन", "credit", "score", "co2", "sequestration"]

    if any(keyword in transcript for keyword in recommendation_keywords):
        return "get_recommendations", 0.87, "मैं आपकी खेती के लिए बेहतर कार्बन और उपज वाली सलाह तैयार कर रहा हूँ।"

    if any(keyword in transcript for keyword in carbon_keywords):
        return "get_carbon_score", 0.84, "मैं आपका अनुमानित कार्बन स्कोर निकाल रहा हूँ।"

    return "unknown", 0.45, "कृपया दोबारा बोलें। आप कार्बन स्कोर या खेती की सलाह पूछ सकते हैं।"
