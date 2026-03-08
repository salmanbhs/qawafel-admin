"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { apiPost } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLockout = useCallback((seconds: number) => {
    const until = Date.now() + seconds * 1000;
    setLockoutUntil(until);
    setLockoutRemaining(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutRemaining(0);
        setLockoutUntil(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    if (Date.now() < lockoutUntil) return;
    try {
      const data = await apiPost<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", values);

      localStorage.setItem("locale", locale);
      setAuth(data.user, data.accessToken, data.refreshToken);
      setFailCount(0);
      toast.success(locale === "ar" ? "تم تسجيل الدخول بنجاح" : "Logged in successfully");
      router.push(`/${locale}`);
    } catch (err) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      // Progressive lockout: 5s after 3 fails, 15s after 5, 30s after 7+
      if (newCount >= 7) startLockout(30);
      else if (newCount >= 5) startLockout(15);
      else if (newCount >= 3) startLockout(5);
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
        <CardDescription>{t("loginSubtitle")}</CardDescription>
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
                      autoComplete="email"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder={t("passwordPlaceholder")}
                        type={showPwd ? "text" : "password"}
                        autoComplete="current-password"
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

            <div className="flex justify-end">
              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm text-[hsl(var(--primary))] hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || lockoutRemaining > 0}
            >
              {form.formState.isSubmitting ? (
                <><Loader2 className="me-2 h-4 w-4 animate-spin" /> {tc("loading")}</>
              ) : lockoutRemaining > 0 ? (
                `${t("loginButton")} (${lockoutRemaining}s)`
              ) : (
                t("loginButton")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
