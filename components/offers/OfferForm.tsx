"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Loader2, Upload, ImageIcon, X, ChevronsUpDown, Check, Plus, Trash2,
  ArrowUp, ArrowDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import { OfferDuplicateConfirmationDialog, type DuplicateOfferData } from "./OfferDuplicateConfirmationDialog";
import { cn } from "@/lib/utils";
import { useHotels } from "@/hooks/use-hotels";
import { useDestinations } from "@/hooks/use-destinations";
import { useAgency } from "@/hooks/use-agencies";
import { usePreUploadImage, useDeletePreUploadImage } from "@/hooks/use-offers";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import type { Offer, RoomOption } from "@/types/api";

//  constants 
const ROOM_TYPES      = ["TWIN", "TRIPLE", "QUAD", "FAMILY"] as const;
const MEAL_TYPES      = ["BREAKFAST", "LUNCH", "DINNER", "TEA", "WATER"] as const;
const SERVICE_TYPES   = ["BUFFET", "PARCEL"] as const;
const TRANSPORT_TYPES = ["FLY", "BUS", "CAR", "TRAIN"] as const;
const OFFER_STATUSES  = ["PENDING", "ACTIVE", "ARCHIVED"] as const;
const MEAL_NEEDS_SERVICE = new Set(["BREAKFAST", "LUNCH", "DINNER"]);

//  zod schemas 
const roomOptionSchema = z.object({
  roomType:   z.enum(ROOM_TYPES).optional().nullable(),
  price:      z.number().min(0),
  isDefault:  z.boolean(),
});

const destinationEntrySchema = z.object({
  destinationId:  z.string().uuid(),
  numberOfNights: z.number().int().min(0),
  sequenceOrder:  z.number().int().min(1),
});

const mealSchema = z.object({
  mealType:    z.enum(MEAL_TYPES),
  serviceType: z.enum(SERVICE_TYPES).optional().nullable(),
});

const transportSchema = z.object({
  transportType:  z.enum(TRANSPORT_TYPES),
  fromLocation:   z.string().min(1),
  toLocation:     z.string().min(1),
  isDirectFlight: z.boolean().optional().nullable(),
  carType:        z.string().optional().nullable(),
  order:          z.number().int().min(0),
  notes:          z.string().optional().nullable(),
});

const schema = z
  .object({
    nameAr:        z.string().max(255).optional(),
    nameEn:        z.string().max(255).optional(),
    descriptionAr: z.string().max(2000).optional(),
    descriptionEn: z.string().max(2000).optional(),
    imageUrl:      z.string().optional(),
    checkInDate:   z.string().optional(),
    checkOutDate:  z.string().optional(),
    numberOfDays:  z.coerce.number().int().min(1).optional().or(z.literal("")),
    status:        z.enum(OFFER_STATUSES),
    travelAgencyId: z.string().uuid().optional(),
    includesIslamicProgram: z.boolean().optional(),
    islamicAdvisor:    z.string().max(500).optional(),
    includesVisa:      z.boolean().optional(),
    includesInsurance: z.boolean().optional(),
    hotelIds:     z.array(z.string().uuid()).optional(),
    destinations: z.array(destinationEntrySchema).optional(),
    roomOptions:  z.array(roomOptionSchema).min(1, "At least one room option is required"),
    meals:        z.array(mealSchema).optional(),
    transports:   z.array(transportSchema).optional(),
  })
  .refine(
    (d) => d.roomOptions?.filter((r) => r.isDefault).length === 1,
    { message: "Exactly one room option must be marked as default", path: ["roomOptions"] }
  );

export type OfferFormValues = z.infer<typeof schema>;

//  props 
interface OfferFormProps {
  travelAgencyId: string;
  defaultValues?: Partial<Offer>;
  onSubmit: (values: OfferFormValues) => Promise<void>;
  onSubmitAndContinue?: (values: OfferFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  submitAndContinueLabel?: string;
  isSystemAdmin?: boolean;
}

//  component 
export function OfferForm({
  travelAgencyId,
  defaultValues,
  onSubmit,
  onSubmitAndContinue,
  isLoading,
  submitLabel,
  submitAndContinueLabel,
  isSystemAdmin = false,
}: OfferFormProps) {
  const t  = useTranslations("offers");
  const tc = useTranslations("common");

  const preUpload = usePreUploadImage();
  const deletePreUpload = useDeletePreUploadImage();
  const { data: agencyData } = useAgency(travelAgencyId);
  const agency = agencyData;
  const submitActionRef = useRef<"default" | "continue">("default");
  const inputRef  = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultValues?.imageUrl || null
  );
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [pendingDuplicateData, setPendingDuplicateData] = useState<DuplicateOfferData | null>(null);
  const [pendingFormData, setPendingFormData] = useState<OfferFormValues | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      travelAgencyId: travelAgencyId || undefined,
      nameAr:        defaultValues?.nameAr         || "",
      nameEn:        defaultValues?.nameEn         || "",
      descriptionAr: defaultValues?.descriptionAr  || "",
      descriptionEn: defaultValues?.descriptionEn  || "",
      imageUrl:      defaultValues?.imageUrl        || "",
      checkInDate:   defaultValues?.checkInDate?.slice(0, 10)  || "",
      checkOutDate:  defaultValues?.checkOutDate?.slice(0, 10) || "",
      numberOfDays:  defaultValues?.numberOfDays ?? "",
      status:  (((defaultValues?.status as any) === "INACTIVE" ? "ACTIVE" : defaultValues?.status) as typeof OFFER_STATUSES[number]) || "ACTIVE",
      includesIslamicProgram: defaultValues?.includesIslamicProgram ?? false,
      islamicAdvisor:    defaultValues?.islamicAdvisor    || "",
      includesVisa:      defaultValues?.includesVisa      ?? false,
      includesInsurance: defaultValues?.includesInsurance ?? false,
      hotelIds: defaultValues?.hotels?.map((h) => h.hotel.id) || [],
      destinations: defaultValues?.destinations?.map((d) => ({
        destinationId:  d.destinationId,
        numberOfNights: d.numberOfNights ?? 0,
        sequenceOrder:  d.sequenceOrder  ?? 1,
      })) || [],
      roomOptions: defaultValues?.roomOptions && defaultValues.roomOptions.length > 0
        ? defaultValues.roomOptions.map((r) => ({
            roomType:   r.roomType,
            price:      r.price,
            isDefault:  r.isDefault,
          }))
        : [{ roomType: null, price: 0, isDefault: true }],
      meals: defaultValues?.meals?.map((m) => ({
        mealType:    m.mealType,
        serviceType: m.serviceType ?? null,
      })) || [],
      transports: defaultValues?.transports?.map((tr) => ({
        transportType:  tr.transportType,
        fromLocation:   tr.fromLocation,
        toLocation:     tr.toLocation,
        isDirectFlight: tr.isDirectFlight ?? null,
        carType:        tr.carType ?? null,
        order:          tr.order,
        notes:          tr.notes ?? null,
      })) || [],
    },
  });

  //  derived 
  const { data: destData, isLoading: destsLoading } = useDestinations({ limit: 100 });
  const allDestinations = destData?.data ?? [];

  const watchedDestinations = useWatch({ control: form.control, name: "destinations" });
  const selectedDestIds = (watchedDestinations || []).map((d) => d.destinationId);
  const hasDestinations  = selectedDestIds.length > 0;

  const { data: hotelsData, isLoading: hotelsLoading } = useHotels({
    travelAgencyId,
    limit: 100,
    ...(hasDestinations ? { destinationIds: selectedDestIds } : {}),
  });
  const hotels = hotelsData?.data ?? [];

  //  image 
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) { toast.error(tc("invalidFileType")); return; }
    const fd = new FormData(); fd.append("file", file);
    try {
      const result = await preUpload.mutateAsync(fd);
      form.setValue("imageUrl", result.imageUrl);
      setPreviewUrl(result.imageUrl);
      
      // Auto-fill form if parsedOffer data is available
      if (result.parsedOffer) {
        const parsed = result.parsedOffer;
        
        // ✅ Map dates
        if (parsed.startDate) {
          form.setValue("checkInDate", parsed.startDate);
        }
        if (parsed.endDate) {
          form.setValue("checkOutDate", parsed.endDate);
        }
        
        // ✅ Map duration
        if (parsed.durationDays) {
          form.setValue("numberOfDays", parsed.durationDays);
        }
        
        // ✅ Map visa
        if (parsed.visaIncluded !== undefined) {
          form.setValue("includesVisa", parsed.visaIncluded);
        }
        
        // ✅ Map insurance
        if (parsed.includesInsurance !== undefined) {
          form.setValue("includesInsurance", parsed.includesInsurance);
        }
        
        // ✅ Map Islamic program
        if (parsed.includesIslamicProgram !== undefined) {
          form.setValue("includesIslamicProgram", parsed.includesIslamicProgram);
        }
        if (parsed.islamicAdvisor) {
          form.setValue("islamicAdvisor", parsed.islamicAdvisor);
        }
        
        // ✅ Map room options from roomTypeOptions array
        if (parsed.roomTypeOptions && parsed.roomTypeOptions.length > 0) {
          const roomOptions = parsed.roomTypeOptions.map((ro) => ({
            roomType: ro.roomType as any,
            price: ro.price,
            isDefault: false,
          }));
          // Mark first as default
          if (roomOptions.length > 0) {
            roomOptions[0].isDefault = true;
          }
          form.setValue("roomOptions", roomOptions);
        } else if (parsed.price) {
          // Fallback: use single price with roomType
          const currentRooms = form.getValues("roomOptions") || [];
          if (currentRooms.length > 0) {
            form.setValue("roomOptions.0.price", parsed.price);
            if (parsed.roomType && ["TWIN", "TRIPLE", "QUAD", "FAMILY"].includes(parsed.roomType)) {
              form.setValue("roomOptions.0.roomType", parsed.roomType as any);
            }
          }
        }
        
        // ✅ Map meals array
        if (parsed.meals && parsed.meals.length > 0) {
          form.setValue("meals", parsed.meals.map(m => ({
            mealType: m.mealType,
            serviceType: m.serviceType ?? null,
          })));
        }
        
        // ✅ Map transports array
        if (parsed.transports && parsed.transports.length > 0) {
          form.setValue("transports", parsed.transports.map(t => ({
            transportType: t.transportType,
            fromLocation: t.fromLocation,
            toLocation: t.toLocation,
            isDirectFlight: t.isDirectFlight ?? null,
            carType: t.carType ?? null,
            order: t.order,
            notes: t.notes ?? null,
          })));
        }
        
        // ✅ Map destinations (structured array or ID-based)
        if (parsed.destinations && parsed.destinations.length > 0) {
          form.setValue("destinations", parsed.destinations.map(d => ({
            destinationId: d.destinationId,
            numberOfNights: d.numberOfNights,
            sequenceOrder: d.sequenceOrder,
          })));
        } else if (parsed.destinationIds && parsed.destinationIds.length > 0) {
          // Fallback: use destinationIds with default nights
          form.setValue("destinations", parsed.destinationIds.map((id, idx) => ({
            destinationId: id,
            numberOfNights: parsed.durationDays || 1,
            sequenceOrder: idx + 1,
          })));
        }
        
        // ✅ Map hotels (if hotelIds provided)
        if (parsed.hotelIds && parsed.hotelIds.length > 0) {
          form.setValue("hotelIds", parsed.hotelIds);
        }
        
        toast.success(t("imageUploadedWithData"));
      } else {
        toast.success(t("imageUploaded"));
      }
    } catch (err) { toast.error(getApiErrorMessage(err)); }
  };
  
  const clearImage = async () => {
    const currentImageUrl = form.getValues("imageUrl");
    if (currentImageUrl) {
      try {
        await deletePreUpload.mutateAsync(currentImageUrl);
        toast.success(t("imageDeleted"));
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      }
    }
    form.setValue("imageUrl", "");
    setPreviewUrl(null);
  };

  const destLabel = (id: string) => {
    const d = allDestinations.find((x) => x.id === id);
    return d ? (d.nameAr || d.nameEn || d.name || id) : id;
  };

  const handleFormSubmit = async (values: OfferFormValues) => {
    try {
      setPendingFormData(values);
      if (submitActionRef.current === "continue" && onSubmitAndContinue) {
        await onSubmitAndContinue(values);
      } else {
        await onSubmit(values);
      }
    } catch (err: any) {
      console.log("[OfferForm] Catch error:", {
        status: err?.response?.status,
        data: err?.response?.data,
        errorCode: err?.response?.data?.error?.code || err?.response?.data?.code,
      });
      
      // Check if it's a duplicate offer error - check both error.code and error.error.code paths
      const errorCode = err?.response?.data?.error?.code || err?.response?.data?.code;
      const isDuplicate = err?.response?.status === 409 && errorCode === "POSSIBLE_DUPLICATE";
      
      console.log("[OfferForm] isDuplicate check:", { isDuplicate, errorCode, status: err?.response?.status });
      
      if (isDuplicate) {
        const duplicateData: DuplicateOfferData = {
          duplicateOfferId: err.response.data.error?.duplicateOfferId || err.response.data.duplicateOfferId || "Unknown",
          duplicateSummary: err.response.data.error?.duplicateSummary || err.response.data.duplicateSummary || {
            checkInDate: "",
            checkOutDate: "",
            numberOfDays: 0,
            status: "PENDING",
          },
        };
        console.log("[OfferForm] Setting duplicate data:", duplicateData);
        setPendingDuplicateData(duplicateData);
        setIsDuplicateDialogOpen(true);
      } else {
        console.log("[OfferForm] Not a duplicate error, showing error toast");
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      submitActionRef.current = "default";
    }
  };

  const handleCreateAnywayClick = async () => {
    if (!pendingFormData) return;
    setIsRetrying(true);
    try {
      // Add forceCreate flag to the payload to override duplicate detection
      const dataWithForce = { ...pendingFormData, forceCreate: true } as any;
      
      if (submitActionRef.current === "continue" && onSubmitAndContinue) {
        await onSubmitAndContinue(dataWithForce);
      } else {
        await onSubmit(dataWithForce);
      }
      setIsDuplicateDialogOpen(false);
      setPendingDuplicateData(null);
      setPendingFormData(null);
      toast.success(t("created"));
    } catch (err: any) {
      // Check if it's STILL a duplicate error after forceCreate - if not, close dialog
      const errorCode = err?.response?.data?.error?.code || err?.response?.data?.code;
      const isDuplicate = err?.response?.status === 409 && errorCode === "POSSIBLE_DUPLICATE";
      
      if (isDuplicate) {
        toast.error("Failed to create offer despite force flag. Please contact support.");
      } else if (err?.response?.status !== 409) {
        toast.error(getApiErrorMessage(err));
        setIsDuplicateDialogOpen(false);
        setPendingDuplicateData(null);
        setPendingFormData(null);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  //  render 
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">

        {/* Two-column layout when image is uploaded: sticky preview + scrollable form */}
        <div className={previewUrl ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : ""}>
          
          {/* Left: Image Upload/Preview - Sticky on large screens */}
          <div className={previewUrl ? "lg:col-span-4 xl:col-span-3" : ""}>
            <Card className={`border-primary/20 bg-primary/5 ${previewUrl ? "lg:sticky lg:top-6" : ""}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  {t("offerImage")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("uploadImageToAutofill")}
                </p>
              </CardHeader>
              <CardContent>
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg border overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Offer" className="w-full h-auto max-h-[70vh] object-contain bg-muted" />
                      <Button type="button" variant="destructive" size="icon"
                        className="absolute top-2 end-2 h-8 w-8 shadow-lg" onClick={clearImage}
                        disabled={deletePreUpload.isPending}>
                        {deletePreUpload.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* Loading overlay for upload/delete */}
                      {(preUpload.isPending || deletePreUpload.isPending) && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm font-medium">
                            {deletePreUpload.isPending ? t("deleting") || "Deleting..." : t("uploading")}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {t("reviewImageWhileEditing") || "Review the image while editing form fields"}
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    onClick={() => !preUpload.isPending && inputRef.current?.click()}
                  >
                    <input ref={inputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={preUpload.isPending} />
                    {preUpload.isPending ? (
                      <>
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-primary/10 animate-pulse" />
                          <Loader2 className="h-8 w-8 animate-spin text-primary absolute inset-0 m-auto" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t("uploading")}</p>
                          <p className="text-xs text-muted-foreground">{t("extracting") || "Extracting data..."}</p>
                        </div>
                      </>
                    ) : (
                      <><div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("dropImageHere")}</p>
                        <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="me-2 h-4 w-4" />{t("uploadImage")}
                      </Button></>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Form Fields - Scrollable */}
          <div className={previewUrl ? "lg:col-span-8 xl:col-span-9 space-y-8" : "space-y-8"}>

        {/*  Names & Descriptions  */}
        <Tabs defaultValue="ar">
          <TabsList>
            <TabsTrigger value="ar">{tc("arabic")}</TabsTrigger>
            <TabsTrigger value="en">{tc("english")}</TabsTrigger>
          </TabsList>
          <TabsContent value="ar" className="space-y-4 mt-4">
            <FormField control={form.control} name="nameAr" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameAr")}</FormLabel>
                <FormControl><Input dir="rtl" placeholder="باقة العمرة الرمضانية" {...field} /></FormControl>
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
                <FormControl><Input dir="ltr" placeholder="Ramadan Umrah Package" {...field} /></FormControl>
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

        {/*  Destinations (ordered, with numberOfNights)  */}
        <FormField control={form.control} name="destinations" render={({ field }) => {
          const entries = field.value || [];
          const notSelected = allDestinations.filter(
            (d) => !entries.some((e) => e.destinationId === d.id)
          );
          const addDest = (id: string) => {
            field.onChange([
              ...entries,
              { destinationId: id, numberOfNights: 0, sequenceOrder: entries.length + 1 },
            ]);
          };
          const removeDest = (idx: number) => {
            field.onChange(
              entries.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sequenceOrder: i + 1 }))
            );
          };
          const moveDest = (idx: number, dir: -1 | 1) => {
            const next = idx + dir;
            if (next < 0 || next >= entries.length) return;
            const updated = [...entries];
            [updated[idx], updated[next]] = [updated[next], updated[idx]];
            field.onChange(updated.map((e, i) => ({ ...e, sequenceOrder: i + 1 })));
          };
          const setNights = (idx: number, val: number) => {
            const updated = [...entries];
            updated[idx] = { ...updated[idx], numberOfNights: isNaN(val) ? 0 : val };
            field.onChange(updated);
          };
          return (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>{t("destinations")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" disabled={destsLoading} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      {t("addDestination")}
                      {destsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder={t("searchDestinations")} />
                      <CommandList>
                        <CommandEmpty>{tc("noResults")}</CommandEmpty>
                        <CommandGroup>
                          {notSelected.map((dest) => (
                            <CommandItem
                              key={dest.id}
                              value={`${dest.nameAr} ${dest.nameEn} ${dest.city ?? ""}`}
                              onSelect={() => addDest(dest.id)}
                            >
                              <span className="flex-1">{dest.nameAr || dest.nameEn || dest.name}</span>
                              {dest.city && <span className="text-xs text-muted-foreground">{dest.city}</span>}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {entries.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {t("noDestinationsAdded")}
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-muted-foreground">
                        <th className="px-3 py-2 text-start font-medium w-6">#</th>
                        <th className="px-3 py-2 text-start font-medium">{t("destination")}</th>
                        <th className="px-3 py-2 text-start font-medium">{t("numberOfNights")}</th>
                        <th className="px-3 py-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, idx) => (
                        <tr key={entry.destinationId} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{destLabel(entry.destinationId)}</td>
                          <td className="px-3 py-2">
                            <Input type="number" min="0" value={entry.numberOfNights}
                              onChange={(e) => setNights(idx, parseInt(e.target.value))}
                              className="h-8 w-20" />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={() => moveDest(idx, -1)} disabled={idx === 0}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={() => moveDest(idx, 1)} disabled={idx === entries.length - 1}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeDest(idx)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }} />

        {/*  Hotels (filtered by selected destinations)  */}
        {!hasDestinations ? (
          <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
            {t("selectDestinationsFirst")}
          </div>
        ) : (
          <FormField control={form.control} name="hotelIds" render={({ field }) => {
            const selected: string[] = field.value || [];
            const toggleHotel = (id: string) => {
              field.onChange(
                selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
              );
            };
            return (
              <FormItem>
                <FormLabel>{t("hotels")}</FormLabel>
                <div className="text-xs text-muted-foreground mb-2">{t("hotelsFilteredByDestination")}</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" disabled={hotelsLoading}
                        className="w-full justify-between font-normal">
                        <span className="flex items-center gap-2 truncate text-start">
                          {hotelsLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                          {hotelsLoading ? tc("loading")
                            : selected.length === 0 ? t("selectHotels")
                            : `${selected.length} ${tc("selected")}`}
                        </span>
                        {!hotelsLoading && <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start" side="top" sideOffset={8}>
                    <Command>
                      <CommandInput placeholder={t("searchHotels")} />
                      <CommandList>
                        <CommandEmpty>{tc("noResults")}</CommandEmpty>
                        <CommandGroup>
                          {hotels.map((h) => {
                            const isSelected = selected.includes(h.id);
                            return (
                              <CommandItem key={h.id}
                                value={`${h.nameAr} ${h.nameEn} ${h.destination?.city ?? ""}`}
                                onSelect={() => toggleHotel(h.id)} className="flex items-center gap-2">
                                <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                                <span className="flex-1 truncate">{h.nameAr || h.nameEn || h.name}</span>
                                {h.starRating && (
                                  <span className="text-xs text-amber-500 shrink-0">{"".repeat(h.starRating)}</span>
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.map((id) => {
                      const h = hotels.find((x) => x.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => toggleHotel(id)}>
                          {h ? (h.nameAr || h.nameEn || h.name) : id}
                          <X className="ms-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            );
          }} />
        )}

        {/*  Room Options  */}
        <FormField control={form.control} name="roomOptions" render={({ field }) => {
          const roomOptions = field.value || [];
          const addOption = () => field.onChange([...roomOptions,
            { roomType: null, price: 0, isDefault: roomOptions.length === 0 },
          ]);
          const removeOption = (idx: number) => {
            const updated = roomOptions.filter((_, i) => i !== idx);
            if (roomOptions[idx].isDefault && updated.length > 0) updated[0] = { ...updated[0], isDefault: true };
            field.onChange(updated);
          };
          const updateOption = (idx: number, key: keyof RoomOption, value: unknown) => {
            const updated = roomOptions.map((opt, i) => {
              if (i !== idx) return (key === "isDefault" && value === true) ? { ...opt, isDefault: false } : opt;
              return { ...opt, [key]: value };
            });
            field.onChange(updated);
          };
          return (
            <FormItem>
              <div className="flex items-center justify-between mb-3">
                <FormLabel>{t("roomOptions")}</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1.5">
                  <Plus className="h-4 w-4" />{t("addRoomOption")}
                </Button>
              </div>
              {roomOptions.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">{t("noRoomOptions")}</div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t("roomType")}</th>
                        <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t("price")} (BHD)</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t("default")}</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomOptions.map((opt, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            <Select value={opt.roomType || "none"} onValueChange={(v) => updateOption(idx, "roomType", v === "none" ? null : v)}>
                              <SelectTrigger className="h-8 w-32"><SelectValue placeholder={t("roomType")} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{t("generalPrice")}</SelectItem>
                                {ROOM_TYPES.map((rt) => <SelectItem key={rt} value={rt}>{rt}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Input type="number" min="0" step="0.001" value={opt.price} className="h-8 w-28"
                              onChange={(e) => updateOption(idx, "price", parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="radio" name="roomDefault" checked={opt.isDefault}
                              onChange={() => updateOption(idx, "isDefault", true)} className="cursor-pointer" />
                          </td>
                          <td className="px-3 py-2">
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
                              onClick={() => removeOption(idx)} disabled={roomOptions.length === 1}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }} />

        {/*  Meals  */}
        <FormField control={form.control} name="meals" render={({ field }) => {
          const meals = field.value || [];
          const isIncluded = (mt: string) => meals.some((m) => m.mealType === mt);
          const toggleMeal = (mealType: typeof MEAL_TYPES[number]) => {
            if (isIncluded(mealType)) {
              field.onChange(meals.filter((m) => m.mealType !== mealType));
            } else {
              field.onChange([...meals, { mealType, serviceType: null }]);
            }
          };
          const setServiceType = (mealType: string, st: string | null) => {
            field.onChange(meals.map((m) => m.mealType === mealType ? { ...m, serviceType: st as any } : m));
          };
          return (
            <FormItem>
              <FormLabel className="mb-3 block">{t("meals")}</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MEAL_TYPES.map((mealType) => {
                  const included = isIncluded(mealType);
                  const meal = meals.find((m) => m.mealType === mealType);
                  const needsService = MEAL_NEEDS_SERVICE.has(mealType);
                  return (
                    <div key={mealType} className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      included ? "border-primary/40 bg-primary/5" : "border-border"
                    )}>
                      <button type="button"
                        className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                          included ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                        )}
                        onClick={() => toggleMeal(mealType)}>
                        {included && <Check className="h-3 w-3" />}
                      </button>
                      <span className="text-sm font-medium flex-1">{t(`meal_${mealType}`)}</span>
                      {included && needsService && (
                        <Select value={meal?.serviceType || ""} onValueChange={(v) => setServiceType(mealType, v || null)}>
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder={t("serviceType")} /></SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map((st) => <SelectItem key={st} value={st}>{t(`service_${st}`)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          );
        }} />

        {/*  Transports  */}
        <FormField control={form.control} name="transports" render={({ field }) => {
          const transports = field.value || [];
          const addTransport = () => field.onChange([...transports, {
            transportType: "FLY" as const,
            fromLocation: "", toLocation: "",
            isDirectFlight: null, carType: null,
            order: transports.length, notes: null,
          }]);
          const removeTransport = (idx: number) => {
            field.onChange(transports.filter((_, i) => i !== idx).map((tr, i) => ({ ...tr, order: i })));
          };
          const updateTransport = (idx: number, updates: Record<string, unknown>) => {
            const updated = [...transports];
            updated[idx] = { ...updated[idx], ...updates };
            field.onChange(updated);
          };
          const moveTransport = (idx: number, dir: -1 | 1) => {
            const next = idx + dir;
            if (next < 0 || next >= transports.length) return;
            const updated = [...transports];
            [updated[idx], updated[next]] = [updated[next], updated[idx]];
            field.onChange(updated.map((tr, i) => ({ ...tr, order: i })));
          };
          return (
            <FormItem>
              <div className="flex items-center justify-between mb-3">
                <FormLabel>{t("transports")}</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addTransport} className="gap-1.5">
                  <Plus className="h-4 w-4" />{t("addTransport")}
                </Button>
              </div>
              {transports.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">{t("noTransports")}</div>
              ) : (
                <div className="space-y-3">
                  {transports.map((tr, idx) => (
                    <div key={idx} className="rounded-lg border p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}</span>
                          <Select value={tr.transportType} onValueChange={(v) => updateTransport(idx, { transportType: v })}>
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TRANSPORT_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{t(`transport_${tt}`)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => moveTransport(idx, -1)} disabled={idx === 0}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => moveTransport(idx, 1)} disabled={idx === transports.length - 1}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeTransport(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{t("fromLocation")}</label>
                          <Input className="h-8 text-sm" value={tr.fromLocation}
                            onChange={(e) => updateTransport(idx, { fromLocation: e.target.value })}
                            placeholder={t("fromLocationPlaceholder")} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{t("toLocation")}</label>
                          <Input className="h-8 text-sm" value={tr.toLocation}
                            onChange={(e) => updateTransport(idx, { toLocation: e.target.value })}
                            placeholder={t("toLocationPlaceholder")} />
                        </div>
                      </div>
                      {tr.transportType === "FLY" && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!tr.isDirectFlight}
                            onChange={(e) => updateTransport(idx, { isDirectFlight: e.target.checked })}
                            className="cursor-pointer" />
                          <span className="text-sm">{t("directFlight")}</span>
                        </label>
                      )}
                      {tr.transportType === "CAR" && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{t("carType")}</label>
                          <Input className="h-8 text-sm" value={tr.carType || ""}
                            onChange={(e) => updateTransport(idx, { carType: e.target.value || null })}
                            placeholder={t("carTypePlaceholder")} />
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t("transportNotes")}</label>
                        <Input className="h-8 text-sm" value={tr.notes || ""}
                          onChange={(e) => updateTransport(idx, { notes: e.target.value || null })}
                          placeholder={t("transportNotesPlaceholder")} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }} />

        <Separator />

        {/*  Dates & Duration  */}
        <div className="grid gap-4 sm:grid-cols-3">
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
          <FormField control={form.control} name="numberOfDays" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("numberOfDays")}</FormLabel>
              <FormControl><Input type="number" min="1" dir="ltr" placeholder="10" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/*  Inclusions  */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("inclusions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="includesVisa" render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  <FormLabel className="cursor-pointer mb-0">{t("includesVisa")}</FormLabel>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="includesInsurance" render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  <FormLabel className="cursor-pointer mb-0">{t("includesInsurance")}</FormLabel>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="includesIslamicProgram" render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  <FormLabel className="cursor-pointer mb-0">{t("includesIslamicProgram")}</FormLabel>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="islamicAdvisor" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("islamicAdvisor")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("islamicAdvisorPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/*  Status (admin only)  */}
        {isSystemAdmin && (
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>{t("status")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {OFFER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* Agency Contact Information - Read Only */}
        {agency && (
          <Card className="bg-muted/50 border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("agencyContactInfo") || "Agency Contact Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agency Name */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("agencyName") || "Agency Name"}</p>
                <p className="text-sm">{agency.name || agency.nameEn || agency.nameAr || "—"}</p>
              </div>

              {/* Office Numbers */}
              {agency.officeNumbers && agency.officeNumbers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("officeNumbers") || "Office Numbers"}</p>
                  <div className="flex flex-wrap gap-2">
                    {agency.officeNumbers.map((num, idx) => (
                      <Badge key={idx} variant="outline">{num}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Numbers */}
              {agency.whatsappNumbers && agency.whatsappNumbers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("whatsappNumbers") || "WhatsApp Numbers"}</p>
                  <div className="flex flex-wrap gap-2">
                    {agency.whatsappNumbers.map((num, idx) => (
                      <Badge key={idx} variant="secondary">{num}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Email */}
              {agency.contactEmail && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("contactEmail") || "Contact Email"}</p>
                  <p className="text-sm break-all">{agency.contactEmail}</p>
                </div>
              )}

              {/* Instagram Account */}
              {agency.instagramAccount && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("instagramAccount") || "Instagram Account"}</p>
                  <p className="text-sm">{agency.instagramAccount}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto"
            onClick={() => { submitActionRef.current = "default"; }}
          >
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {submitLabel || tc("save")}
          </Button>

          {onSubmitAndContinue && (
            <Button
              type="submit"
              variant="outline"
              disabled={isLoading}
              className="w-full sm:w-auto"
              onClick={() => { submitActionRef.current = "continue"; }}
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {submitAndContinueLabel || t("createAndAddAnother")}
            </Button>
          )}
        </div>

          </div> {/* End Right Column */}
        </div> {/* End Grid Layout */}

      </form>

      {/* Duplicate Offer Confirmation Dialog */}
      <OfferDuplicateConfirmationDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        duplicateData={pendingDuplicateData}
        onCreateAnywayClick={handleCreateAnywayClick}
        isLoading={isRetrying}
      />
    </Form>
  );
}
