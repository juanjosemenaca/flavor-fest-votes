import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  validateAccessCode,
  fetchDishes,
  fetchCategories,
  fetchVotesForCode,
  submitVote,
  fetchContestSettings,
} from "@/lib/supabase-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChefHat, ThumbsUp, ThumbsDown, ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Vote = () => {
  const [code, setCode] = useState("");
  const [accessCodeId, setAccessCodeId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["contest-settings"],
    queryFn: fetchContestSettings,
  });

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes"],
    queryFn: fetchDishes,
    enabled: !!accessCodeId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: !!accessCodeId,
  });

  const { data: existingVotes = [] } = useQuery({
    queryKey: ["votes", accessCodeId],
    queryFn: () => fetchVotesForCode(accessCodeId!),
    enabled: !!accessCodeId,
  });

  const voteMutation = useMutation({
    mutationFn: ({
      dishId,
      categoryId,
      liked,
    }: {
      dishId: string;
      categoryId: string;
      liked: boolean;
    }) => submitVote(accessCodeId!, dishId, categoryId, liked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", accessCodeId] });
    },
    onError: () => {
      toast({ title: "Error al votar", description: "Inténtalo de nuevo", variant: "destructive" });
    },
  });

  const handleValidateCode = async () => {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const result = await validateAccessCode(code);
      if (result) {
        setAccessCodeId(result.id);
        toast({ title: "¡Bienvenido!", description: "Ya puedes votar por tus platos favoritos" });
      } else {
        toast({ title: "Código inválido", description: "Verifica tu código de acceso", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo validar el código", variant: "destructive" });
    }
    setValidating(false);
  };

  const getVote = (dishId: string, categoryId: string) =>
    existingVotes.find((v) => v.dish_id === dishId && v.category_id === categoryId);

  if (settings && !settings.voting_open) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Votación Cerrada</h2>
          <p className="text-muted-foreground mb-4">La votación ha finalizado. ¡Gracias por participar!</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio
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
            <ChefHat className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold">Accede para Votar</h2>
            <p className="text-muted-foreground mt-2">
              Introduce tu código de acceso para votar
            </p>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="Tu código (ej: ABC123)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
            />
            <Button onClick={handleValidateCode} disabled={validating || !code.trim()} className="w-full">
              {validating ? "Validando..." : "Acceder"}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Volver al inicio
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-serif font-bold">Votar</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-success" />
            {existingVotes.length} votos emitidos
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {dishes.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No hay platos para votar</p>
        ) : (
          <div className="space-y-8">
            {dishes.map((dish) => (
              <Card key={dish.id} className="overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3 aspect-[4/3] md:aspect-auto bg-muted">
                    {dish.image_url ? (
                      <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                        <ChefHat className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="flex-1 p-6">
                    <h3 className="text-2xl font-serif font-bold mb-1">{dish.name}</h3>
                    <p className="text-sm text-primary font-medium mb-2">por {dish.author}</p>
                    {dish.description && (
                      <p className="text-sm text-muted-foreground mb-4">{dish.description}</p>
                    )}
                    <div className="space-y-3">
                      {categories.map((cat) => {
                        const vote = getVote(dish.id, cat.id);
                        return (
                          <div key={cat.id} className="flex items-center justify-between gap-4 bg-muted/50 rounded-lg px-4 py-2">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={vote?.liked === true ? "default" : "outline"}
                                className="gap-1"
                                onClick={() => voteMutation.mutate({ dishId: dish.id, categoryId: cat.id, liked: true })}
                                disabled={voteMutation.isPending}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant={vote?.liked === false ? "destructive" : "outline"}
                                className="gap-1"
                                onClick={() => voteMutation.mutate({ dishId: dish.id, categoryId: cat.id, liked: false })}
                                disabled={voteMutation.isPending}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vote;
