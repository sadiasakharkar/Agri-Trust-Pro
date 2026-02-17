import { useMemo, useRef, useState } from "react";

interface VoiceResult {
  transcript: string;
  error?: string;
}

export function useVoiceAssistant(language: "en" | "hi" | "mr") {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const langMap = useMemo(
    () => ({
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
    }),
    [],
  );

  const startListening = (onResult: (result: VoiceResult) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onResult({ transcript: "", error: "Speech recognition not supported on this browser." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langMap[language];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => onResult({ transcript: "", error: "Voice input failed." });
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult({ transcript });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[language];
    window.speechSynthesis.speak(utterance);
  };

  return { startListening, stopListening, speak, isListening };
}
