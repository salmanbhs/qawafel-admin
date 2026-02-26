"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPost, getApiErrorMessage } from "@/lib/api";

const schema = z
  .object({
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetForm = z.infer<typeof schema>;

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [showPwd, setShowPwd] = useState(false);

  const form = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetForm) {
    try {
      await apiPost("/auth/reset-password", { token, password: values.password });
      toast.success(locale === "ar" ? "تم تعيين كلمة المرور بنجاح" : "Password reset successfully");
      router.push(`/${locale}/login`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("resetTitle")}</CardTitle>
        <CardDescription>{t("resetSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPwd ? "text" : "password"}
                        dir="ltr"
                        className="pe-10"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 end-3 flex items-center text-[hsl(var(--muted-foreground))]"
                        onClick={() => setShowPwd((v) => !v)}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("resetButton")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
