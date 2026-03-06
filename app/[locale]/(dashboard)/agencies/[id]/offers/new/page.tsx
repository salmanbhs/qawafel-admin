"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferForm, type OfferFormValues } from "@/components/offers/OfferForm";
import { useCreateOffer } from "@/hooks/use-offers";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function NewOfferPage() {
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ locale: string; id: string }>();
  const agencyId = params.id;
  const locale = params.locale;
  const user = useAuthStore((s) => s.user);

  const createOffer = useCreateOffer();

  const handleSubmit = async (values: OfferFormValues) => {
    try {
      const { hotelIds, destinations, imageUrl, roomOptions, meals, transports, numberOfDays, ...rest } = values;
      const offer = await createOffer.mutateAsync({
        ...rest,
        ...(numberOfDays !== "" && numberOfDays !== undefined ? { numberOfDays } : {}),
        travelAgencyId: agencyId,
        ...(hotelIds && hotelIds.length > 0 ? { hotelIds } : {}),
        ...(destinations && destinations.length > 0 ? { destinations } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        roomOptions: roomOptions.map(({ id, ...opt }: any) => opt),
        ...(meals && meals.length > 0 ? { meals } : {}),
        ...(transports && transports.length > 0 ? { transports } : {}),
      });
      toast.success(t("created"));
      router.push(`/${locale}/agencies/${agencyId}/offers/${offer.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleSubmitAndContinue = async (values: OfferFormValues) => {
    try {
      const { hotelIds, destinations, imageUrl, roomOptions, meals, transports, numberOfDays, ...rest } = values;
      await createOffer.mutateAsync({
        ...rest,
        ...(numberOfDays !== "" && numberOfDays !== undefined ? { numberOfDays } : {}),
        travelAgencyId: agencyId,
        ...(hotelIds && hotelIds.length > 0 ? { hotelIds } : {}),
        ...(destinations && destinations.length > 0 ? { destinations } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        roomOptions: roomOptions.map(({ id, ...opt }: any) => opt),
        ...(meals && meals.length > 0 ? { meals } : {}),
        ...(transports && transports.length > 0 ? { transports } : {}),
      });
      toast.success(t("createdAndContinue"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold">{t("newOffer")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("offerDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm
            travelAgencyId={agencyId}
            onSubmit={handleSubmit}
            onSubmitAndContinue={handleSubmitAndContinue}
            isLoading={createOffer.isPending}
            submitLabel={t("createOffer")}
            submitAndContinueLabel={t("createAndAddAnother")}
            isSystemAdmin={user?.role === "SYSTEM_ADMIN"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
