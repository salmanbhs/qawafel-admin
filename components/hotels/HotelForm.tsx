"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, X } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type { Hotel } from "@/types/api";

const AMENITIES = [
  { value: "WiFi",           en: "Free WiFi",         ar: "واي فاي مجاني" },
  { value: "Pool",           en: "Swimming Pool",     ar: "مسبح" },
  { value: "Parking",        en: "Parking",           ar: "موقف سيارات" },
  { value: "AC",             en: "Air Conditioning",  ar: "تكييف هواء" },
  { value: "Restaurant",     en: "Restaurant",        ar: "مطعم" },
  { value: "Gym",            en: "Gym",               ar: "صالة رياضية" },
  { value: "Spa",            en: "Spa",               ar: "سبا" },
  { value: "RoomService",    en: "Room Service",      ar: "خدمة الغرف" },
  { value: "BeachAccess",    en: "Beach Access",      ar: "وصول للشاطئ" },
  { value: "Bar",            en: "Bar & Lounge",      ar: "بار وصالة" },
  { value: "AirportShuttle", en: "Airport Shuttle",   ar: "نقل المطار" },
  { value: "KidsClub",       en: "Kids Club",         ar: "نادي الأطفال" },
  { value: "Concierge",      en: "Concierge",         ar: "خدمة الكونسيرج" },
  { value: "Laundry",        en: "Laundry Service",   ar: "خدمة الغسيل" },
  { value: "BusinessCenter", en: "Business Center",   ar: "مركز الأعمال" },
  { value: "MeetingRooms",   en: "Meeting Rooms",     ar: "قاعات اجتماعات" },
  { value: "PetFriendly",    en: "Pet Friendly",      ar: "يسمح بالحيوانات" },
  { value: "NonSmoking",     en: "Non-Smoking Rooms", ar: "غرف غير مدخنين" },
] as const;

const AMENITY_VALUES = AMENITIES.map((a) => a.value as string);

function parseAmenities(raw?: string): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    starRating: z.coerce.number().int().min(1).max(5).optional(),
    address: z.string().max(500).optional(),
    googleMapUrl: z.string().url().optional().or(z.literal("")),
    amenities: z.string().max(2000).optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    travelAgencyId: z.string().uuid().optional(),
    destinationId: z.string().uuid({ message: "Please select a destination" }),
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
  const locale = useLocale();

  const { data: destData, isLoading: destsLoading } = useDestinations({ limit: 100 });
  const destinations = destData?.data ?? [];

  // Amenity toggle state
  const initialAmenities = parseAmenities(defaultValues?.amenities);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialAmenities.filter((a) => AMENITY_VALUES.includes(a))
  );
  const [otherText, setOtherText] = useState(
    initialAmenities.filter((a) => !AMENITY_VALUES.includes(a)).join(", ")
  );
  const [showOther, setShowOther] = useState(
    initialAmenities.some((a) => !AMENITY_VALUES.includes(a))
  );

  const syncAmenities = (next: string[], other: string) => {
    const otherItems = other.split(",").map((s) => s.trim()).filter(Boolean);
    const all = [...next, ...otherItems];
    form.setValue("amenities", all.length > 0 ? JSON.stringify(all) : "");
  };

  const toggleAmenity = (value: string) => {
    const next = selectedAmenities.includes(value)
      ? selectedAmenities.filter((v) => v !== value)
      : [...selectedAmenities, value];
    setSelectedAmenities(next);
    syncAmenities(next, otherText);
  };

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      descriptionAr: defaultValues?.descriptionAr || "",
      descriptionEn: defaultValues?.descriptionEn || "",
      starRating: defaultValues?.starRating ?? undefined,
      address: defaultValues?.address || "",
      googleMapUrl: defaultValues?.googleMapUrl || "",
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
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
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
                disabled={destsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    {destsLoading ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tc("loading")}
                      </span>
                    ) : (
                      <SelectValue placeholder={t("selectDestination")} />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nameAr || d.nameEn || d.name}
                      {d.country ? ` — ${d.country}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const selId = form.watch("destinationId");
                const sel = destinations.find((d) => d.id === selId);
                if (!sel) return null;
                return (
                  <div className="mt-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm space-y-0.5">
                    {(sel.city || sel.country) && (
                      <p className="font-medium">
                        {[sel.city, sel.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {sel.latitude != null && sel.longitude != null && (
                      <p className="text-[hsl(var(--muted-foreground))]">
                        {sel.latitude}, {sel.longitude}
                      </p>
                    )}
                  </div>
                );
              })()}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Google Maps URL */}
        <FormField
          control={form.control}
          name="googleMapUrl"
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>{t("googleMapUrl")}</FormLabel>
              <FormControl>
                <Input
                  dir="ltr"
                  placeholder={t("googleMapUrlPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amenities"
          render={() => (
            <FormItem>
              <FormLabel>{t("amenities")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.value);
                  return (
                    <button
                      key={amenity.value}
                      type="button"
                      onClick={() => toggleAmenity(amenity.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                        isSelected
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]"
                      )}
                    >
                      {locale === "ar" ? amenity.ar : amenity.en}
                    </button>
                  );
                })}
                {/* Other toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !showOther;
                    setShowOther(next);
                    if (!next) {
                      setOtherText("");
                      syncAmenities(selectedAmenities, "");
                    }
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    showOther
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {t("amenityOther")}
                </button>
              </div>
              {showOther && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    dir="ltr"
                    placeholder={t("amenityOtherPlaceholder")}
                    value={otherText}
                    onChange={(e) => {
                      setOtherText(e.target.value);
                      syncAmenities(selectedAmenities, e.target.value);
                    }}
                    className="max-w-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOtherText("");
                      setShowOther(false);
                      syncAmenities(selectedAmenities, "");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {selectedAmenities.length > 0 || (showOther && otherText) ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("amenitySelected", { count: selectedAmenities.length + (showOther && otherText ? otherText.split(",").filter((s) => s.trim()).length : 0) })}
                </p>
              ) : null}
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
