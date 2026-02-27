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
import { AgencyForm } from "@/components/agencies/AgencyForm";
import { useAgency, useUpdateAgency } from "@/hooks/use-agencies";
import { getApiErrorMessage } from "@/lib/api";
import type { TravelAgency } from "@/types/api";

export default function EditAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("agencies");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const { data: agency, isLoading } = useAgency(id);
  const updateAgency = useUpdateAgency(id);

  async function handleSubmit(values: Partial<TravelAgency>) {
    try {
      await updateAgency.mutateAsync(values);
      toast.success(t("updateSuccess"));
      router.push(`/${locale}/agencies/${id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/agencies/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("edit")}</h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {agency?.nameAr || agency?.nameEn || agency?.name || ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AgencyForm
              defaultValues={agency}
              onSubmit={handleSubmit}
              isLoading={updateAgency.isPending}
              submitLabel={t("saveChanges")}
              agencyId={id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
