import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchDishes,
  fetchCategories,
  fetchContestSettings,
  fetchAllVotes,
  fetchEditions,
  fetchEditionByYear,
  uploadDishPhoto,
  generateAccessCode,
  getEventPhotoUrl,
} from "@/lib/supabase-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { QRCodeSVG } from "qrcode.react";
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
  Users,
  Pencil,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

const AdminDashboard = () => {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [newEditionYear, setNewEditionYear] = useState<string>("");
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

  const { data: editions = [] } = useQuery({
    queryKey: ["editions"],
    queryFn: fetchEditions,
    enabled: !!session,
  });

  const effectiveYear = selectedYear ?? editions[0]?.year ?? new Date().getFullYear();
  const editionId = editions.find((e) => e.year === effectiveYear)?.id ?? null;
  const isLegacyMode = editions.length === 0;

  const { data: dishes = [] } = useQuery({
    queryKey: ["dishes", editionId ?? "legacy"],
    queryFn: () => fetchDishes(editionId ?? undefined),
    enabled: !!session && (!!editionId || isLegacyMode),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", editionId ?? "legacy"],
    queryFn: () => fetchCategories(editionId ?? undefined),
    enabled: !!session && (!!editionId || isLegacyMode),
  });
  const { data: settings } = useQuery({
    queryKey: ["contest-settings", effectiveYear],
    queryFn: async () => {
      try {
        const edition = await fetchEditionByYear(effectiveYear);
        if (edition) return { contest_name: edition.contest_name, voting_open: edition.voting_open, results_published: edition.results_published, id: edition.id };
      } catch {
        /* editions table may not exist */
      }
      return fetchContestSettings();
    },
    enabled: !!session,
  });
  const { data: votes = [] } = useQuery({
    queryKey: ["all-votes", editionId ?? "legacy"],
    queryFn: () => fetchAllVotes(editionId ?? undefined),
    enabled: !!session && (!!editionId || isLegacyMode),
  });
  const { data: voteAdjustments = [] } = useQuery({
    queryKey: ["vote-adjustments", editionId ?? "legacy"],
    queryFn: async () => {
      const { data, error } = editionId
        ? await supabase.from("vote_adjustments").select("*").eq("edition_id", editionId)
        : await supabase.from("vote_adjustments").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session && (!!editionId || isLegacyMode),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ["access-codes", editionId ?? "legacy"],
    queryFn: async () => {
      const q = supabase.from("access_codes").select("*").order("created_at", { ascending: false });
      const { data, error } = editionId ? await q.eq("edition_id", editionId) : await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session && (!!editionId || isLegacyMode),
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ["attendees", editionId ?? "legacy"],
    queryFn: async () => {
      const q = supabase.from("attendees").select("*").order("created_at", { ascending: false });
      const { data, error } = editionId ? await q.eq("edition_id", editionId) : await q;
      if (error) {
        if ((error as { code?: string }).code === "PGRST205") return [];
        throw error;
      }
      return data ?? [];
    },
    enabled: !!session && (!!editionId || isLegacyMode),
  });

  const { data: participantTeams = [] } = useQuery({
    queryKey: ["participant-teams", editionId ?? "legacy"],
    queryFn: async () => {
      const q = supabase.from("participant_teams").select("*").order("team_number", { ascending: true });
      const { data, error } = editionId ? await q.eq("edition_id", editionId) : await q;
      if (error) {
        if ((error as { code?: string }).code === "PGRST205") return [];
        throw error;
      }
      return data ?? [];
    },
    enabled: !!session && (!!editionId || isLegacyMode),
  });

  const { data: eventPhotos = [] } = useQuery({
    queryKey: ["event-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_photos")
        .select("id, storage_path, is_hidden, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session,
  });

  const { data: participantTeamMembers = [] } = useQuery({
    queryKey: ["participant-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_team_members")
        .select("*");
      if (error) {
        if ((error as { code?: string }).code === "PGRST205") return [];
        throw error;
      }
      return data ?? [];
    },
    enabled: !!session,
  });

  // --- Dish Management ---
  const [newDish, setNewDish] = useState({ name: "", teamId: "", description: "" });
  const [dishPhoto, setDishPhoto] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const addDishMutation = useMutation({
    mutationFn: async () => {
      if (!editionId && !isLegacyMode) throw new Error("Selecciona una edición");
      const team = participantTeams.find((t) => t.id === newDish.teamId);
      if (!team) throw new Error("Selecciona un equipo");
      let imageUrl: string | null = null;
      if (dishPhoto) imageUrl = await uploadDishPhoto(dishPhoto);
      const authorLabel = `Equipo ${team.team_number}: ${team.title}`;
      const { error } = await supabase.from("dishes").insert({
        name: newDish.name,
        author: authorLabel,
        team_id: team.id,
        ...(editionId && { edition_id: editionId }),
        description: newDish.description || null,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      setNewDish({ name: "", teamId: "", description: "" });
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
      if (!editionId && !isLegacyMode) throw new Error("Selecciona una edición");
      const { error } = await supabase.from("categories").insert({
        name: newCategory.name,
        description: newCategory.description || null,
        display_order: categories.length,
        ...(editionId && { edition_id: editionId }),
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
  const [newAttendee, setNewAttendee] = useState({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [editingAttendeeId, setEditingAttendeeId] = useState<string | null>(null);
  const [editingAttendee, setEditingAttendee] = useState({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [newTeamTitle, setNewTeamTitle] = useState("");
  const [newTeamMemberIds, setNewTeamMemberIds] = useState<string[]>([]);
  const assignedAttendeeIds = new Set(participantTeamMembers.map((m) => m.attendee_id));
  const availableAttendeesForNewTeam = attendees.filter((attendee) => !assignedAttendeeIds.has(attendee.id));

  const generateCodesMutation = useMutation({
    mutationFn: async () => {
      if (!editionId && !isLegacyMode) throw new Error("Selecciona una edición");
      const codes = Array.from({ length: numCodes }, () => ({
        code: generateAccessCode(),
        ...(editionId && { edition_id: editionId }),
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

  const addAttendeeMutation = useMutation({
    mutationFn: async () => {
      if (!editionId && !isLegacyMode) throw new Error("Selecciona una edición");
      const fullName = newAttendee.fullName.trim();
      if (!fullName) return;

      const { error } = await supabase.from("attendees").insert({
        full_name: fullName,
        email: newAttendee.email.trim() || null,
        phone: newAttendee.phone.trim() || null,
        notes: newAttendee.notes.trim() || null,
        ...(editionId && { edition_id: editionId }),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      setNewAttendee({ fullName: "", email: "", phone: "", notes: "" });
      toast({ title: "Asistente anadido" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deleteAttendeeMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase.from("attendees").delete().eq("id", attendeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      toast({ title: "Asistente eliminado" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const updateAttendeeMutation = useMutation({
    mutationFn: async () => {
      if (!editingAttendeeId) return;
      const fullName = editingAttendee.fullName.trim();
      if (!fullName) return;

      const { error } = await supabase
        .from("attendees")
        .update({
          full_name: fullName,
          email: editingAttendee.email.trim() || null,
          phone: editingAttendee.phone.trim() || null,
          notes: editingAttendee.notes.trim() || null,
        })
        .eq("id", editingAttendeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      setEditingAttendeeId(null);
      setEditingAttendee({ fullName: "", email: "", phone: "", notes: "" });
      toast({ title: "Asistente actualizado" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const addParticipantTeamMutation = useMutation({
    mutationFn: async () => {
      if (!editionId && !isLegacyMode) throw new Error("Selecciona una edición");
      const title = newTeamTitle.trim();
      if (!title) throw new Error("El equipo necesita un titulo");
      const selectedAvailableMemberIds = newTeamMemberIds.filter((id) => !assignedAttendeeIds.has(id));
      if (selectedAvailableMemberIds.length === 0) throw new Error("Selecciona al menos un asistente");

      const { data: teamData, error: teamError } = await supabase
        .from("participant_teams")
        .insert({ title, ...(editionId && { edition_id: editionId }) })
        .select("id")
        .single();
      if (teamError) throw teamError;

      const { error: membersError } = await supabase.from("participant_team_members").insert(
        selectedAvailableMemberIds.map((attendeeId) => ({
          team_id: teamData.id,
          attendee_id: attendeeId,
        })),
      );
      if (membersError) {
        await supabase.from("participant_teams").delete().eq("id", teamData.id);
        throw membersError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-teams"] });
      queryClient.invalidateQueries({ queryKey: ["participant-team-members"] });
      setNewTeamTitle("");
      setNewTeamMemberIds([]);
      toast({ title: "Equipo participante creado" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deleteParticipantTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("participant_teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-teams"] });
      queryClient.invalidateQueries({ queryKey: ["participant-team-members"] });
      toast({ title: "Equipo eliminado" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const beginEditAttendee = (attendee: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }) => {
    setEditingAttendeeId(attendee.id);
    setEditingAttendee({
      fullName: attendee.full_name,
      email: attendee.email ?? "",
      phone: attendee.phone ?? "",
      notes: attendee.notes ?? "",
    });
  };

  const toggleNewTeamMember = (attendeeId: string, checked: boolean) => {
    setNewTeamMemberIds((prev) => {
      if (checked) return prev.includes(attendeeId) ? prev : [...prev, attendeeId];
      return prev.filter((id) => id !== attendeeId);
    });
  };

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

  // --- Settings --- (editions or contest_settings)
  const toggleResultsMutation = useMutation({
    mutationFn: async (published: boolean) => {
      if (!settings?.id) return;
      const table = editionId ? "editions" : "contest_settings";
      const { error } = await supabase.from(table).update({ results_published: published }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-settings"] });
      queryClient.invalidateQueries({ queryKey: ["editions"] });
    },
  });

  const toggleVotingMutation = useMutation({
    mutationFn: async (open: boolean) => {
      if (!settings?.id) return;
      const table = editionId ? "editions" : "contest_settings";
      const { error } = await supabase.from(table).update({ voting_open: open }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-settings"] });
      queryClient.invalidateQueries({ queryKey: ["editions"] });
    },
  });

  const deleteEventPhotoMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      const { error: delDb } = await supabase.from("event_photos").delete().eq("id", id);
      if (delDb) throw delDb;
      await supabase.storage.from("event-photos").remove([storagePath]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-photos"] });
      queryClient.invalidateQueries({ queryKey: ["event-photos-carousel"] });
      toast({ title: "Foto eliminada" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const toggleEventPhotoVisibilityMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const { error } = await supabase.from("event_photos").update({ is_hidden: !isHidden }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-photos"] });
      queryClient.invalidateQueries({ queryKey: ["event-photos-carousel"] });
      toast({ title: "Visibilidad actualizada" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const setActiveEditionMutation = useMutation({
    mutationFn: async (editionIdToActivate: string) => {
      const { error: deactivate } = await supabase
        .from("editions")
        .update({ is_active: false })
        .eq("is_active", true);
      if (deactivate) throw deactivate;
      const { error: activate } = await supabase.from("editions").update({ is_active: true }).eq("id", editionIdToActivate);
      if (activate) throw activate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editions"] });
      queryClient.invalidateQueries({ queryKey: ["edition-current"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["event-photos-carousel"] });
      toast({ title: "Edición activa en la landing" });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const createEditionMutation = useMutation({
    mutationFn: async (year: number) => {
      const { error } = await supabase.from("editions").insert({
        year,
        contest_name: "AITORTILLA",
        voting_open: false,
        results_published: false,
      });
      if (error) throw error;
    },
    onSuccess: (_, year) => {
      queryClient.invalidateQueries({ queryKey: ["editions"] });
      setNewEditionYear("");
      setSelectedYear(year);
      toast({ title: `Edición ${year} creada` });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <GildaLogo className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-serif font-bold">{t("admin.title")}</h1>
            <div className="flex items-center gap-2">
              {editions.length > 0 && (
                <>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
                    value={effectiveYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {editions.map((e) => (
                      <option key={e.id} value={e.year}>
                        {e.year}
                        {(e as { is_active?: boolean }).is_active ? " ✓" : ""}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editionId && setActiveEditionMutation.mutate(editionId)}
                    disabled={setActiveEditionMutation.isPending || !editionId || (editions.find((e) => e.id === editionId) as { is_active?: boolean })?.is_active}
                  >
                    Mostrar en landing
                  </Button>
                </>
              )}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Año (ej. 2025)"
                  className="h-9 w-24 text-center"
                  value={newEditionYear}
                  onChange={(e) => setNewEditionYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  min={2000}
                  max={2100}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const year = parseInt(newEditionYear, 10);
                    if (isNaN(year) || year < 2000 || year > 2100) {
                      toast({ title: "Introduce un año válido (2000-2100)", variant: "destructive" });
                      return;
                    }
                    if (editions.some((e) => e.year === year)) {
                      toast({ title: `La edición ${year} ya existe`, variant: "destructive" });
                      return;
                    }
                    createEditionMutation.mutate(year);
                  }}
                  disabled={createEditionMutation.isPending || !newEditionYear}
                >
                  Crear edición
                </Button>
              </div>
            </div>
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
            <TabsTrigger value="attendees" className="gap-1"><Users className="h-4 w-4" /> Asistentes</TabsTrigger>
            <TabsTrigger value="teams" className="gap-1"><Users className="h-4 w-4" /> Equipos</TabsTrigger>
            <TabsTrigger value="results" className="gap-1"><Trophy className="h-4 w-4" /> {t("admin.tab.results")}</TabsTrigger>
            <TabsTrigger value="photos" className="gap-1"><Camera className="h-4 w-4" /> Fotos</TabsTrigger>
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
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={newDish.teamId}
                      onChange={(e) => setNewDish({ ...newDish, teamId: e.target.value })}
                    >
                      <option value="">Selecciona equipo</option>
                      {participantTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          Equipo {team.team_number}: {team.title}
                        </option>
                      ))}
                    </select>
                    {participantTeams.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Crea equipos en la pestaña Equipos primero.</p>
                    )}
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
                <Button onClick={() => addDishMutation.mutate()} disabled={!newDish.name || !newDish.teamId || addDishMutation.isPending} className="gap-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {accessCodes.map((c) => {
                  const voteUrl = `${window.location.origin}/votar?code=${c.code}`;
                  return (
                  <div
                    key={c.id}
                    className={`text-center p-3 rounded-lg border font-mono text-sm space-y-2 flex flex-col items-center ${
                      c.used
                        ? "bg-destructive/20 border-destructive/50"
                        : "bg-card"
                    }`}
                  >
                    <QRCodeSVG value={voteUrl} size={80} level="M" className="mx-auto" />
                    <div className={`font-semibold ${c.used ? "text-destructive" : ""}`}>{c.code}</div>
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
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ATTENDEES TAB */}
          <TabsContent value="attendees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Alta de asistentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre completo</Label>
                    <Input
                      value={newAttendee.fullName}
                      onChange={(e) => setNewAttendee((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Email (opcional)</Label>
                    <Input
                      type="email"
                      value={newAttendee.email}
                      onChange={(e) => setNewAttendee((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Telefono (opcional)</Label>
                    <Input
                      value={newAttendee.phone}
                      onChange={(e) => setNewAttendee((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Notas (opcional)</Label>
                    <Input
                      value={newAttendee.notes}
                      onChange={(e) => setNewAttendee((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => addAttendeeMutation.mutate()}
                  disabled={!newAttendee.fullName.trim() || addAttendeeMutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Anadir asistente
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Asistentes registrados: {attendees.length}</CardTitle>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay asistentes todavia. Si acabas de desplegar esto, aplica la nueva migracion de Supabase.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attendees.map((attendee) => (
                      <div key={attendee.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                        {editingAttendeeId === attendee.id ? (
                          <div className="w-full space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Nombre completo"
                                value={editingAttendee.fullName}
                                onChange={(e) => setEditingAttendee((prev) => ({ ...prev, fullName: e.target.value }))}
                              />
                              <Input
                                placeholder="Email (opcional)"
                                type="email"
                                value={editingAttendee.email}
                                onChange={(e) => setEditingAttendee((prev) => ({ ...prev, email: e.target.value }))}
                              />
                              <Input
                                placeholder="Telefono (opcional)"
                                value={editingAttendee.phone}
                                onChange={(e) => setEditingAttendee((prev) => ({ ...prev, phone: e.target.value }))}
                              />
                              <Input
                                placeholder="Notas (opcional)"
                                value={editingAttendee.notes}
                                onChange={(e) => setEditingAttendee((prev) => ({ ...prev, notes: e.target.value }))}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateAttendeeMutation.mutate()}
                                disabled={!editingAttendee.fullName.trim() || updateAttendeeMutation.isPending}
                              >
                                Guardar cambios
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAttendeeId(null);
                                  setEditingAttendee({ fullName: "", email: "", phone: "", notes: "" });
                                }}
                                disabled={updateAttendeeMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium">{attendee.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {attendee.email || "-"} | {attendee.phone || "-"}
                              </p>
                              {attendee.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{attendee.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => beginEditAttendee(attendee)}
                                disabled={deleteAttendeeMutation.isPending || updateAttendeeMutation.isPending}
                              >
                                <Pencil className="h-3 w-3" /> Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => deleteAttendeeMutation.mutate(attendee.id)}
                                disabled={deleteAttendeeMutation.isPending || updateAttendeeMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" /> {t("common.delete")}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEAMS TAB */}
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Alta de equipos participantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titulo de equipo / nombre del pintxo</Label>
                  <Input value={newTeamTitle} onChange={(e) => setNewTeamTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Miembros del equipo (asistentes)</Label>
                  {availableAttendeesForNewTeam.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay asistentes disponibles: todos ya estan asignados a un equipo.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-lg border">
                      {availableAttendeesForNewTeam.map((attendee) => (
                        <label key={attendee.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={newTeamMemberIds.includes(attendee.id)}
                            onCheckedChange={(checked) => toggleNewTeamMember(attendee.id, checked === true)}
                          />
                          <span>{attendee.full_name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => addParticipantTeamMutation.mutate()}
                  disabled={
                    availableAttendeesForNewTeam.length === 0 ||
                    !newTeamTitle.trim() ||
                    newTeamMemberIds.length === 0 ||
                    addParticipantTeamMutation.isPending
                  }
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Crear equipo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Equipos registrados: {participantTeams.length}</CardTitle>
              </CardHeader>
              <CardContent>
                {participantTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay equipos todavia. Si acabas de desplegar esto, aplica la nueva migracion de Supabase.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {participantTeams.map((team) => {
                      const memberIds = participantTeamMembers
                        .filter((m) => m.team_id === team.id)
                        .map((m) => m.attendee_id);
                      const memberNames = attendees
                        .filter((a) => memberIds.includes(a.id))
                        .map((a) => a.full_name);

                      return (
                        <div key={team.id} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                Equipo {team.team_number}: {team.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {memberNames.length > 0 ? memberNames.join(", ") : "Sin miembros"}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                              onClick={() => deleteParticipantTeamMutation.mutate(team.id)}
                              disabled={deleteParticipantTeamMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" /> {t("common.delete")}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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

          {/* PHOTOS TAB */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Fotos del evento ({eventPhotos.length})</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Las fotos ocultas no se muestran en el carrusel de la landing.
                </p>
              </CardHeader>
              <CardContent>
                {eventPhotos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay fotos. Los asistentes pueden subirlas desde <Link to="/fotos" className="text-primary underline">/fotos</Link>.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {eventPhotos.map((photo) => (
                      <div key={photo.id} className={`group relative rounded-lg overflow-hidden border ${photo.is_hidden ? "opacity-50" : ""}`}>
                        <img
                          src={getEventPhotoUrl(photo.storage_path)}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleEventPhotoVisibilityMutation.mutate({
                              id: photo.id,
                              isHidden: photo.is_hidden,
                            })}
                            disabled={toggleEventPhotoVisibilityMutation.isPending}
                          >
                            {photo.is_hidden ? (
                              <><Eye className="h-4 w-4" /> Mostrar</>
                            ) : (
                              <><EyeOff className="h-4 w-4" /> Ocultar</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteEventPhotoMutation.mutate({
                              id: photo.id,
                              storagePath: photo.storage_path,
                            })}
                            disabled={deleteEventPhotoMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {photo.is_hidden && (
                          <span className="absolute top-1 left-1 text-xs bg-muted px-2 py-0.5 rounded">Oculta</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
