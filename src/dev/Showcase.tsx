// Vitrine TEMPORÁRIA de desenvolvimento (abra com `npm run dev` e /?vitrine).
// Não entra no build de produção. Mostra os componentes nos dois modos lado a lado.
import { Bell, SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ThemeToggler } from '@/components/ui/theme-toggler';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONCENTRATIONS, CONCENTRATION_LABELS, FAMILIES, FAMILY_LABELS } from '@/constants/labels';
import { toast } from '@/lib/toast';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Panel({ mode }: { mode: 'light' | 'dark' }) {
  const [rating, setRating] = useState<number | null>(3);
  const [selected, setSelected] = useState<string | null>(FAMILIES[0] ?? null);

  return (
    <div className={`${mode} flex flex-col gap-8 bg-background p-6 text-foreground`}>
      <h2 className="font-heading text-3xl font-semibold">
        {mode === 'light' ? 'Modo claro' : 'Modo escuro'}
      </h2>

      <Section title="Botões">
        <div className="flex flex-wrap gap-2">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Desabilitado</Button>
          <Button size="icon" aria-label="Notificações">
            <Bell />
          </Button>
        </div>
      </Section>

      <Section title="Campo">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Buscar" aria-label="Buscar" />
          <Input defaultValue="Valor inválido" aria-invalid aria-label="Campo inválido" />
        </div>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Título do card</CardTitle>
            <CardDescription>Descrição de apoio em texto secundário.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">Conteúdo do card.</CardContent>
          <CardFooter>
            <Button size="sm">Ação</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Chips de família">
        <div className="flex flex-wrap gap-2">
          {FAMILIES.map((family) => (
            <Chip key={family} family={family}>
              {FAMILY_LABELS[family]}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Chips selecionáveis e selos">
        <div className="flex flex-wrap items-center gap-2">
          {FAMILIES.slice(0, 3).map((family) => (
            <Chip
              key={family}
              family={family}
              selected={selected === family}
              onClick={() => setSelected(family)}
            >
              {FAMILY_LABELS[family]}
            </Chip>
          ))}
          <Chip>Neutro</Chip>
          {CONCENTRATIONS.map((concentration) => (
            <Chip key={concentration} variant="concentration">
              {CONCENTRATION_LABELS[concentration]}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Avaliação">
        <div className="flex flex-wrap items-center gap-6">
          <Rating label="Fixação" value={rating} onValueChange={setRating} showValue />
          <Rating label="Média" readOnly value={4.2} showValue />
          <Rating label="Desabilitada" defaultValue={2} disabled />
        </div>
      </Section>

      <Section title="Abas">
        <Tabs defaultValue="primeira">
          <TabsList>
            <TabsTrigger value="primeira">Primeira</TabsTrigger>
            <TabsTrigger value="segunda">Segunda</TabsTrigger>
          </TabsList>
          <TabsContent value="primeira" className="text-sm">
            Conteúdo da primeira aba.
          </TabsContent>
          <TabsContent value="segunda" className="text-sm">
            Conteúdo da segunda aba.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Camadas flutuantes e toast">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Título do diálogo</DialogTitle>
                <DialogDescription>Texto de apoio do diálogo.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Confirmar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Abrir gaveta</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Título da gaveta</DrawerTitle>
                <DrawerDescription>Arraste a alça para baixo para fechar.</DrawerDescription>
              </DrawerHeader>
              <Input placeholder="Campo de exemplo" aria-label="Campo de exemplo" />
            </DrawerContent>
          </Drawer>
          <Button variant="outline" onClick={() => toast.success('Ação concluída')}>
            Toast de sucesso
          </Button>
          <Button variant="outline" onClick={() => toast.error('Não foi possível concluir')}>
            Toast de erro
          </Button>
        </div>
      </Section>

      <Section title="Carregando">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      <Section title="Vazio e erro">
        <Card className="p-0">
          <EmptyState
            icon={SearchX}
            title="Nada por aqui"
            description="Ajuste os filtros para ver resultados."
            action={<Button variant="outline">Limpar filtros</Button>}
          />
        </Card>
        <Card className="p-0">
          <ErrorState onRetry={() => toast('Tentando de novo')} />
        </Card>
      </Section>
    </div>
  );
}

export default function Showcase() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="font-heading text-2xl font-semibold text-primary">Vitrine de componentes</h1>
        <ThemeToggler />
      </header>
      <div className="grid lg:grid-cols-2">
        <Panel mode="light" />
        <Panel mode="dark" />
      </div>
    </main>
  );
}
