import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const t = useTranslations("common");
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <span className="text-sm text-[hsl(var(--muted-foreground))]">
        {t("page")} {page} {t("of")} {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}
