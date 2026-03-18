import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchDishes,
  fetchCategories,
  fetchContestSettings,
  fetchAllVotes,
  uploadDishPhoto,
  generateAccessCode,
} from "@/lib/supabase-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import {
  Plus,
  Minus,
  Trash2,
  LogOut,
  Trophy,
  Tag,
  KeyRound,
  Settings,
  Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

const AdminDashboard = () => {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginalByCategory, setShowOriginalByCategory] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) navigate("/");
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) navigate("/");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: dishes = [] } = useQuery({ queryKey: ["dishes"], queryFn: fetchDishes, enabled: !!session });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, enabled: !!session });
  const { data: settings } = useQuery({ queryKey: ["contest-settings"], queryFn: fetchContestSettings, enabled: !!session });
  const { data: votes = [] } = useQuery({ queryKey: ["all-votes"], queryFn: fetchAllVotes, enabled: !!session });
  const { data: voteAdjustments = [] } = useQuery({
    queryKey: ["vote-adjustments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vote_adjustments").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session,
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ["access-codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("access_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session,
  });

  // --- Dish Management ---
  const [newDish, setNewDish] = useState({ name: "", author: "", description: "" });
  const [dishPhoto, setDishPhoto] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const addDishMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | null = null;
      if (dishPhoto) imageUrl = await uploadDishPhoto(dishPhoto);
      const { error } = await supabase.from("dishes").insert({
        name: newDish.name,
        author: newDish.author,
        description: newDish.description || null,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      setNewDish({ name: "", author: "", description: "" });
      setDishPhoto(null);
      toast({ title: t("admin.dishes.added") });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast({ title: t("admin.dishes.deleted") });
    },
  });

  // --- Category Management ---
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: newCategory.name,
        description: newCategory.description || null,
        display_order: categories.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory({ name: "", description: "" });
      toast({ title: t("admin.categories.added") });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  // --- Access Code Management ---
  const [numCodes, setNumCodes] = useState(10);

  const generateCodesMutation = useMutation({
    mutationFn: async () => {
      const codes = Array.from({ length: numCodes }, () => ({
        code: generateAccessCode(),
      }));
      const { error } = await supabase.from("access_codes").insert(codes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-codes"] });
      toast({ title: t("admin.codes.generated", { count: numCodes }) });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const reopenCodeMutation = useMutation({
    mutationFn: async (accessCodeId: string) => {
      const { error: deleteVotesError } = await supabase
        .from("votes")
        .delete()
        .eq("access_code_id", accessCodeId);
      if (deleteVotesError) throw deleteVotesError;

      const { error: reopenError } = await supabase
        .from("access_codes")
        .update({ used: false })
        .eq("id", accessCodeId);
      if (reopenError) throw reopenError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-codes"] });
      queryClient.invalidateQueries({ queryKey: ["all-votes"] });
      toast({ title: t("admin.codes.reopenedTitle"), description: t("admin.codes.reopenedDescription") });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const adjustVoteMutation = useMutation({
    mutationFn: async ({
      dishId,
      categoryId,
      delta,
    }: {
      dishId: string;
      categoryId: string;
      delta: 1 | -1;
    }) => {
      const { error } = await supabase.rpc("adjust_vote_delta", {
        _dish_id: dishId,
        _category_id: categoryId,
        _delta: delta,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vote-adjustments"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  // --- Settings ---
  const toggleResultsMutation = useMutation({
    mutationFn: async (published: boolean) => {
      if (!settings) return;
      const { error } = await supabase.from("contest_settings").update({ results_published: published }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contest-settings"] }),
  });

  const toggleVotingMutation = useMutation({
    mutationFn: async (open: boolean) => {
      if (!settings) return;
      const { error } = await supabase.from("contest_settings").update({ voting_open: open }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contest-settings"] }),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const copyAllCodes = () => {
    const text = accessCodes.map((c) => c.code).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: t("admin.codes.copied") });
  };

  // Results summary (real votes from users only)
  const getRawVoteSummary = () => {
    const summary: Record<string, Record<string, number>> = {};
    votes.forEach((v) => {
      if (!v.liked) return;
      if (!summary[v.category_id]) summary[v.category_id] = {};
      summary[v.category_id][v.dish_id] = (summary[v.category_id][v.dish_id] || 0) + 1;
    });
    return summary;
  };

  // Results summary including admin manual adjustments
  const getAdjustedVoteSummary = (baseSummary: Record<string, Record<string, number>>) => {
    const summary = structuredClone(baseSummary) as Record<string, Record<string, number>>;
    voteAdjustments.forEach((adj) => {
      if (!summary[adj.category_id]) summary[adj.category_id] = {};
      const next = (summary[adj.category_id][adj.dish_id] || 0) + adj.delta;
      summary[adj.category_id][adj.dish_id] = Math.max(0, next);
    });
    return summary;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t("admin.loading")}</div>;
  if (!session) return null;

  const rawVoteSummary = getRawVoteSummary();
  const voteSummary = getAdjustedVoteSummary(rawVoteSummary);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GildaLogo className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-serif font-bold">{t("admin.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> {t("admin.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dishes">
          <TabsList className="mb-6">
            <TabsTrigger value="dishes" className="gap-1"><GildaLogo className="h-4 w-4" /> {t("admin.tab.dishes")}</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1"><Tag className="h-4 w-4" /> {t("admin.tab.categories")}</TabsTrigger>
            <TabsTrigger value="codes" className="gap-1"><KeyRound className="h-4 w-4" /> {t("admin.tab.codes")}</TabsTrigger>
            <TabsTrigger value="results" className="gap-1"><Trophy className="h-4 w-4" /> {t("admin.tab.results")}</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" /> {t("admin.tab.settings")}</TabsTrigger>
          </TabsList>

          {/* DISHES TAB */}
          <TabsContent value="dishes" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-serif">{t("admin.dishes.addTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("admin.dishes.name")}</Label>
                    <Input value={newDish.name} onChange={(e) => setNewDish({ ...newDish, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>{t("admin.dishes.author")}</Label>
                    <Input value={newDish.author} onChange={(e) => setNewDish({ ...newDish, author: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{t("admin.dishes.description")}</Label>
                  <Textarea value={newDish.description} onChange={(e) => setNewDish({ ...newDish, description: e.target.value })} />
                </div>
                <div>
                  <Label>{t("admin.dishes.photo")}</Label>
                  <div className="space-y-2">
                    <Input type="file" accept="image/*" onChange={(e) => setDishPhoto(e.target.files?.[0] || null)} />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setDishPhoto(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      {t("admin.dishes.useCamera")}
                    </Button>
                    {dishPhoto && (
                      <p className="text-xs text-muted-foreground">
                        {t("admin.dishes.photoSelected", { name: dishPhoto.name })}
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={() => addDishMutation.mutate()} disabled={!newDish.name || !newDish.author || addDishMutation.isPending} className="gap-2">
                  <Plus className="h-4 w-4" /> {t("admin.dishes.addButton")}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden">
                  {dish.image_url && (
                    <div className="aspect-video bg-muted">
                      <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-serif font-bold">{dish.name}</h3>
                    <p className="text-sm text-muted-foreground">{t("common.by", { author: dish.author })}</p>
                    <Button variant="destructive" size="sm" className="mt-2 gap-1" onClick={() => deleteDishMutation.mutate(dish.id)}>
                      <Trash2 className="h-3 w-3" /> {t("common.delete")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-serif">{t("admin.categories.addTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("admin.categories.name")}</Label>
                  <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder={t("admin.categories.placeholder")} />
                </div>
                <div>
                  <Label>{t("admin.categories.description")}</Label>
                  <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} />
                </div>
                <Button onClick={() => addCategoryMutation.mutate()} disabled={!newCategory.name || addCategoryMutation.isPending} className="gap-2">
                  <Plus className="h-4 w-4" /> {t("admin.categories.addButton")}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategoryMutation.mutate(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* CODES TAB */}
          <TabsContent value="codes" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-serif">{t("admin.codes.generateTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div>
                    <Label>{t("admin.codes.quantity")}</Label>
                    <Input type="number" min={1} max={100} value={numCodes} onChange={(e) => setNumCodes(Number(e.target.value))} className="w-24" />
                  </div>
                  <Button onClick={() => generateCodesMutation.mutate()} disabled={generateCodesMutation.isPending} className="gap-2">
                    <Plus className="h-4 w-4" /> {t("admin.codes.generateButton")}
                  </Button>
                  {accessCodes.length > 0 && (
                    <Button variant="outline" onClick={copyAllCodes} className="gap-2">
                      <Copy className="h-4 w-4" /> {t("admin.codes.copyAll")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {accessCodes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {accessCodes.map((c) => (
                  <div
                    key={c.id}
                    className={`text-center p-2 rounded-lg border font-mono text-sm space-y-2 ${
                      c.used
                        ? "bg-destructive text-destructive-foreground border-destructive/70"
                        : "bg-card"
                    }`}
                  >
                    <div>{c.code}</div>
                    {c.used && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => reopenCodeMutation.mutate(c.id)}
                        disabled={reopenCodeMutation.isPending}
                      >
                        {reopenCodeMutation.isPending ? t("admin.codes.reopening") : t("admin.codes.reopen")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              {t("admin.results.summary", { total: votes.length, likes: votes.filter((v) => v.liked).length })}
            </div>
            {categories.map((cat) => {
              const showingOriginal = !!showOriginalByCategory[cat.id];
              const catVotes = showingOriginal
                ? (rawVoteSummary[cat.id] || {})
                : (voteSummary[cat.id] || {});
              const ranked = dishes
                .map((dish) => ({
                  dish,
                  likes: catVotes[dish.id] || 0,
                }))
                .sort((a, b) => b.likes - a.likes);

              return (
                <Card key={cat.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="font-serif text-lg">{cat.name}</CardTitle>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowOriginalByCategory((prev) => ({
                            ...prev,
                            [cat.id]: !prev[cat.id],
                          }))
                        }
                      >
                        {showingOriginal ? t("admin.results.showAdjusted") : t("admin.results.showLegal")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showingOriginal && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {t("admin.results.showingLegalHint")}
                      </p>
                    )}
                    {dishes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("admin.results.noVotes")}</p>
                    ) : (
                      <div className="space-y-2">
                        {ranked.map((r, i) => (
                          <div key={r.dish!.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                            <span className="font-bold w-8 text-center">{i + 1}.</span>
                            <span className="flex-1 font-medium">{r.dish!.name}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => {
                                  if (showingOriginal) {
                                    setShowOriginalByCategory((prev) => ({ ...prev, [cat.id]: false }));
                                  }
                                  adjustVoteMutation.mutate({
                                    dishId: r.dish!.id,
                                    categoryId: cat.id,
                                    delta: -1,
                                  });
                                }}
                                disabled={adjustVoteMutation.isPending || r.likes <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-primary font-bold min-w-10 text-center">{r.likes} ❤️</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => {
                                  if (showingOriginal) {
                                    setShowOriginalByCategory((prev) => ({ ...prev, [cat.id]: false }));
                                  }
                                  adjustVoteMutation.mutate({
                                    dishId: r.dish!.id,
                                    categoryId: cat.id,
                                    delta: 1,
                                  });
                                }}
                                disabled={adjustVoteMutation.isPending}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("admin.settings.votingOpenTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("admin.settings.votingOpenDescription")}</p>
                  </div>
                  <Switch checked={settings?.voting_open ?? true} onCheckedChange={(v) => toggleVotingMutation.mutate(v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("admin.settings.publishResultsTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("admin.settings.publishResultsDescription")}</p>
                  </div>
                  <Switch checked={settings?.results_published ?? false} onCheckedChange={(v) => toggleResultsMutation.mutate(v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
