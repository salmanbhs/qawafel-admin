"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useCreateAdminUser } from "@/hooks/use-admin";
import { getApiErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SYSTEM_ADMIN", "AGENCY_ADMIN", "AGENCY_STAFF"]),
  travelAgencyId: z.string().uuid().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function NewAdminUserPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const createUser = useCreateAdminUser();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", role: "AGENCY_STAFF", travelAgencyId: "" },
  });

  const role = form.watch("role");

  const handleSubmit = async (values: FormValues) => {
    try {
      await createUser.mutateAsync({
        ...values,
        travelAgencyId: values.travelAgencyId || undefined,
      });
      toast.success(t("userCreated"));
      router.push(`/${locale}/admin/users`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold">{t("newUser")}</h1>
        </div>

        <Card className="max-w-lg">
          <CardHeader><CardTitle>{t("userDetails")}</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tc("email")}</FormLabel>
                    <FormControl><Input type="email" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tc("password")}</FormLabel>
                    <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN</SelectItem>
                        <SelectItem value="AGENCY_ADMIN">AGENCY_ADMIN</SelectItem>
                        <SelectItem value="AGENCY_STAFF">AGENCY_STAFF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {(role === "AGENCY_ADMIN" || role === "AGENCY_STAFF") && (
                  <FormField control={form.control} name="travelAgencyId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("travelAgencyId")}</FormLabel>
                      <FormControl><Input dir="ltr" placeholder="UUID" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <Button type="submit" disabled={createUser.isPending} className="w-full">
                  {createUser.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t("createUser")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
