import { useI18n } from "@/i18n";

type LanguageSelectorProps = {
  className?: string;
};

const LanguageSelector = ({ className }: LanguageSelectorProps) => {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={className}>
      <span className="sr-only">{t("nav.language")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as "es" | "ca" | "en" | "eu")}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
      >
        <option value="es">{t("lang.es")}</option>
        <option value="ca">{t("lang.ca")}</option>
        <option value="en">{t("lang.en")}</option>
        <option value="eu">{t("lang.eu")}</option>
      </select>
    </label>
  );
};

export default LanguageSelector;
