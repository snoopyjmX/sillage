import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BrandLinkProps {
  brandName: string;
  brandSlug: string;
  className?: string;
}

// Marca como atalho para o catálogo filtrado por ela (`/catalog?brands=slug`)
export function BrandLink({ brandName, brandSlug, className }: BrandLinkProps) {
  return (
    <Link
      to={`/catalog?brands=${encodeURIComponent(brandSlug)}`}
      className={cn(
        'inline-flex min-h-11 w-fit items-center rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className
      )}
    >
      {brandName}
    </Link>
  );
}
