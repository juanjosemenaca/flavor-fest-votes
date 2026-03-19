import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchDishes, fetchContestSettings, fetchRandomEventPhotos } from "@/lib/supabase-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { Trophy, LogIn, Camera } from "lucide-react";

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

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes"],
    queryFn: fetchDishes,
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
      {/* Header */}
      <header className="border-b border-border bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GildaLogo className="h-16 w-16 text-primary" />
            <h1 className="text-4xl md:text-5xl font-vasca font-bold text-foreground tracking-wide">
              {contestName}
            </h1>
            <div className="ml-5 flex items-center gap-2">
              <Link to="/votar">
                <Button className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("nav.vote")}
                </Button>
              </Link>
              <Link to="/fotos">
                <Button variant="outline" className="gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-200 hover:border-orange-300">
                  <Camera className="h-4 w-4" />
                  {t("nav.photos")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {settings?.results_published && (
              <Link to="/resultados">
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  {t("nav.results")}
                </Button>
              </Link>
            )}
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                {t("nav.admin")}
              </Button>
            </Link>
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
      </footer>
    </div>
  );
};

export default Index;
