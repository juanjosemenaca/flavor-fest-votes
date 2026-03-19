import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEditions, fetchEditionByYear, fetchDishes, fetchCategories, fetchAllVotes } from "@/lib/supabase-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { Link } from "react-router-dom";

const MEDAL_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-700"];
const MEDAL_LABELS = ["🥇", "🥈", "🥉"];

const Results = () => {
  const { t } = useI18n();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { data: editions = [] } = useQuery({
    queryKey: ["editions"],
    queryFn: fetchEditions,
  });

  const effectiveYear = selectedYear ?? editions[0]?.year ?? new Date().getFullYear();
  const edition = editions.find((e) => e.year === effectiveYear);
  const editionId = edition?.id ?? null;

  const { data: settings } = useQuery({
    queryKey: ["edition-settings", effectiveYear],
    queryFn: () => fetchEditionByYear(effectiveYear),
    enabled: !!effectiveYear,
  });

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes", editionId],
    queryFn: () => fetchDishes(editionId ?? undefined),
    enabled: !!editionId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", editionId],
    queryFn: () => fetchCategories(editionId ?? undefined),
    enabled: !!editionId,
  });

  const { data: votes = [] } = useQuery({
    queryKey: ["all-votes", editionId],
    queryFn: () => fetchAllVotes(editionId ?? undefined),
    enabled: !!editionId && settings?.results_published === true,
  });

  const resultsPublished = settings?.results_published ?? false;
  if (!resultsPublished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">{t("results.unavailableTitle")}</h2>
          <p className="text-muted-foreground mb-4">{t("results.unavailableDescription")}</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t("nav.back")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getRanking = (categoryId: string) => {
    const categoryVotes = votes.filter((v) => v.category_id === categoryId && v.liked);
    const counts: Record<string, number> = {};
    categoryVotes.forEach((v) => {
      counts[v.dish_id] = (counts[v.dish_id] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([dishId, count]) => ({
        dish: dishes.find((d) => d.id === dishId),
        likes: count,
      }))
      .filter((r) => r.dish)
      .sort((a, b) => b.likes - a.likes);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-serif font-bold">{t("results.title")}</h1>
            {editions.length > 1 && (
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={effectiveYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {editions.map((e) => (
                  <option key={e.id} value={e.year}>
                    {e.year}
                  </option>
                ))}
              </select>
            )}
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {categories.map((cat) => {
          const ranking = getRanking(cat.id);
          return (
            <Card key={cat.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Medal className="h-5 w-5 text-primary" />
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("results.noVotesInCategory")}</p>
                ) : (
                  <div className="space-y-3">
                    {ranking.map((r, i) => (
                      <div key={r.dish!.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <span className="text-2xl w-8 text-center">{i < 3 ? MEDAL_LABELS[i] : `${i + 1}.`}</span>
                        {r.dish!.image_url && (
                          <img src={r.dish!.image_url} alt={r.dish!.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="font-serif font-bold">{r.dish!.name}</p>
                          <p className="text-xs text-muted-foreground">{t("common.by", { author: r.dish!.author })}</p>
                        </div>
                        <span className="font-bold text-primary">{r.likes} ❤️</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Results;
