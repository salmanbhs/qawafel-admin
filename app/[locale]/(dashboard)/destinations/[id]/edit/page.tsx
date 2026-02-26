"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { DestinationForm, type DestinationFormValues } from "@/components/destinations/DestinationForm";
import { useDestination, useUpdateDestination } from "@/hooks/use-destinations";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("destinations");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const { data: destination, isLoading } = useDestination(id);
  const updateDestination = useUpdateDestination(id);

  const handleSubmit = async (values: DestinationFormValues) => {
    try {
      await updateDestination.mutateAsync(values);
      toast.success(t("updated"));
      router.push(`/${locale}/destinations/${id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!isAdmin) {
    return <EmptyState title={t("adminOnly")} description={t("adminOnlyDesc")} />;
  }

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
        <h1 className="text-2xl font-bold">{t("editDestination")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {destination?.nameAr || destination?.nameEn || tc("untitled")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DestinationForm
            defaultValues={destination}
            onSubmit={handleSubmit}
            isLoading={updateDestination.isPending}
            submitLabel={t("saveChanges")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
