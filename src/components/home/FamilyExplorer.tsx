import { Link } from 'react-router-dom';
import { Chip } from '@/components/ui/chip';
import { FAMILIES, FAMILY_LABELS } from '@/constants/labels';

// "Explore por família": cada chip leva ao catálogo já filtrado
export function FamilyExplorer() {
  return (
    <section aria-labelledby="familias" className="flex flex-col gap-4">
      <h2 id="familias" className="font-heading text-2xl font-medium">
        Explore por família
      </h2>
      <ul aria-label="Famílias olfativas" className="flex flex-wrap gap-x-2 gap-y-1">
        {FAMILIES.map((family) => (
          <li key={family}>
            <Link
              to={`/catalog?families=${family}`}
              aria-label={`Explorar perfumes da família ${FAMILY_LABELS[family]}`}
              className="inline-flex min-h-11 items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Chip family={family}>{FAMILY_LABELS[family]}</Chip>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
