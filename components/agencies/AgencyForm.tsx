"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TravelAgency } from "@/types/api";

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  })
  .refine((d) => d.nameAr || d.nameEn, {
    message: "At least one name is required",
    path: ["nameAr"],
  });

type AgencyFormValues = z.infer<typeof schema>;

interface AgencyFormProps {
  defaultValues?: Partial<TravelAgency>;
  onSubmit: (values: AgencyFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AgencyForm({ defaultValues, onSubmit, isLoading, submitLabel }: AgencyFormProps) {
  const t = useTranslations("agencies");
  const tc = useTranslations("common");

  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      descriptionAr: defaultValues?.descriptionAr || "",
      descriptionEn: defaultValues?.descriptionEn || "",
      contactEmail: defaultValues?.contactEmail || "",
      status: defaultValues?.status || "DRAFT",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="ar">
          <TabsList>
            <TabsTrigger value="ar">{tc("arabic")}</TabsTrigger>
            <TabsTrigger value="en">{tc("english")}</TabsTrigger>
          </TabsList>

          <TabsContent value="ar" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="nameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameAr")}</FormLabel>
                  <FormControl>
                    <Input dir="rtl" placeholder="قافلة للسفر والسياحة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descriptionAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionAr")}</FormLabel>
                  <FormControl>
                    <Textarea dir="rtl" rows={4} placeholder="وصف الوكالة..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameEn")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder="Qawafel Travel & Tourism" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descriptionEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionEn")}</FormLabel>
                  <FormControl>
                    <Textarea dir="ltr" rows={4} placeholder="Agency description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Common fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contactEmail")}</FormLabel>
                <FormControl>
                  <Input type="email" dir="ltr" placeholder="bookings@agency.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("status")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft / مسودة</SelectItem>
                    <SelectItem value="PUBLISHED">Published / منشور</SelectItem>
                    <SelectItem value="ARCHIVED">Archived / مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {submitLabel || tc("save")}
        </Button>
      </form>
    </Form>
  );
}
