import { useContext } from 'react';
import { TabsContext, type TabsContextValue } from '@/lib/tabs-context';

export const useTabsContext = (): TabsContextValue => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger precisa estar dentro de <Tabs>');
  return context;
};
