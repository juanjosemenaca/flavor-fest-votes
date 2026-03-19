import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { uploadEventPhoto, fetchCurrentEdition } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GildaLogo from "@/components/GildaLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/i18n";
import { ArrowLeft, Camera, Upload, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const MAX_SIZE_MB = 5;

const UploadPhotos = () => {
  const { t } = useI18n();
  const { data: edition } = useQuery({ queryKey: ["current-edition"], queryFn: fetchCurrentEdition });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: `${f.name} supera ${MAX_SIZE_MB}MB`, variant: "destructive" });
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploaded(0);
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadEventPhoto(files[i], edition?.id);
        ok++;
        setUploaded(ok);
      } catch (err) {
        toast({
          title: t("common.error"),
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast({ title: `${ok} foto${ok > 1 ? "s" : ""} subida${ok > 1 ? "s" : ""} correctamente` });
      setFiles([]);
      setUploaded(0);
    }
  };

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
            <h1 className="text-xl font-serif font-bold">{t("photos.title")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <Camera className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-serif font-bold">{t("photos.subtitle")}</h2>
              <p className="text-muted-foreground text-sm">{t("photos.description")}</p>
            </div>

            <div className="space-y-4">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={handleSelect}
              />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                {t("photos.select")}
              </Button>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {files.length} foto{files.length !== 1 ? "s" : ""} seleccionada{files.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="relative group">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="animate-pulse">{t("photos.uploading")}</span>
                        {uploaded > 0 && ` (${uploaded}/${files.length})`}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {t("photos.upload")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG, GIF o WebP. Máx. {MAX_SIZE_MB}MB por imagen.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPhotos;
