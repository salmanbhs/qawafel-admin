"use client";

import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { DestinationForm, type DestinationFormValues } from "@/components/destinations/DestinationForm";
import { useCreateDestination } from "@/hooks/use-destinations";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function NewDestinationPage() {
  const t = useTranslations("destinations");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const createDestination = useCreateDestination();

  const handleSubmit = async (values: DestinationFormValues) => {
    try {
      const dest = await createDestination.mutateAsync(values);
      toast.success(t("created"));
      router.push(`/${locale}/destinations/${dest.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!isAdmin) {
    return <EmptyState title={t("adminOnly")} description={t("adminOnlyDesc")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold">{t("newDestination")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("destinationDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DestinationForm
            onSubmit={handleSubmit}
            isLoading={createDestination.isPending}
            submitLabel={t("createDestination")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
