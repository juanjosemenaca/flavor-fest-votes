import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { ArrowLeft, FileText } from "lucide-react";

/** Dirección para el mapa (Google Maps) */
const MAP_ADDRESS_QUERY = "Carrer de Martí 136, 08024 Barcelona, Spain";

function GoogleMapsPreview() {
  const { t } = useI18n();
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_ADDRESS_QUERY)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_ADDRESS_QUERY)}&output=embed&z=16`;

  return (
    <div className="mt-[32rem] space-y-1.5 sm:mt-[36rem]">
      <div className="relative mx-auto max-w-[280px] overflow-hidden rounded-lg border border-border bg-muted shadow-sm sm:max-w-[320px]">
        <iframe
          title={t("bases.mapAriaLabel")}
          src={embedUrl}
          className="pointer-events-none h-[130px] w-full sm:h-[140px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/0 transition-colors hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          aria-label={t("bases.mapAriaLabel")}
        >
          <span className="sr-only">{t("bases.mapAriaLabel")}</span>
        </a>
      </div>
      <p className="text-center text-xs text-muted-foreground">{t("bases.mapHintClick")}</p>
    </div>
  );
}

const emphasisClass = "font-bold text-lg sm:text-xl text-foreground";

const categoryLabelClass = "font-bold uppercase text-foreground";

const BASES_S4_CATEGORY_ROWS = [
  { name: "bases.s4.c1.name", desc: "bases.s4.c1.desc" },
  { name: "bases.s4.c2.name", desc: "bases.s4.c2.desc" },
  { name: "bases.s4.c3.name", desc: "bases.s4.c3.desc" },
  { name: "bases.s4.c4.name", desc: "bases.s4.c4.desc" },
  { name: "bases.s4.c5.name", desc: "bases.s4.c5.desc" },
] as const;

const SECTION_KEYS: readonly {
  title: string;
  body?: string;
  showMap?: boolean;
  emphasisDate?: boolean;
  emphasisSection3?: boolean;
  emphasisSection4?: boolean;
  emphasisSection8?: boolean;
  emphasisSection7?: boolean;
}[] = [
  { title: "bases.s1.title", body: "bases.s1.body" },
  { title: "bases.s2.title", showMap: true, emphasisDate: true },
  { title: "bases.s3.title", emphasisSection3: true },
  { title: "bases.s4.title", emphasisSection4: true },
  { title: "bases.s5.title", body: "bases.s5.body" },
  { title: "bases.s6.title", body: "bases.s6.body" },
  { title: "bases.s8.title", body: "bases.s8.body", emphasisSection8: true },
  { title: "bases.s7.title", body: "bases.s7.body", emphasisSection7: true },
];

const Bases = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <FileText className="h-6 w-6 text-primary shrink-0" />
            <h1 className="text-lg sm:text-xl font-serif font-bold">{t("bases.title")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex justify-center mb-8">
          <GildaLogo className="h-14 w-14 text-primary" />
        </div>
        <p className="text-center text-muted-foreground font-serif text-lg mb-10">{t("bases.lead")}</p>

        <div className="space-y-10 text-foreground">
          {SECTION_KEYS.map((s) => (
            <section key={s.title} className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-primary border-b border-border pb-2">
                {t(s.title)}
              </h2>
              {s.emphasisDate ? (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("bases.s2.prefix")}
                  <span className={emphasisClass}>{t("bases.s2.emphasis")}</span>
                  {t("bases.s2.mid")}
                  <span className={emphasisClass}>{t("bases.s2.emphasisAddress")}</span>
                  {t("bases.s2.suffix")}
                </p>
              ) : s.emphasisSection3 ? (
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-4">
                  <p className="whitespace-pre-line">{t("bases.s3.p1")}</p>
                  <p>
                    {t("bases.s3.p2a")}
                    <span className={emphasisClass}>{t("bases.s3.p2emphasis")}</span>
                    {t("bases.s3.p2b")}
                  </p>
                  <p className="whitespace-pre-line">{t("bases.s3.p3")}</p>
                  <p className="whitespace-pre-line">{t("bases.s3.p4")}</p>
                  <p className={`${emphasisClass} leading-relaxed text-center`}>{t("bases.s3.p5")}</p>
                </div>
              ) : s.emphasisSection4 ? (
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-3">
                  <p>{t("bases.s4.intro")}</p>
                  <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
                    {BASES_S4_CATEGORY_ROWS.map((row) => (
                      <li key={row.name}>
                        <span className={categoryLabelClass}>{t(row.name)}</span> {t(row.desc)}
                      </li>
                    ))}
                  </ul>
                  <p className={`${emphasisClass} leading-relaxed text-center mt-4`}>{t("bases.s4.footer")}</p>
                </div>
              ) : s.emphasisSection8 ? (
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-4">
                  <div className="whitespace-pre-line">{t("bases.s8.body")}</div>
                  <p className={`${emphasisClass} leading-relaxed`}>{t("bases.s8.emphasis")}</p>
                </div>
              ) : s.emphasisSection7 ? (
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-4">
                  <div className="whitespace-pre-line">{t("bases.s7.body")}</div>
                  <p>{t("bases.s7.footer")}</p>
                </div>
              ) : (
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {s.body ? t(s.body) : null}
                </div>
              )}
              {s.showMap ? <GoogleMapsPreview /> : null}
            </section>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-border text-center">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t("nav.backHome")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Bases;
