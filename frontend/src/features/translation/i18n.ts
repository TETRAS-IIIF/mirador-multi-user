import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en/translation.json";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

import "dayjs/locale/en";
import "dayjs/locale/fr";
import "dayjs/locale/es";

dayjs.extend(localizedFormat);

const getDetectedLanguage = (): string => {
  const savedLanguage =
    typeof window !== "undefined"
      ? window.localStorage?.getItem("i18nextLng")
      : undefined;
  if (savedLanguage) {
    return savedLanguage;
  }

  const browserLanguage =
    typeof navigator !== "undefined"
      ? navigator.language?.split("-")[0]
      : undefined;
  return browserLanguage || "en";
};

// 🟢 Initialize i18next
i18n.use(initReactI18next).init({
  fallbackLng: "en",
  lng: getDetectedLanguage(),
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
  },
});

const loadLanguage = async (lng: string): Promise<void> => {
  if (!i18n.hasResourceBundle(lng, "translation")) {
    try {
      const translations = await import(`./${lng}/translation.json`);
      i18n.addResourceBundle(
        lng,
        "translation",
        translations.default || translations,
      );
    } catch (error) {
      console.error(`❌ Error loading translations for ${lng}:`, error);
    }
  }

  const availableLocales = ["en", "fr"];
  const localeToSet = availableLocales.includes(lng) ? lng : "en";

  dayjs.locale(localeToSet);
  console.log(`✅ Day.js locale set to: ${dayjs.locale()}`);

  await i18n.changeLanguage(lng);
};

const detectedLng = getDetectedLanguage();

loadLanguage(detectedLng);

export const availableLanguages = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export { loadLanguage };
export default i18n;
