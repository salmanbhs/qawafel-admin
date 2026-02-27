"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { useUploadAgencyIcon, useUploadAgencyBanner } from "@/hooks/use-agencies";
import { getApiErrorMessage } from "@/lib/api";
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
  agencyId?: string;
}

export function AgencyForm({ defaultValues, onSubmit, isLoading, submitLabel, agencyId }: AgencyFormProps) {
  const t = useTranslations("agencies");
  const tc = useTranslations("common");
  
  const [iconPreview, setIconPreview] = useState<string | null>(defaultValues?.iconImageUrl || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(defaultValues?.bannerImageUrl || null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const uploadIcon = useUploadAgencyIcon(agencyId || "");
  const uploadBanner = useUploadAgencyBanner(agencyId || "");

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

  const handleIconUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !agencyId) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(tc("invalidFileType"));
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadIcon.mutateAsync(formData);
      setIconPreview(URL.createObjectURL(file));
      toast.success(t("iconUploaded"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !agencyId) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(tc("invalidFileType"));
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadBanner.mutateAsync(formData);
      setBannerPreview(URL.createObjectURL(file));
      toast.success(t("bannerUploaded"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
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

        {/* Icon and Banner Upload */}
        {agencyId && (
          <div className="space-y-6 pt-4 border-t">
            <div>
              <h3 className="font-semibold mb-4">{t("images")}</h3>
              
              {/* Icon Upload */}
              <div className="space-y-2 mb-6">
                <FormLabel>{t("agencyIcon")}</FormLabel>
                <p className="text-xs text-muted-foreground">{t("maxSize")} 5MB · {t("formats")} JPEG, PNG, WebP, GIF</p>
                
                {iconPreview && (
                  <div className="relative w-32 h-32 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                    <img src={iconPreview} alt="Icon preview" className="w-full h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setIconPreview(null)}
                      className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white rounded p-1 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {!iconPreview && (
                  <div
                    onClick={() => iconInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 p-6 cursor-pointer transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">{t("uploadIcon")}</p>
                    <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
                  </div>
                )}
                
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleIconUpload(e.target.files)}
                  disabled={uploadIcon.isPending}
                />
              </div>

              {/* Banner Upload */}
              <div className="space-y-2">
                <FormLabel>{t("agencyBanner")}</FormLabel>
                <p className="text-xs text-muted-foreground">{t("maxSize")} 5MB · {t("formats")} JPEG, PNG, WebP, GIF</p>
                
                {bannerPreview && (
                  <div className="relative w-full h-40 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setBannerPreview(null)}
                      className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white rounded p-1 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {!bannerPreview && (
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 p-6 cursor-pointer transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">{t("uploadBanner")}</p>
                    <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
                  </div>
                )}
                
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleBannerUpload(e.target.files)}
                  disabled={uploadBanner.isPending}
                />
              </div>
            </div>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {submitLabel || tc("save")}
        </Button>
      </form>
    </Form>
  );
}
