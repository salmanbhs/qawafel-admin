"use client";

import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PackageForm, type PackageFormValues } from "@/components/packages/PackageForm";
import { usePackage, useUpdatePackage } from "@/hooks/use-packages";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function EditPackagePage() {
  const t = useTranslations("packages");
  const router = useRouter();
  const params = useParams<{ locale: string; id: string }>();
  const locale = params.locale;
  const id = params.id;

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const { data: pkg, isLoading } = usePackage(id);
  const updatePackage = useUpdatePackage(id);

  const handleSubmit = async (values: PackageFormValues) => {
    try {
      await updatePackage.mutateAsync(values);
      toast.success(t("updated"));
      router.push(`/${locale}/packages/${id}`);
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!pkg) {
    return <EmptyState title={t("notFound")} description={t("notFoundDesc")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold">{t("editPackage")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("packageDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageForm
            defaultValues={pkg}
            onSubmit={handleSubmit}
            isLoading={updatePackage.isPending}
            submitLabel={t("update")}
            packageId={id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
