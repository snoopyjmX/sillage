import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInteger } from '@/lib/format';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 pt-6">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft aria-hidden />
        Anterior
      </Button>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Página {formatInteger(page)} de {formatInteger(totalPages)}
      </p>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
