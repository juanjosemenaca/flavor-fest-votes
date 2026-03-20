import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchContestSettings, fetchEditionByYear, fetchEditions } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "@supabase/supabase-js";

/**
 * Hoja imprimible: un QR + código por tarjeta (reparto entre asistentes).
 * Abre desde Admin → Códigos con ?year= (opcional, por defecto la última edición).
 */
const PrintAccessCodes = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) navigate("/admin");
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) navigate("/admin");
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: editions = [] } = useQuery({
    queryKey: ["editions"],
    queryFn: fetchEditions,
    enabled: !!session,
  });

  const yearFromUrl = searchParams.get("year");
  const effectiveYear = useMemo(() => {
    if (yearFromUrl) {
      const y = Number(yearFromUrl);
      if (!Number.isNaN(y)) return y;
    }
    return editions[0]?.year ?? new Date().getFullYear();
  }, [yearFromUrl, editions]);

  const editionId = editions.find((e) => e.year === effectiveYear)?.id ?? null;
  const isLegacyMode = editions.length === 0;

  const { data: editionDetail } = useQuery({
    queryKey: ["edition-by-year", effectiveYear],
    queryFn: () => fetchEditionByYear(effectiveYear),
    enabled: !!session && !!effectiveYear,
  });

  const { data: settings } = useQuery({
    queryKey: ["contest-settings"],
    queryFn: fetchContestSettings,
    enabled: !!session,
  });

  const contestName =
    editionDetail?.contest_name && editionDetail.contest_name !== "Concurso Gastronómico"
      ? editionDetail.contest_name
      : (settings?.contest_name === "Concurso Gastronómico" ? "AITORTILLA" : settings?.contest_name) ??
        "AITORTILLA";

  const { data: accessCodes = [], isLoading: codesLoading } = useQuery({
    queryKey: ["access-codes", editionId ?? "legacy"],
    queryFn: async () => {
      const q = supabase.from("access_codes").select("*").order("created_at", { ascending: false });
      const { data, error } = editionId ? await q.eq("edition_id", editionId) : await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session && (!!editionId || isLegacyMode),
  });

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        {t("admin.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* Barra solo en pantalla */}
      <div className="print:hidden sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link to="/admin/dashboard">
                <ArrowLeft className="h-4 w-4" />
                {t("admin.codes.printBack")}
              </Link>
            </Button>
            <Button size="sm" className="gap-2" type="button" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              {t("admin.codes.printButton")}
            </Button>
          </div>
          <p className="max-w-md text-xs text-muted-foreground">{t("admin.codes.printHint")}</p>
        </div>
      </div>

      {/* Contenido imprimible */}
      <div className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:px-6 print:py-4">
        <header className="mb-6 text-center print:mb-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground print:text-neutral-600">
            {t("nav.brandEyebrow")}
          </p>
          <h1 className="font-serif text-2xl font-bold tracking-tight print:text-xl">{contestName}</h1>
          <p className="mt-1 text-sm text-muted-foreground print:text-neutral-700">{t("admin.codes.printSubtitle")}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground print:text-neutral-600">
            {t("admin.codes.printYear", { year: String(effectiveYear) })}
          </p>
        </header>

        {codesLoading ? (
          <p className="text-center text-muted-foreground">{t("admin.loading")}</p>
        ) : accessCodes.length === 0 ? (
          <p className="text-center text-muted-foreground">{t("admin.codes.printEmpty")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 print:gap-3">
            {accessCodes.map((c) => {
              const voteUrl = `${window.location.origin}/votar?code=${c.code}`;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "flex break-inside-avoid flex-col items-center rounded-xl border p-4 text-center font-mono shadow-sm print:shadow-none print:break-inside-avoid",
                    c.used
                      ? "border-dashed border-muted-foreground/50 bg-muted/30 text-muted-foreground print:border-neutral-400 print:bg-neutral-100"
                      : "border-border bg-card print:border-neutral-300 print:bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-md p-1",
                      c.used && "bg-muted/50 ring-1 ring-inset ring-muted-foreground/20 print:bg-neutral-200",
                    )}
                  >
                    <QRCodeSVG
                      value={voteUrl}
                      size={112}
                      level="M"
                      className={cn("mx-auto block h-[112px] w-[112px]", c.used && "opacity-50 grayscale")}
                    />
                  </div>
                  {c.used && (
                    <p className="mt-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-muted-foreground print:text-neutral-600">
                      {t("admin.codes.codeVoided")}
                    </p>
                  )}
                  <p className="mt-3 text-lg font-bold tracking-[0.2em] print:text-base">{c.code}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PrintAccessCodes;
