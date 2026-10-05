import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Link de texto das telas de auth (sublinhado sempre: não depende só da cor, WCAG 1.4.1)
export function AuthLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        'rounded-sm font-medium text-primary underline underline-offset-4 outline-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className
      )}
      {...props}
    />
  );
}
