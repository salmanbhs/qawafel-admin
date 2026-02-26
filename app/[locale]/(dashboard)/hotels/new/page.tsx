"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotelForm, type HotelFormValues } from "@/components/hotels/HotelForm";
import { useCreateHotel } from "@/hooks/use-hotels";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";
import type { Hotel } from "@/types/api";

export default function NewHotelPage() {
  const t = useTranslations("hotels");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const user = useAuthStore((s) => s.user);
  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";
  const createHotel = useCreateHotel();

  async function handleSubmit(values: HotelFormValues) {
    try {
      // For agency admins, backend auto-resolves travelAgencyId from the token.
      // For system admins, travelAgencyId must be supplied in the form.
      const payload: Record<string, unknown> = { ...values };
      if (!isSystemAdmin) {
        delete payload.travelAgencyId;
      }

      const hotel = await createHotel.mutateAsync(payload as Partial<Hotel>);
      toast.success(t("createSuccess"));
      router.push(`/${locale}/hotels/${hotel.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/hotels`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("newHotel")}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "ar" ? "معلومات الفندق" : "Hotel Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HotelForm
            onSubmit={handleSubmit}
            isLoading={createHotel.isPending}
            submitLabel={t("create")}
            isSystemAdmin={isSystemAdmin}
            travelAgencyId={user?.travelAgencyId || undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
