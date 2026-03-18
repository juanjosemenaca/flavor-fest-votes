import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t("adminLogin.accessErrorTitle"), description: error.message, variant: "destructive" });
    } else {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="mb-4 flex justify-end">
          <LanguageSelector />
        </div>
        <div className="text-center mb-6">
          <GildaLogo className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-serif font-bold">{t("adminLogin.title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("adminLogin.subtitle")}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("adminLogin.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">{t("adminLogin.password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("adminLogin.signingIn") : t("adminLogin.signIn")}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="inline h-3 w-3 mr-1" /> {t("nav.backHome")}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
