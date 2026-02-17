import { useLanguage } from "../context/LanguageContext";
import type { LanguageCode } from "../types";

const options: { key: LanguageCode; label: string }[] = [
  { key: "hi", label: "हिंदी" },
  { key: "mr", label: "मराठी" },
  { key: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="pill-row" aria-label="Language switcher">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={language === option.key ? "pill active" : "pill"}
          onClick={() => setLanguage(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
