import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en/translation.json";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

import "dayjs/locale/en";
import "dayjs/locale/fr";
import "dayjs/locale/es";

dayjs.extend(localizedFormat);

// 🟢 Initialize i18next
i18n.use(initReactI18next).init({
  fallbackLng: "en",
  lng:
    localStorage.getItem("i18nextLng") ||
    navigator.language.split("-")[0] ||
    "en",
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

  const availableLocales = ["en", "fr", "es"];
  const localeToSet = availableLocales.includes(lng) ? lng : "en";

  dayjs.locale(localeToSet);
  console.log(`✅ Day.js locale set to: ${dayjs.locale()}`);

  await i18n.changeLanguage(lng);
};

const detectedLng =
  localStorage.getItem("i18nextLng") ||
  navigator.language.split("-")[0] ||
  "en";

loadLanguage(detectedLng);

export const availableLanguages = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export { loadLanguage };
export default i18n;
