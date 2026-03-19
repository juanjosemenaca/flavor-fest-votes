import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  validateAccessCode,
  fetchDishes,
  fetchCategories,
  fetchVotesForCode,
  fetchContestSettings,
} from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Vote = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.toUpperCase().trim() ?? "";
  const [code, setCode] = useState(codeFromUrl || "");
  const [accessCodeId, setAccessCodeId] = useState<string | null>(null);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const autoValidatedRef = useRef(false);
  const [selectedByCategory, setSelectedByCategory] = useState<Record<string, string | null>>({});
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["contest-settings"],
    queryFn: fetchContestSettings,
  });

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes", "vote", editionId ?? "none"],
    queryFn: () => fetchDishes(editionId ?? undefined),
    enabled: !!accessCodeId && editionId !== undefined,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "vote", editionId ?? "none"],
    queryFn: () => fetchCategories(editionId ?? undefined),
    enabled: !!accessCodeId && editionId !== undefined,
  });

  const { data: existingVotes = [] } = useQuery({
    queryKey: ["votes", accessCodeId],
    queryFn: () => fetchVotesForCode(accessCodeId!),
    enabled: !!accessCodeId,
  });

  useEffect(() => {
    if (!codeFromUrl || autoValidatedRef.current || accessCodeId) return;
    autoValidatedRef.current = true;
    setCode(codeFromUrl);
    setValidating(true);
    validateAccessCode(codeFromUrl)
      .then((result) => {
        if (result.ok) {
          setAccessCodeId(result.data.id);
          setEditionId(result.data.edition_id ?? null);
          toast({ title: t("vote.welcomeTitle"), description: t("vote.welcomeDescription") });
        } else if (result.reason === "used") {
          toast({
            title: t("vote.codeUsedTitle"),
            description: t("vote.codeUsedDescription"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("vote.invalidCodeTitle"),
            description: t("vote.invalidCodeDescription"),
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        toast({
          title: t("common.error"),
          description: t("vote.validationErrorDescription"),
          variant: "destructive",
        });
      })
      .finally(() => setValidating(false));
  }, [codeFromUrl, accessCodeId, t]);

  useEffect(() => {
    if (!accessCodeId) return;

    const nextSelection: Record<string, string | null> = {};
    categories.forEach((cat) => {
      nextSelection[cat.id] = null;
    });
    existingVotes.forEach((vote) => {
      nextSelection[vote.category_id] = vote.dish_id;
    });

    setSelectedByCategory(nextSelection);
  }, [accessCodeId, categories, existingVotes]);

  const existingByCategory = useMemo(() => {
    const map: Record<string, string | null> = {};
    categories.forEach((cat) => {
      map[cat.id] = null;
    });
    existingVotes.forEach((vote) => {
      map[vote.category_id] = vote.dish_id;
    });
    return map;
  }, [categories, existingVotes]);

  const selectedCount = categories.filter((cat) => !!selectedByCategory[cat.id]).length;
  const allCategoriesSelected = categories.length > 0 && selectedCount === categories.length;
  const hasChanges = categories.some(
    (cat) => (selectedByCategory[cat.id] ?? null) !== (existingByCategory[cat.id] ?? null),
  );

  const submitVotesMutation = useMutation({
    mutationFn: async () => {
      if (!accessCodeId) return;

      const selectedEntries = Object.entries(selectedByCategory).filter(([, dishId]) => !!dishId);

      if (selectedEntries.length > 0 && editionId) {
        const payload = selectedEntries.map(([categoryId, dishId]) => ({
          access_code_id: accessCodeId,
          category_id: categoryId,
          dish_id: dishId as string,
          edition_id: editionId,
          liked: true,
        }));
        const { error: upsertError } = await supabase
          .from("votes")
          .upsert(payload, { onConflict: "access_code_id,category_id" });
        if (upsertError) throw upsertError;
      }

      const categoriesToDelete = Object.entries(selectedByCategory)
        .filter(([, dishId]) => !dishId)
        .map(([categoryId]) => categoryId);

      if (categoriesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("access_code_id", accessCodeId)
          .in("category_id", categoriesToDelete);
        if (deleteError) throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", accessCodeId] });
      queryClient.invalidateQueries({ queryKey: ["access-codes"] });
      const savedToast = toast({ title: t("vote.votesSentTitle") });
      setTimeout(() => savedToast.dismiss(), 2000);
    },
    onError: () => {
      toast({
        title: t("vote.sendErrorTitle"),
        description: t("vote.sendErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleValidateCode = async () => {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const result = await validateAccessCode(code);
      if (result.ok) {
        setAccessCodeId(result.data.id);
        setEditionId(result.data.edition_id ?? null);
        toast({ title: t("vote.welcomeTitle"), description: t("vote.welcomeDescription") });
      } else if (result.reason === "used") {
        toast({
          title: t("vote.codeUsedTitle"),
          description: t("vote.codeUsedDescription"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("vote.invalidCodeTitle"),
          description: t("vote.invalidCodeDescription"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("vote.validationErrorDescription"),
        variant: "destructive",
      });
    }
    setValidating(false);
  };

  const toggleSelection = (categoryId: string, dishId: string) => {
    setSelectedByCategory((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === dishId ? null : dishId,
    }));
  };

  const handleSubmitVotes = () => {
    if (!allCategoriesSelected) {
      toast({
        title: t("vote.missingCategoriesTitle"),
        description: t("vote.missingCategoriesDescription", { total: categories.length }),
        variant: "destructive",
      });
      return;
    }
    submitVotesMutation.mutate();
  };

  if (settings && !settings.voting_open) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <GildaLogo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">{t("vote.closedTitle")}</h2>
          <p className="text-muted-foreground mb-4">{t("vote.closedDescription")}</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t("nav.backHome")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!accessCodeId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="mb-3 flex justify-center">
              <LanguageSelector />
            </div>
            <GildaLogo className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold">{t("vote.accessTitle")}</h2>
            <p className="text-muted-foreground mt-2">
              {t("vote.accessDescription")}
            </p>
          </div>
          <div className="space-y-4">
            <Input
              placeholder={t("vote.codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
            />
            <Button onClick={handleValidateCode} disabled={validating || !code.trim()} className="w-full">
              {validating ? t("vote.validating") : t("vote.access")}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← {t("nav.backHome")}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-xl font-serif font-bold">{t("vote.headerTitle")}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LanguageSelector />
            <Check className="h-4 w-4 text-success" />
            {t("vote.selectedCount", { selected: selectedCount, total: categories.length })}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {dishes.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">{t("vote.noDishes")}</p>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitVotes}
                disabled={submitVotesMutation.isPending || !hasChanges || !allCategoriesSelected}
              >
                {submitVotesMutation.isPending ? t("common.sending") : t("common.sendVotes")}
              </Button>
            </div>

            {categories.map((cat) => {
              const selectedDishId = selectedByCategory[cat.id] ?? null;
              return (
                <Card key={cat.id}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-serif font-bold">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                        )}
                      </div>
                      {selectedDishId && (
                        <span className="text-xs px-2 py-1 rounded bg-success/20 text-success font-semibold">
                          {t("vote.selectionDone")}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {dishes.map((dish) => {
                        const isSelected = selectedDishId === dish.id;
                        return (
                          <div
                            key={`${cat.id}-${dish.id}`}
                            className={`rounded-lg border overflow-hidden ${
                              isSelected ? "border-primary ring-1 ring-primary/50" : "border-border"
                            }`}
                          >
                            <div className="aspect-[4/3] bg-muted">
                              {dish.image_url ? (
                                <img
                                  src={dish.image_url}
                                  alt={dish.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <GildaLogo className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="p-4 space-y-2">
                              <p className="font-serif font-bold text-lg leading-tight">{dish.name}</p>
                              <p className="text-sm text-primary font-medium">{t("common.by", { author: dish.author })}</p>
                              {dish.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{dish.description}</p>
                              )}
                              <Button
                                className="w-full mt-2"
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => toggleSelection(cat.id, dish.id)}
                                disabled={submitVotesMutation.isPending}
                              >
                                {isSelected ? t("vote.deselect") : t("vote.choose")}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitVotes}
                disabled={submitVotesMutation.isPending || !hasChanges || !allCategoriesSelected}
              >
                {submitVotesMutation.isPending ? t("common.sending") : t("common.sendVotes")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vote;
