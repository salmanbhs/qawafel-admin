"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { OfferForm } from "@/components/offers/OfferForm";
import { useOffer, useUpdateOffer } from "@/hooks/use-offers";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";
import type { UpdateOfferPayload } from "@/types/api";

export default function OfferEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("offers");

  const offerId = params.id;
  const user = useAuthStore((s) => s.user);
  const isAdminUser = user?.role === "SYSTEM_ADMIN";

  const { data: offer, isLoading } = useOffer(offerId);
  const updateOffer = useUpdateOffer(offerId);

  const handleSubmit = async (values: any) => {
    const { hotelIds, destinations, imageUrl, roomOptions, meals, transports, numberOfDays, ...rest } = values;

    try {
      await updateOffer.mutateAsync({
        ...rest,
        ...(numberOfDays !== "" && numberOfDays !== undefined ? { numberOfDays } : {}),
        ...(hotelIds && hotelIds.length > 0 ? { hotelIds } : {}),
        ...(destinations && destinations.length > 0 ? { destinations } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        roomOptions: roomOptions.map(({ id, ...opt }: any) => opt),
        ...(meals && meals.length > 0 ? { meals } : {}),
        ...(transports && transports.length > 0 ? { transports } : {}),
      } as UpdateOfferPayload);
      toast.success(t("updateSuccess"));
      router.push(`/${locale}/offers/${offerId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {locale === "ar" ? "رجوع" : "Back"}
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{t("editOffer")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("editOfferDescription")}</p>
      </div>

      {offer && (
        <OfferForm
          defaultValues={offer}
          onSubmit={handleSubmit}
          isLoading={updateOffer.isPending}
          submitLabel={t("update")}
          isSystemAdmin={isAdminUser}
          travelAgencyId={offer.travelAgencyId}
        />
      )}
    </div>
  );
}
