"use client";

import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { PackageForm, type PackageFormValues } from "@/components/packages/PackageForm";
import { useCreatePackage } from "@/hooks/use-packages";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";

export default function NewPackagePage() {
  const t = useTranslations("packages");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const createPackage = useCreatePackage();

  const handleSubmit = async (values: PackageFormValues) => {
    try {
      const pkg = await createPackage.mutateAsync(values);
      toast.success(t("created"));
      router.push(`/${locale}/packages/${pkg.id}`);
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
        <h1 className="text-2xl font-bold">{t("newPackage")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("packageDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageForm
            onSubmit={handleSubmit}
            isLoading={createPackage.isPending}
            submitLabel={t("createPackage")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
