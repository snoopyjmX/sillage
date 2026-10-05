// Origem: shadcn/ui (tabs) sobre Radix, genérico (Coleção usará Tenho/Quero).
// O indicador desliza com layoutId + spring "físico" (transform), conforme Seção 10.
import { motion } from 'motion/react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { useId, type ComponentProps } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { useTabsContext } from '@/hooks/useTabsContext';
import { transitions } from '@/lib/motion';
import { TabsContext } from '@/lib/tabs-context';
import { cn } from '@/lib/utils';

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  const indicatorId = useId();
  const [current, setCurrent] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });
  return (
    <TabsContext.Provider value={{ current, indicatorId }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        value={current}
        onValueChange={setCurrent}
        className={cn('flex flex-col gap-3', className)}
        {...props}
      />
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('relative isolate inline-flex w-full gap-1 rounded-lg bg-muted p-1', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  children,
  value,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { current, indicatorId } = useTabsContext();
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        'relative inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground outline-none',
        'data-[state=active]:text-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {current === value && (
        <motion.span
          layoutId={`tabs-indicator-${indicatorId}`}
          className="absolute inset-0 -z-10 rounded-md border bg-card shadow-subtle"
          transition={transitions.physical}
        />
      )}
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('outline-none focus-visible:outline-2 focus-visible:outline-ring', className)}
      {...props}
    />
  );
}
