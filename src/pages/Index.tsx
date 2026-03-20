import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchCurrentEdition, fetchDishes, fetchContestSettings, fetchRandomEventPhotos } from "@/lib/supabase-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { Trophy, LogIn, Camera, FileText } from "lucide-react";
import { PHOTOS_UPLOAD_ENABLED } from "@/config/features";

const Index = () => {
  const { t } = useI18n();

  const { data: eventPhotos = [] } = useQuery({
    queryKey: ["event-photos-carousel"],
    queryFn: () => fetchRandomEventPhotos(20),
  });

  const [displayedTriplet, setDisplayedTriplet] = useState<string[]>([]);
  const [tripletKey, setTripletKey] = useState(0);

  useEffect(() => {
    if (eventPhotos.length === 0) return;
    const pick3 = () => {
      const shuffled = [...eventPhotos].sort(() => Math.random() - 0.5);
      setDisplayedTriplet(shuffled.slice(0, 3));
      setTripletKey((k) => k + 1);
    };
    pick3();
    const interval = setInterval(pick3, 4000);
    return () => clearInterval(interval);
  }, [eventPhotos]);

  const { data: currentEdition } = useQuery({
    queryKey: ["edition-current"],
    queryFn: fetchCurrentEdition,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes", "landing", currentEdition?.id ?? "none"],
    queryFn: () => fetchDishes(currentEdition?.id ?? undefined),
    enabled: currentEdition !== undefined,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: settings } = useQuery({
    queryKey: ["contest-settings"],
    queryFn: fetchContestSettings,
  });
  const contestName =
    settings?.contest_name === "Concurso Gastronómico"
      ? "AITORTILLA"
      : (settings?.contest_name ?? "AITORTILLA");

  return (
    <div className="min-h-screen bg-background">
      {/* Header: marca + utilidades · barra de navegación principal */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-black/90 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.85)] backdrop-blur-md supports-[backdrop-filter]:bg-black/75">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Fila 1: marca (logo + título) centrada en la web · utilidades fijas a la derecha */}
          <div className="relative min-h-[4.25rem] py-4 sm:min-h-[4.75rem]">
            <div className="flex justify-center px-2 sm:px-3">
              <div className="flex max-w-[min(100%,calc(100%-7.5rem))] items-center gap-3 sm:max-w-[min(100%,calc(100%-9rem))] sm:gap-4">
                <Link
                  to="/admin"
                  className="inline-flex shrink-0 rounded-md outline-none ring-offset-2 ring-offset-background transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={t("nav.admin")}
                >
                  <GildaLogo decorative className="h-12 w-12 text-primary sm:h-16 sm:w-16" />
                </Link>
                <div className="min-w-0 text-left">
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                    {t("nav.brandEyebrow")}
                  </p>
                  <h1 className="font-vasca text-3xl font-bold leading-tight tracking-wide text-foreground sm:text-4xl md:text-5xl">
                    {contestName}
                  </h1>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-1/2 z-10 flex max-w-[40%] flex-wrap items-center justify-end gap-1.5 sm:top-1/2 sm:max-w-none sm:gap-2">
              <LanguageSelector className="shrink-0" />
              {settings?.results_published && (
                <Link to="/resultados" className="shrink-0" aria-label={t("nav.results")}>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 px-2.5 sm:h-10 sm:gap-2 sm:px-3">
                    <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("nav.results")}</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Fila 2: acciones principales (misma alineación centrada que la marca arriba) */}
          <div className="border-t border-border/50 bg-muted/25 px-2 py-2 sm:px-3 sm:py-2.5">
            <div className="flex justify-center px-2 sm:px-3">
              <div className="flex max-w-[min(100%,calc(100%-4rem))] justify-center min-w-0 sm:max-w-[min(100%,calc(100%-5rem))]">
                <div className="w-full min-w-0 max-w-[23rem] sm:max-w-md">
                  <nav
                    className="grid w-full grid-cols-3 gap-1 sm:gap-1.5"
                    aria-label={t("nav.primaryNavAria")}
                  >
                    <Link to="/votar" className="flex min-w-0">
                      <Button className="h-8 w-full min-w-0 gap-0.5 px-1 text-xs shadow-sm sm:h-9 sm:gap-1 sm:px-1.5 sm:text-sm">
                        <LogIn className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                        <span className="min-w-0 truncate">{t("nav.vote")}</span>
                      </Button>
                    </Link>
                    {PHOTOS_UPLOAD_ENABLED ? (
                      <Link to="/fotos" className="flex min-w-0">
                        <Button
                          variant="outline"
                          className="h-8 w-full min-w-0 gap-0.5 border-orange-400/40 bg-orange-950/40 px-1 text-xs text-orange-100 hover:bg-orange-900/50 hover:text-orange-50 sm:h-9 sm:gap-1 sm:px-1.5 sm:text-sm"
                        >
                          <Camera className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                          <span className="min-w-0 truncate">{t("nav.photos")}</span>
                        </Button>
                      </Link>
                    ) : (
                      <span className="flex min-w-0 w-full" title={t("nav.photosDisabledHint")}>
                        <Button
                          type="button"
                          variant="outline"
                          disabled
                          aria-disabled
                          className="h-8 w-full min-w-0 gap-0.5 border-orange-400/40 bg-orange-950/40 px-1 text-xs text-orange-100 hover:bg-orange-900/50 hover:text-orange-50 disabled:opacity-100 sm:h-9 sm:gap-1 sm:px-1.5 sm:text-sm"
                        >
                          <Camera className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                          <span className="min-w-0 truncate">{t("nav.photos")}</span>
                        </Button>
                      </span>
                    )}
                    <Link to="/bases" className="flex min-w-0">
                      <Button
                        variant="outline"
                        className="h-8 w-full min-w-0 gap-0.5 border-border bg-background/50 px-1 text-xs hover:bg-muted/80 sm:h-9 sm:gap-1 sm:px-1.5 sm:text-sm"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                        <span className="min-w-0 truncate">{t("nav.bases")}</span>
                      </Button>
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Event photos grid (3 fotos que van cambiando) - encima del título */}
      {eventPhotos.length > 0 && (
        <section className="container mx-auto px-4 pt-8 pb-4 flex justify-center">
          <div className="grid grid-cols-3 gap-2 max-w-xl">
            {displayedTriplet.map((url, i) => (
              <div key={`${tripletKey}-${i}`} className="aspect-square rounded-xl overflow-hidden bg-muted animate-fade-in">
                <img
                  src={url}
                  alt={`Foto del evento ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-serif font-bold text-foreground mb-4 animate-fade-in">
            {t("index.heroTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {t("index.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Dishes Grid */}
      <section className="container mx-auto px-4 pb-20">
        {dishes.length === 0 ? (
          <div className="text-center py-20">
            <GildaLogo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-serif">
              {t("index.emptyTitle")}
            </p>
            <p className="text-muted-foreground mt-2">
              {t("index.emptySubtitle")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish, i) => (
              <Card
                key={dish.id}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in bg-card"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {dish.image_url ? (
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GildaLogo className="h-16 w-16 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="text-xl font-serif font-bold text-foreground mb-1">
                    {dish.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-2">
                    {t("common.by", { author: dish.author })}
                  </p>
                  {dish.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {dish.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>
          🍽️ {contestName} — {t("index.footerMotto")}
        </p>
        {currentEdition && (
          <p className="mt-1 text-xs opacity-70">
            Edición {currentEdition.year} · {dishes.length} pintxo{dishes.length !== 1 ? "s" : ""}
          </p>
        )}
        <p className="mt-4">
          <Link to="/bases" className="text-primary hover:underline text-sm font-medium">
            {t("nav.bases")}
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default Index;
