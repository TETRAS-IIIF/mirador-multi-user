import i18n from "i18next";

export const loadLanguage = async (lng: string): Promise<void> => {
  if (!i18n.hasResourceBundle(lng, "translation")) {
    try {
      const translations = await import(`./${lng}/translation.json`);
      i18n.addResourceBundle(
        lng,
        "translation",
        translations.default || translations,
      );
    } catch (error) {
      console.error(`Error loading translations for ${lng}:`, error);
    }
  }
  await i18n.changeLanguage(lng);
};
