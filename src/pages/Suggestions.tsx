import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MAX_LEN = 5000;

const Suggestions = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      toast({ title: t("common.error"), description: t("suggestions.emptyError"), variant: "destructive" });
      return;
    }
    if (trimmed.length > MAX_LEN) {
      toast({ title: t("common.error"), description: t("suggestions.tooLongError"), variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("suggestions").insert({ body: trimmed });
    setSending(false);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("suggestions.successTitle"), description: t("suggestions.successDescription") });
    setBody("");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" aria-label={t("nav.backHome")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <GildaLogo decorative className="h-9 w-9 text-primary shrink-0" />
            <h1 className="text-lg font-serif font-bold sm:text-xl">{t("suggestions.title")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-10">
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t("suggestions.lead")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("suggestions.placeholder")}
            className="min-h-[180px] resize-y text-sm"
            maxLength={MAX_LEN}
            disabled={sending}
            aria-label={t("suggestions.placeholder")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("suggestions.charHint", { max: String(MAX_LEN) })}</span>
            <span>
              {body.length}/{MAX_LEN}
            </span>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("suggestions.sending")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("suggestions.submit")}
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">{t("suggestions.privacyNote")}</p>
      </main>
    </div>
  );
};

export default Suggestions;
