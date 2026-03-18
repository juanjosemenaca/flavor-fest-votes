import { useEffect, useState } from "react";
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
import {
  ChefHat,
  Plus,
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) navigate("/admin");
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) navigate("/admin");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: dishes = [] } = useQuery({ queryKey: ["dishes"], queryFn: fetchDishes, enabled: !!session });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, enabled: !!session });
  const { data: settings } = useQuery({ queryKey: ["contest-settings"], queryFn: fetchContestSettings, enabled: !!session });
  const { data: votes = [] } = useQuery({ queryKey: ["all-votes"], queryFn: fetchAllVotes, enabled: !!session });

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
      toast({ title: "Plato añadido" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast({ title: "Plato eliminado" });
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
      toast({ title: "Categoría añadida" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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
      toast({ title: `${numCodes} códigos generados` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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
    navigate("/admin");
  };

  const copyAllCodes = () => {
    const text = accessCodes.map((c) => c.code).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Códigos copiados al portapapeles" });
  };

  // Results summary
  const getVoteSummary = () => {
    const summary: Record<string, Record<string, number>> = {};
    votes.forEach((v) => {
      if (!v.liked) return;
      if (!summary[v.category_id]) summary[v.category_id] = {};
      summary[v.category_id][v.dish_id] = (summary[v.category_id][v.dish_id] || 0) + 1;
    });
    return summary;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!session) return null;

  const voteSummary = getVoteSummary();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-serif font-bold">Admin</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dishes">
          <TabsList className="mb-6">
            <TabsTrigger value="dishes" className="gap-1"><ChefHat className="h-4 w-4" /> Platos</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1"><Tag className="h-4 w-4" /> Categorías</TabsTrigger>
            <TabsTrigger value="codes" className="gap-1"><KeyRound className="h-4 w-4" /> Códigos</TabsTrigger>
            <TabsTrigger value="results" className="gap-1"><Trophy className="h-4 w-4" /> Resultados</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" /> Ajustes</TabsTrigger>
          </TabsList>

          {/* DISHES TAB */}
          <TabsContent value="dishes" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-serif">Añadir Plato</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre del plato</Label>
                    <Input value={newDish.name} onChange={(e) => setNewDish({ ...newDish, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Autor / Chef</Label>
                    <Input value={newDish.author} onChange={(e) => setNewDish({ ...newDish, author: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea value={newDish.description} onChange={(e) => setNewDish({ ...newDish, description: e.target.value })} />
                </div>
                <div>
                  <Label>Foto del plato</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setDishPhoto(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={() => addDishMutation.mutate()} disabled={!newDish.name || !newDish.author || addDishMutation.isPending} className="gap-2">
                  <Plus className="h-4 w-4" /> Añadir Plato
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
                    <p className="text-sm text-muted-foreground">por {dish.author}</p>
                    <Button variant="destructive" size="sm" className="mt-2 gap-1" onClick={() => deleteDishMutation.mutate(dish.id)}>
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-serif">Añadir Categoría</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Ej: Mejor Sabor" />
                </div>
                <div>
                  <Label>Descripción (opcional)</Label>
                  <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} />
                </div>
                <Button onClick={() => addCategoryMutation.mutate()} disabled={!newCategory.name || addCategoryMutation.isPending} className="gap-2">
                  <Plus className="h-4 w-4" /> Añadir Categoría
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
              <CardHeader><CardTitle className="font-serif">Generar Códigos de Acceso</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div>
                    <Label>Cantidad</Label>
                    <Input type="number" min={1} max={100} value={numCodes} onChange={(e) => setNumCodes(Number(e.target.value))} className="w-24" />
                  </div>
                  <Button onClick={() => generateCodesMutation.mutate()} disabled={generateCodesMutation.isPending} className="gap-2">
                    <Plus className="h-4 w-4" /> Generar
                  </Button>
                  {accessCodes.length > 0 && (
                    <Button variant="outline" onClick={copyAllCodes} className="gap-2">
                      <Copy className="h-4 w-4" /> Copiar todos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {accessCodes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {accessCodes.map((c) => (
                  <div key={c.id} className={`text-center p-2 rounded-lg border font-mono text-sm ${c.used ? "bg-muted text-muted-foreground" : "bg-card"}`}>
                    {c.code}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              Total de votos: {votes.length} | Likes: {votes.filter((v) => v.liked).length}
            </div>
            {categories.map((cat) => {
              const catVotes = voteSummary[cat.id] || {};
              const ranked = Object.entries(catVotes)
                .map(([dishId, count]) => ({ dish: dishes.find((d) => d.id === dishId), likes: count }))
                .filter((r) => r.dish)
                .sort((a, b) => b.likes - a.likes);

              return (
                <Card key={cat.id}>
                  <CardHeader><CardTitle className="font-serif text-lg">{cat.name}</CardTitle></CardHeader>
                  <CardContent>
                    {ranked.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin votos</p>
                    ) : (
                      <div className="space-y-2">
                        {ranked.map((r, i) => (
                          <div key={r.dish!.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                            <span className="font-bold w-8 text-center">{i + 1}.</span>
                            <span className="flex-1 font-medium">{r.dish!.name}</span>
                            <span className="text-primary font-bold">{r.likes} ❤️</span>
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
                    <p className="font-medium">Votación abierta</p>
                    <p className="text-sm text-muted-foreground">Permite que los votantes emitan sus votos</p>
                  </div>
                  <Switch checked={settings?.voting_open ?? true} onCheckedChange={(v) => toggleVotingMutation.mutate(v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Publicar resultados</p>
                    <p className="text-sm text-muted-foreground">Hace visibles los resultados en la página pública</p>
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
