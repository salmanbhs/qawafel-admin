"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirmExtraction } from "@/hooks/use-offers";
import { getApiErrorMessage } from "@/lib/api";
import type { OfferImage, ExtractedData } from "@/types/api";

interface OcrConfirmationProps {
  image: OfferImage;
  offerId: string;
  onConfirmed: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  nameAr: "الاسم (عربي)",
  nameEn: "Name (EN)",
  descriptionAr: "الوصف (عربي)",
  descriptionEn: "Description (EN)",
  hotelNameAr: "اسم الفندق (عربي)",
  hotelNameEn: "Hotel Name (EN)",
  price: "السعر / Price",
  currency: "العملة / Currency",
  checkInDate: "تاريخ الوصول / Check-in",
  checkOutDate: "تاريخ المغادرة / Check-out",
  bedCount: "عدد الأسرة / Beds",
  maxGuests: "الضيوف / Max Guests",
};

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? "bg-green-500" : score >= 0.7 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8">{pct}%</span>
    </div>
  );
}

export function OcrConfirmation({ image, offerId, onConfirmed }: OcrConfirmationProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const confirmExtraction = useConfirmExtraction(offerId, image.id);

  const extractedData: ExtractedData | null = image.extractedData ?? null;
  const fields = extractedData ? Object.entries(extractedData) : [];
  const highConfidence = fields.filter(([, f]) => (f as { confidence: number }).confidence >= 0.85).map(([k]) => k);

  const [selected, setSelected] = useState<string[]>(highConfidence);

  if (!extractedData || fields.length === 0) return null;

  const toggle = (key: string) =>
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const handleApply = async () => {
    try {
      await confirmExtraction.mutateAsync({ confirmedFields: selected });
      toast.success(t("extractionApplied"));
      onConfirmed();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h4 className="font-medium">{t("ocrResults")}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{t("selectFieldsToApply")}</p>

      <div className="space-y-3">
        {fields.map(([key, fieldData]) => {
          const f = fieldData as { value: unknown; confidence: number };
          const label = FIELD_LABELS[key] || key;
          const isChecked = selected.includes(key);
          return (
            <div
              key={key}
              className={`rounded-md border p-3 cursor-pointer transition-colors ${
                isChecked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => toggle(key)}
            >
              <div className="flex items-start gap-3">
                <Checkbox checked={isChecked} onCheckedChange={() => toggle(key)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    {f.confidence < 0.7 && (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm truncate mt-0.5">{String(f.value ?? "—")}</p>
                  <ConfidenceBar score={f.confidence} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          onClick={handleApply}
          disabled={selected.length === 0 || confirmExtraction.isPending}
        >
          {confirmExtraction.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t("applySelected")} ({selected.length})
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSelected(fields.map(([k]) => k))}>
          {tc("selectAll")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
          {tc("deselectAll")}
        </Button>
      </div>
    </div>
  );
}
