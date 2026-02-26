"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  description: string;
  trigger: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  variant?: "destructive" | "default";
  isLoading?: boolean;
}

export function ConfirmDialog({
  title,
  description,
  trigger,
  onConfirm,
  variant = "destructive",
  isLoading: externalLoading,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  async function handleConfirm() {
    setInternalLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === "destructive" && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--destructive)/0.1)]">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--destructive))]" />
              </div>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
