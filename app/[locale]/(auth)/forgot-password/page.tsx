"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPost } from "@/lib/api";

const schema = z.object({ email: z.string().email() });
type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const form = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotForm) {
    try {
      await apiPost("/auth/forgot-password", values);
      toast.success(t("checkEmail"));
    } catch {
      // Per security guide, always show success
      toast.success(t("checkEmail"));
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("forgotTitle")}</CardTitle>
        <CardDescription>{t("forgotSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("emailPlaceholder")}
                      type="email"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("sendResetLink")}
            </Button>

            <div className="text-center">
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <BackIcon className="h-3.5 w-3.5" />
                {t("backToLogin")}
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
