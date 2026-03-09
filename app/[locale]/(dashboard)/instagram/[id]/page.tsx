"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Instagram,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useInstagramImport,
  useUpdateInstagramImport,
  useDismissImport,
} from "@/hooks/use-instagram-import";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";

/** Prisma Decimal comes as {s,e,d[]} — normalise to plain number. */
function toNumber(v: number | { s: number; e: number; d: number[] } | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && Array.isArray(v.d)) return v.s * v.d[0];
  return null;
}

export default function InstagramImportDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const t = useTranslations("instagram");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const { data: item, isLoading } = useInstagramImport(id);
  const updateImport = useUpdateInstagramImport(id);
  const dismissImport = useDismissImport(id);

  // Editable fields — initialize from data
  const [fields, setFields] = useState<Record<string, string | number | null>>({});
  const [initialized, setInitialized] = useState(false);

  if (item && !initialized) {
    setFields({
      extractedNameAr: item.extractedNameAr ?? "",
      extractedNameEn: item.extractedNameEn ?? "",
      extractedCheckInDate: item.extractedCheckInDate?.split("T")[0] ?? "",
      extractedCheckOutDate: item.extractedCheckOutDate?.split("T")[0] ?? "",
      extractedNumberOfDays: item.extractedNumberOfDays ?? "",
      extractedPrice: toNumber(item.extractedPrice) ?? "",
      extractedCurrency: item.extractedCurrency ?? "BHD",
      extractedDestination: item.extractedDestination ?? "",
      extractedHotelName: item.extractedHotelName ?? "",
    });
    setInitialized(true);
  }

  function updateField(key: string, value: string | number) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      await updateImport.mutateAsync({
        extractedNameAr: (fields.extractedNameAr as string) || undefined,
        extractedNameEn: (fields.extractedNameEn as string) || undefined,
        extractedCheckInDate: (fields.extractedCheckInDate as string) || undefined,
        extractedCheckOutDate: (fields.extractedCheckOutDate as string) || undefined,
        extractedNumberOfDays: fields.extractedNumberOfDays ? Number(fields.extractedNumberOfDays) : undefined,
        extractedPrice: fields.extractedPrice ? Number(fields.extractedPrice) : undefined,
        extractedCurrency: (fields.extractedCurrency as string) || undefined,
        extractedDestination: (fields.extractedDestination as string) || undefined,
        extractedHotelName: (fields.extractedHotelName as string) || undefined,
      });
      toast.success(t("updateSuccess2"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  function handleCreateOffer() {
    router.push(`/${locale}/offers/new?instagramImportId=${id}`);
  }

  async function handleDismiss() {
    try {
      await dismissImport.mutateAsync();
      toast.success(t("dismissed"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-[hsl(var(--muted-foreground))]">{t("notFound")}</p>
        <Link href={`/${locale}/instagram`}>
          <Button variant="outline" className="mt-4">
            {tc("back")}
          </Button>
        </Link>
      </div>
    );
  }

  const isNew = item.status === "NEW";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/instagram`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t("importDetail")}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={item.status} />
              {item.monitoredAccount && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  @{item.monitoredAccount.instagramUsername}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isNew && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={updateImport.isPending}
                className="gap-2"
              >
                {updateImport.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("saveChanges")}
              </Button>
              <ConfirmDialog
                title={t("dismissConfirm")}
                description={t("dismissWarning")}
                variant="destructive"
                onConfirm={handleDismiss}
                trigger={
                  <Button variant="outline" className="gap-2 text-[hsl(var(--destructive))]">
                    <XCircle className="h-4 w-4" />
                    {t("dismiss")}
                  </Button>
                }
              />
              <Button
                onClick={handleCreateOffer}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {t("createOffer")}
              </Button>
            </>
          )}
          {item.status === "OFFER_CREATED" && item.offerId && (
            <Link href={`/${locale}/offers/${item.offerId}`}>
              <Button className="gap-2">
                {t("viewOffer")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column — Image + raw data */}
        <div className="space-y-4">
          {/* Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("image")}</CardTitle>
            </CardHeader>
            <CardContent>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-full rounded-lg border border-[hsl(var(--border))]"
                />
              ) : (
                <div className="h-64 bg-[hsl(var(--muted))] rounded-lg flex items-center justify-center">
                  <Instagram className="h-16 w-16 text-[hsl(var(--muted-foreground))]" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instagram info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("instagramPost")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.instagramPostUrl && (
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">{t("postUrl")}</Label>
                  <a
                    href={item.instagramPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[hsl(var(--primary))] hover:underline mt-0.5"
                  >
                    {t("viewOnInstagram")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
              {item.travelAgency && (
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">{t("agency")}</Label>
                  <p className="text-sm mt-0.5">
                    {item.travelAgency.name || item.travelAgency.nameAr || item.travelAgency.nameEn}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">{tc("createdAt")}</Label>
                <p className="text-sm mt-0.5">{formatDate(item.createdAt, locale)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Caption */}
          {item.instagramCaption && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("caption")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-[hsl(var(--muted-foreground))]">
                  {item.instagramCaption}
                </p>
              </CardContent>
            </Card>
          )}

          {/* OCR Text */}
          {item.rawOcrText && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("ocrText")}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-[hsl(var(--muted))] p-3 rounded-lg text-[hsl(var(--foreground))] font-mono">
                  {item.rawOcrText}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Editable fields */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("extractedData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="ar">
                <TabsList className="w-full">
                  <TabsTrigger value="ar" className="flex-1">{tc("arabic")}</TabsTrigger>
                  <TabsTrigger value="en" className="flex-1">{tc("english")}</TabsTrigger>
                </TabsList>
                <TabsContent value="ar" className="mt-3">
                  <div className="space-y-3">
                    <div>
                      <Label>{t("nameAr")}</Label>
                      <Input
                        value={(fields.extractedNameAr as string) ?? ""}
                        onChange={(e) => updateField("extractedNameAr", e.target.value)}
                        disabled={!isNew}
                        dir="rtl"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="en" className="mt-3">
                  <div className="space-y-3">
                    <div>
                      <Label>{t("nameEn")}</Label>
                      <Input
                        value={(fields.extractedNameEn as string) ?? ""}
                        onChange={(e) => updateField("extractedNameEn", e.target.value)}
                        disabled={!isNew}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("checkInDate")}</Label>
                  <Input
                    type="date"
                    value={(fields.extractedCheckInDate as string) ?? ""}
                    onChange={(e) => updateField("extractedCheckInDate", e.target.value)}
                    disabled={!isNew}
                  />
                </div>
                <div>
                  <Label>{t("checkOutDate")}</Label>
                  <Input
                    type="date"
                    value={(fields.extractedCheckOutDate as string) ?? ""}
                    onChange={(e) => updateField("extractedCheckOutDate", e.target.value)}
                    disabled={!isNew}
                  />
                </div>
              </div>

              <div>
                <Label>{t("numberOfDays")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={fields.extractedNumberOfDays ?? ""}
                  onChange={(e) => updateField("extractedNumberOfDays", e.target.value)}
                  disabled={!isNew}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("price")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fields.extractedPrice ?? ""}
                    onChange={(e) => updateField("extractedPrice", e.target.value)}
                    disabled={!isNew}
                  />
                </div>
                <div>
                  <Label>{t("currency")}</Label>
                  <Input
                    value={(fields.extractedCurrency as string) ?? "BHD"}
                    onChange={(e) => updateField("extractedCurrency", e.target.value)}
                    disabled={!isNew}
                  />
                </div>
              </div>

              <div>
                <Label>{t("destination")}</Label>
                <Input
                  value={(fields.extractedDestination as string) ?? ""}
                  onChange={(e) => updateField("extractedDestination", e.target.value)}
                  disabled={!isNew}
                />
              </div>

              <div>
                <Label>{t("hotelName")}</Label>
                <Input
                  value={(fields.extractedHotelName as string) ?? ""}
                  onChange={(e) => updateField("extractedHotelName", e.target.value)}
                  disabled={!isNew}
                />
              </div>

              {isNew && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={updateImport.isPending}
                    className="flex-1 gap-2"
                  >
                    {updateImport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("saveChanges")}
                  </Button>
                  <Button
                    onClick={handleCreateOffer}
                    className="flex-1 gap-2"
                  >
                    {t("createOffer")}
                  </Button>
                </div>
              )}

              {item.status === "OFFER_CREATED" && item.offer && (
                <div className="rounded-lg border border-[hsl(var(--border))] p-3 bg-[hsl(var(--muted)/0.5)]">
                  <p className="text-sm font-medium mb-1">{t("viewOffer")}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {item.offer.nameAr || item.offer.nameEn}
                  </p>
                  <Link href={`/${locale}/offers/${item.offer.id}`}>
                    <Button variant="link" size="sm" className="px-0 mt-1">
                      {t("viewOffer")} →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
