"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Destination } from "@/types/api";

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    country: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    status: z.enum(["PENDING", "ACTIVE", "ARCHIVED"]).optional(),
  })
  .refine((d) => d.nameAr || d.nameEn, {
    message: "At least one name is required",
    path: ["nameAr"],
  });

export type DestinationFormValues = z.infer<typeof schema>;

interface DestinationFormProps {
  defaultValues?: Partial<Destination>;
  onSubmit: (values: DestinationFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function DestinationForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: DestinationFormProps) {
  const t = useTranslations("destinations");
  const tc = useTranslations("common");

  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      country: defaultValues?.country || "",
      region: defaultValues?.region || "",
      city: defaultValues?.city || "",
      latitude: defaultValues?.latitude ?? undefined,
      longitude: defaultValues?.longitude ?? undefined,
      status: defaultValues?.status || "ACTIVE",
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
            <FormField control={form.control} name="nameAr" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameAr")}</FormLabel>
                <FormControl><Input dir="rtl" placeholder="المالديف" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>

          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField control={form.control} name="nameEn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameEn")}</FormLabel>
                <FormControl><Input dir="ltr" placeholder="Maldives" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("country")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="region" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("region")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("city")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="latitude" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("latitude")}</FormLabel>
              <FormControl><Input type="number" step="any" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="longitude" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("longitude")}</FormLabel>
              <FormControl><Input type="number" step="any" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Status */}
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>{t("status")}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {["PENDING", "ACTIVE", "ARCHIVED"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {submitLabel || tc("save")}
        </Button>
      </form>
    </Form>
  );
}
