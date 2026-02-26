"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Trash2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { OcrConfirmation } from "./OcrConfirmation";
import { useDeleteOfferImage } from "@/hooks/use-offers";
import { getApiErrorMessage } from "@/lib/api";
import type { OfferImage } from "@/types/api";

interface ImageGalleryProps {
  offerId: string;
  images: OfferImage[];
}

export function ImageGallery({ offerId, images }: ImageGalleryProps) {
  const t = useTranslations("offers");
  const deleteImage = useDeleteOfferImage(offerId);

  const handleDelete = async (imageId: string) => {
    try {
      await deleteImage.mutateAsync(imageId);
      toast.success(t("imageDeleted"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      {images.map((img) => (
        <div key={img.id} className="rounded-lg border bg-card overflow-hidden">
          <div className="relative aspect-video w-full bg-muted">
            <Image
              src={img.imageUrl}
              alt={img.originalFilename || "offer image"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute top-2 end-2 flex gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {img.extractionStatus === "COMPLETED" ? (
                  <><CheckCircle2 className="me-1 h-3 w-3 text-green-500" />{t("extracted")}</>
                ) : img.extractionStatus === "PROCESSING" ? (
                  <><Clock className="me-1 h-3 w-3 text-yellow-500" />{t("processing")}</>
                ) : (
                  t("pending")
                )}
              </Badge>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              {img.originalFilename || img.imageUrl.split("/").pop()}
            </span>
            <ConfirmDialog
              title={t("deleteImage")}
              description={t("deleteImageConfirm")}
              onConfirm={() => handleDelete(img.id)}
              isLoading={deleteImage.isPending}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
          {img.extractionStatus === "COMPLETED" && img.extractedData && (
            <div className="px-3 pb-3">
              <OcrConfirmation image={img} offerId={offerId} onConfirmed={() => {}} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
