// Moldura das telas de autenticação: um cartão centralizado, título serifado e rodapé de links.
import type { ReactNode } from 'react';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 pt-4 md:pt-10">
      <Card className="gap-6 p-6">
        <CardHeader>
          <h1 className="font-heading text-3xl leading-tight font-medium">{title}</h1>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {children}
      </Card>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
