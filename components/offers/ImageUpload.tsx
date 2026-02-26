"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUploadOfferImage } from "@/hooks/use-offers";
import { getApiErrorMessage } from "@/lib/api";

interface ImageUploadProps {
  offerId: string;
}

export function ImageUpload({ offerId }: ImageUploadProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const upload = useUploadOfferImage(offerId);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(tc("invalidFileType"));
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    try {
      await upload.mutateAsync(formData);
      toast.success(t("imageUploaded"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {upload.isPending ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("extracting")}</p>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("dropImageHere")}</p>
            <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
          </div>
          <Button type="button" variant="outline" size="sm">
            <Upload className="me-2 h-4 w-4" />
            {t("uploadImage")}
          </Button>
        </>
      )}
    </div>
  );
}
