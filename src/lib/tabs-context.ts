import { createContext } from 'react';

export interface TabsContextValue {
  current: string | undefined;
  indicatorId: string;
}

export const TabsContext = createContext<TabsContextValue | null>(null);
