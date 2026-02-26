"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDestinations } from "@/hooks/use-destinations";
import type { Hotel } from "@/types/api";

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    starRating: z.coerce.number().int().min(1).max(5).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
    longitude: z.coerce
      .number()
      .min(-180)
      .max(180)
      .optional()
      .or(z.literal("")),
    amenities: z.string().max(2000).optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    travelAgencyId: z.string().uuid().optional(),
    destinationId: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((d) => d.nameAr || d.nameEn, {
    message: "At least one name is required",
    path: ["nameAr"],
  });

export type HotelFormValues = z.infer<typeof schema>;

interface HotelFormProps {
  defaultValues?: Partial<Hotel>;
  onSubmit: (values: HotelFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  /** Pass travelAgencyId to lock it (agency admins) */
  travelAgencyId?: string;
  /** Show status/agency fields only for system admins */
  isSystemAdmin?: boolean;
}

export function HotelForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  travelAgencyId,
  isSystemAdmin = false,
}: HotelFormProps) {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");

  const { data: destData } = useDestinations({ limit: 200 });
  const destinations = destData?.data ?? [];

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      descriptionAr: defaultValues?.descriptionAr || "",
      descriptionEn: defaultValues?.descriptionEn || "",
      starRating: defaultValues?.starRating ?? undefined,
      address: defaultValues?.address || "",
      city: defaultValues?.city || "",
      country: defaultValues?.country || "",
      latitude: defaultValues?.latitude ?? ("" as any),
      longitude: defaultValues?.longitude ?? ("" as any),
      amenities: defaultValues?.amenities || "",
      status: defaultValues?.status || "DRAFT",
      travelAgencyId: travelAgencyId || defaultValues?.travelAgencyId || "",
      destinationId: defaultValues?.destinationId || "",
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
                    <Input
                      dir="rtl"
                      placeholder="فندق الخليج الفاخر"
                      {...field}
                    />
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
                    <Textarea
                      dir="rtl"
                      rows={3}
                      placeholder="وصف الفندق..."
                      {...field}
                    />
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
                    <Input
                      dir="ltr"
                      placeholder="Gulf Luxury Hotel"
                      {...field}
                    />
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
                    <Textarea
                      dir="ltr"
                      rows={3}
                      placeholder="Hotel description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Hotel details */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="starRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("starRating")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectRating")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        {"★".repeat(r)} ({r})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("country")}</FormLabel>
                <FormControl>
                  <Input dir="ltr" placeholder="Bahrain" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("city")}</FormLabel>
                <FormControl>
                  <Input dir="ltr" placeholder="Manama" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-3">
                <FormLabel>{t("address")}</FormLabel>
                <FormControl>
                  <Input
                    dir="ltr"
                    placeholder="123 Corniche Road, Manama"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("latitude")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    dir="ltr"
                    placeholder="26.2285"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("longitude")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    dir="ltr"
                    placeholder="50.5860"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Destination */}
        <FormField
          control={form.control}
          name="destinationId"
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>{t("destination")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectDestination")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none">{t("noDestination")}</SelectItem>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nameAr || d.nameEn || d.name}
                      {d.country ? ` — ${d.country}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amenities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("amenities")}</FormLabel>
              <FormControl>
                <Textarea
                  dir="ltr"
                  rows={2}
                  placeholder='e.g. ["WiFi","Pool","Gym","Spa"]'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isSystemAdmin && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t("status")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">
                      Draft / مسودة
                    </SelectItem>
                    <SelectItem value="ACTIVE">
                      Active / نشط
                    </SelectItem>
                    <SelectItem value="ARCHIVED">
                      Archived / مؤرشف
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {submitLabel || tc("save")}
        </Button>
      </form>
    </Form>
  );
}
