"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateAgency } from "@/hooks/use-agencies";
import { getApiErrorMessage } from "@/lib/api";
import type { TravelAgency } from "@/types/api";

const AgencyForm = dynamic(() => import("@/components/agencies/AgencyForm").then(mod => ({ default: mod.AgencyForm })), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function NewAgencyPage() {
  const t = useTranslations("agencies");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const createAgency = useCreateAgency();

  async function handleSubmit(values: Partial<TravelAgency>) {
    try {
      await createAgency.mutateAsync(values);
      toast.success(t("createSuccess"));
      router.push(`/${locale}/agencies`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/agencies`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("create")}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === "ar" ? "معلومات الوكالة" : "Agency Information"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyForm
            onSubmit={handleSubmit}
            isLoading={createAgency.isPending}
            submitLabel={t("create")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
