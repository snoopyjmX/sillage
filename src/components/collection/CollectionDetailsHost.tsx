import { useSyncExternalStore } from 'react';
import { CollectionDetailsDialog } from '@/components/collection/CollectionDetailsDialog';
import { useCollection, useSetCollectionDetails } from '@/hooks/useCollection';
import {
  closeCollectionDetails,
  getCollectionDetailsTarget,
  subscribeCollectionDetails,
} from '@/lib/collectionDetailsStore';

// O único diálogo "Detalhar formato" do app, no AppShell. Abre por `openCollectionDetails` (botão
// "Detalhar" da Coleção e ação do toast de "Tenho"). Só abre para perfume em "Tenho" (RN11).
export function CollectionDetailsHost() {
  const target = useSyncExternalStore(
    subscribeCollectionDetails,
    getCollectionDetailsTarget,
    getCollectionDetailsTarget
  );
  const collection = useCollection();
  const setDetails = useSetCollectionDetails();

  const item = target
    ? collection.data?.find(({ perfume }) => perfume.id === target.id)
    : undefined;
  if (!target || !item || item.status !== 'owned') return null;

  return (
    <CollectionDetailsDialog
      open
      onOpenChange={(open) => {
        if (!open) closeCollectionDetails();
      }}
      perfume={item.perfume}
      initial={{ format: item.format, volumeMl: item.volumeMl }}
      onSave={({ format, volumeMl }) =>
        setDetails.mutate({ perfume: item.perfume, format, volumeMl })
      }
    />
  );
}
