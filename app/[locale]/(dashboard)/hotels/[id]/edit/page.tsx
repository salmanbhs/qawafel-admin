"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HotelForm, type HotelFormValues } from "@/components/hotels/HotelForm";
import { useHotel, useUpdateHotel } from "@/hooks/use-hotels";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";
import type { Hotel } from "@/types/api";

export default function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("hotels");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const user = useAuthStore((s) => s.user);
  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

  const { data: hotel, isLoading } = useHotel(id);
  const updateHotel = useUpdateHotel(id);

  async function handleSubmit(values: HotelFormValues) {
    try {
      const payload: Record<string, unknown> = { ...values };
      await updateHotel.mutateAsync(payload as Partial<Hotel>);
      toast.success(t("updateSuccess"));
      router.push(`/${locale}/hotels/${id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/hotels/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("editHotel")}</h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {hotel?.nameAr || hotel?.nameEn || hotel?.name || ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HotelForm
              defaultValues={hotel}
              onSubmit={handleSubmit}
              isLoading={updateHotel.isPending}
              submitLabel={t("saveChanges")}
              isSystemAdmin={isSystemAdmin}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
