"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferForm, type OfferFormValues } from "@/components/offers/OfferForm";
import { useCreateOffer } from "@/hooks/use-offers";
import { useAgencies } from "@/hooks/use-agencies";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function NewOfferPage() {
  const t = useTranslations("offers");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";
  const isAgencyRole =
    user?.role === "TRAVEL_AGENCY_ADMIN" ||
    user?.role === "TRAVEL_AGENCY_STAFF";
  const myAgencyId = user?.travelAgencyId ?? undefined;

  // For agency users, agency is fixed. For system admin, they pick one.
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(
    isAgencyRole && myAgencyId ? myAgencyId : ""
  );

  const { data: agenciesData, isLoading: agenciesLoading } = useAgencies({
    limit: 100,
  });
  const agencies = agenciesData?.data ?? [];

  const createOffer = useCreateOffer();

  const resolvedAgencyId = isAdmin ? selectedAgencyId : myAgencyId;

  async function handleSubmit(values: OfferFormValues) {
    if (!resolvedAgencyId) return;
    try {
      const { hotelIds, destinationIds, imageUrl, ...rest } = values;
      const offer = await createOffer.mutateAsync({
        ...rest,
        travelAgencyId: resolvedAgencyId,
        ...(hotelIds && hotelIds.length > 0 ? { hotelIds } : {}),
        ...(destinationIds && destinationIds.length > 0 ? { destinationIds } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });
      toast.success(t("created"));
      router.push(`/${locale}/agencies/${resolvedAgencyId}/offers/${offer.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/offers`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("newOffer")}</h1>
      </div>

      {/* Agency picker — System Admin only */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {locale === "ar" ? "اختر الوكالة" : "Select Agency"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agenciesLoading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              <Select
                value={selectedAgencyId}
                onValueChange={setSelectedAgencyId}
              >
                <SelectTrigger className="w-64">
                  <SelectValue
                    placeholder={
                      locale === "ar"
                        ? "اختر وكالة سفر..."
                        : "Choose a travel agency..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nameAr || a.nameEn || a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {/* Offer form — shown once agency is resolved */}
      {resolvedAgencyId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("offerDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OfferForm
              travelAgencyId={resolvedAgencyId}
              onSubmit={handleSubmit}
              isLoading={createOffer.isPending}
              submitLabel={t("createOffer")}
              isSystemAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      ) : isAdmin ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))] px-1">
          {locale === "ar"
            ? "اختر وكالة أولاً لعرض نموذج إنشاء العرض."
            : "Select an agency above to continue."}
        </p>
      ) : null}
    </div>
  );
}
