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
        className="h-7 cursor-pointer rounded-md border border-transparent bg-transparent px-1.5 text-[11px] leading-tight text-muted-foreground/80 shadow-none transition-colors hover:bg-muted/30 hover:text-foreground/90 focus:outline-none focus-visible:border-border/30 focus-visible:ring-1 focus-visible:ring-ring/40 sm:h-7 sm:text-xs"
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
