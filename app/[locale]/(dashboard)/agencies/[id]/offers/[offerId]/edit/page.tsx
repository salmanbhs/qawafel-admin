"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferForm, type OfferFormValues } from "@/components/offers/OfferForm";
import { useOffer, useUpdateOffer } from "@/hooks/use-offers";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function EditOfferPage() {
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ locale: string; id: string; offerId: string }>();
  const { locale, id: agencyId, offerId } = params;
  const user = useAuthStore((s) => s.user);

  const { data: offer, isLoading } = useOffer(offerId);
  const updateOffer = useUpdateOffer(offerId);

  const handleSubmit = async (values: OfferFormValues) => {
    try {
      const { travelAgencyId, hotelIds, destinationIds, imageUrl, ...rest } = values;
      await updateOffer.mutateAsync({
        ...rest,
        ...(hotelIds !== undefined ? { hotelIds } : {}),
        ...(destinationIds ? { destinationIds } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });
      toast.success(t("updated"));
      router.push(`/${locale}/agencies/${agencyId}/offers/${offerId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold">{t("editOffer")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{offer?.nameAr || offer?.nameEn || tc("untitled")}</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm
            travelAgencyId={agencyId}
            defaultValues={offer}
            onSubmit={handleSubmit}
            isLoading={updateOffer.isPending}
            submitLabel={tc("save")}
            isSystemAdmin={user?.role === "SYSTEM_ADMIN"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
