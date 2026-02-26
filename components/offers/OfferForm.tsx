"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2, Upload, ImageIcon, X, ChevronsUpDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useHotels } from "@/hooks/use-hotels";
import { useDestinations } from "@/hooks/use-destinations";
import { usePreUploadImage } from "@/hooks/use-offers";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import type { Offer } from "@/types/api";

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    hotelIds: z.array(z.string().uuid()).optional(),
    destinationIds: z.array(z.string().uuid()).optional(),
    imageUrl: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    currency: z.string().max(10).optional(),
    bedCount: z.coerce.number().int().min(1).optional(),
    maxGuests: z.coerce.number().int().min(1).optional(),
    checkInDate: z.string().optional(),
    checkOutDate: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE", "ARCHIVED"]),
    travelAgencyId: z.string().uuid().optional(),
  })
  .refine((d) => d.nameAr || d.nameEn, {
    message: "At least one name is required",
    path: ["nameAr"],
  });

export type OfferFormValues = z.infer<typeof schema>;

interface OfferFormProps {
  travelAgencyId: string;
  defaultValues?: Partial<Offer>;
  onSubmit: (values: OfferFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  isSystemAdmin?: boolean;
}

export function OfferForm({
  travelAgencyId,
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  isSystemAdmin = false,
}: OfferFormProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");

  // Pre-upload image state
  const preUpload = usePreUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultValues?.imageUrl || null
  );

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      travelAgencyId: travelAgencyId || undefined,
      hotelIds: defaultValues?.hotels?.map((h) => h.hotel.id) || [],
      destinationIds: defaultValues?.destinations?.map((d) => d.destination.id) || [],
      imageUrl: defaultValues?.imageUrl || "",
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      descriptionAr: defaultValues?.descriptionAr || "",
      descriptionEn: defaultValues?.descriptionEn || "",
      price: defaultValues?.price ?? undefined,
      currency: defaultValues?.currency || "BHD",
      bedCount: defaultValues?.bedCount ?? undefined,
      maxGuests: defaultValues?.maxGuests ?? undefined,
      checkInDate: defaultValues?.checkInDate?.slice(0, 10) || "",
      checkOutDate: defaultValues?.checkOutDate?.slice(0, 10) || "",
      status: defaultValues?.status || "PENDING",
    },
  });

  // Fetch destinations from global catalog
  const { data: destData } = useDestinations({ limit: 200 });
  const destinations = destData?.data ?? [];

  // Watch selected destinations → filter hotels by first selected destination
  const watchedDestinationIds = useWatch({ control: form.control, name: "destinationIds" });
  const firstDestId = watchedDestinationIds?.[0];

  // Fetch hotels for this agency, optionally filtered by destination
  const { data: hotelsData } = useHotels({
    travelAgencyId,
    limit: 100,
    ...(firstDestId ? { destinationId: firstDestId } : {}),
  });
  const hotels = hotelsData?.data ?? [];

  // Handle image pre-upload
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(tc("invalidFileType"));
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    try {
      const result = await preUpload.mutateAsync(formData);
      form.setValue("imageUrl", result.imageUrl);
      setPreviewUrl(result.imageUrl);
      toast.success(t("imageUploaded"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const clearImage = () => {
    form.setValue("imageUrl", "");
    setPreviewUrl(null);
  };

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
                <FormControl><Input dir="rtl" placeholder="باقة المالديف الفاخرة" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="descriptionAr" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionAr")}</FormLabel>
                <FormControl><Textarea dir="rtl" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>

          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField control={form.control} name="nameEn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameEn")}</FormLabel>
                <FormControl><Input dir="ltr" placeholder="Luxury Maldives Resort — 7 Nights" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="descriptionEn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionEn")}</FormLabel>
                <FormControl><Textarea dir="ltr" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>
        </Tabs>

        {/* Hotels searchable multi-select (filtered by first selected destination) */}
        <FormField control={form.control} name="hotelIds" render={({ field }) => {
          const selected: string[] = field.value || [];
          const selectedLabels = selected
            .map((id) => {
              const h = hotels.find((x) => x.id === id);
              return h ? (h.nameAr || h.nameEn || h.name) : id;
            })
            .filter(Boolean);

          const toggleHotel = (id: string) => {
            field.onChange(
              selected.includes(id)
                ? selected.filter((x) => x !== id)
                : [...selected, id]
            );
          };

          return (
            <FormItem>
              <FormLabel>{t("hotels")}</FormLabel>
              {firstDestId && (
                <div className="text-xs text-muted-foreground mb-2">
                  {t("hotelsFilteredByDestination")}
                </div>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-start">
                        {selected.length === 0
                          ? t("selectHotels")
                          : `${selected.length} ${tc("selected")}`}
                      </span>
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("searchHotels")} />
                    <CommandList>
                      <CommandEmpty>{tc("noResults")}</CommandEmpty>
                      <CommandGroup>
                        {hotels.map((h) => {
                          const isSelected = selected.includes(h.id);
                          const label = h.nameAr || h.nameEn || h.name || h.id;
                          return (
                            <CommandItem
                              key={h.id}
                              value={`${h.nameAr} ${h.nameEn} ${h.city} ${h.country}`}
                              onSelect={() => toggleHotel(h.id)}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="flex-1 truncate">{label}</span>
                              {h.starRating && (
                                <span className="text-xs text-amber-500 shrink-0">
                                  {"★".repeat(h.starRating)}
                                </span>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedLabels.map((label, i) => (
                    <Badge
                      key={selected[i]}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleHotel(selected[i])}
                    >
                      {label}
                      <X className="ms-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }} />

        {/* Destinations searchable multi-select */}
        <FormField control={form.control} name="destinationIds" render={({ field }) => {
          const selected: string[] = field.value || [];
          const selectedLabels = selected
            .map((id) => {
              const d = destinations.find((x) => x.id === id);
              return d ? (d.nameAr || d.nameEn || d.name) : id;
            })
            .filter(Boolean);

          const toggleDest = (id: string) => {
            field.onChange(
              selected.includes(id)
                ? selected.filter((x) => x !== id)
                : [...selected, id]
            );
          };

          return (
            <FormItem>
              <FormLabel>{t("destinations")}</FormLabel>
              <div className="text-xs text-muted-foreground mb-2">{t("selectDestinations")}</div>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-start">
                        {selected.length === 0
                          ? t("selectDestinations")
                          : `${selected.length} ${tc("selected")}`}
                      </span>
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("searchDestinations")} />
                    <CommandList>
                      <CommandEmpty>{tc("noResults")}</CommandEmpty>
                      <CommandGroup>
                        {destinations.map((dest) => {
                          const isSelected = selected.includes(dest.id);
                          const label = dest.nameAr || dest.nameEn || dest.name || dest.id;
                          return (
                            <CommandItem
                              key={dest.id}
                              value={`${dest.nameAr} ${dest.nameEn} ${dest.country} ${dest.city}`}
                              onSelect={() => toggleDest(dest.id)}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="flex-1 truncate">{label}</span>
                              {dest.country && (
                                <span className="text-xs text-muted-foreground shrink-0">{dest.country}</span>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedLabels.map((label, i) => (
                    <Badge
                      key={selected[i]}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleDest(selected[i])}
                    >
                      {label}
                      <X className="ms-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }} />

        {/* Image pre-upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("offerImage")}</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <div className="relative rounded-lg border overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Offer"
                  className="h-40 w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 end-2 h-7 w-7"
                  onClick={clearImage}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                {preUpload.isPending ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("uploading")}</p>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("dropImageHere")}</p>
                      <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="me-2 h-4 w-4" />
                      {t("uploadImage")}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("price")}</FormLabel>
              <FormControl><Input type="number" step="0.01" min="0" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("currency")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["BHD", "SAR", "AED", "KWD", "QAR", "OMR", "USD", "EUR"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="bedCount" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("bedCount")}</FormLabel>
              <FormControl><Input type="number" min="1" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="maxGuests" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maxGuests")}</FormLabel>
              <FormControl><Input type="number" min="1" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="checkInDate" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("checkInDate")}</FormLabel>
              <FormControl><Input type="date" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="checkOutDate" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("checkOutDate")}</FormLabel>
              <FormControl><Input type="date" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {isSystemAdmin && (
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>{t("status")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["PENDING", "APPROVED", "REJECTED", "ACTIVE", "ARCHIVED"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {submitLabel || tc("save")}
        </Button>
      </form>
    </Form>
  );
}
