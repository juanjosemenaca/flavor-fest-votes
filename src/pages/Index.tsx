import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchDishes, fetchCategories, fetchContestSettings } from "@/lib/supabase-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GildaLogo from "@/components/GildaLogo";
import { Trophy, LogIn } from "lucide-react";

const Index = () => {
  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes"],
    queryFn: fetchDishes,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
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
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GildaLogo className="h-16 w-16 text-primary" />
            <h1 className="text-4xl md:text-5xl font-vasca font-bold text-foreground tracking-wide">
              {contestName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {settings?.results_published && (
              <Link to="/resultados">
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Resultados
                </Button>
              </Link>
            )}
            <Link to="/votar">
              <Button className="gap-2">
                <LogIn className="h-4 w-4" />
                Votar
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-serif font-bold text-foreground mb-4 animate-fade-in">
            Los pintxos más locos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Descubre los pintxos que compiten en AITORTILLA y vota sin piedad
          </p>
        </div>
      </section>

      {/* Dishes Grid */}
      <section className="container mx-auto px-4 pb-20">
        {dishes.length === 0 ? (
          <div className="text-center py-20">
            <GildaLogo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-serif">
              Aún no hay platos registrados
            </p>
            <p className="text-muted-foreground mt-2">
              Los platos aparecerán aquí cuando el organizador los publique
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
                    por {dish.author}
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
          🍽️ {contestName} — que gane el mejor pintxo
        </p>
      </footer>
    </div>
  );
};

export default Index;
