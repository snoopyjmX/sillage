import { Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';

const DEBOUNCE_MS = 300;

interface SearchInputProps {
  // Texto atual da URL
  value: string;
  onSearch: (text: string) => void;
}

// Debounce de 300 ms (docs/PRODUCT.md, Seção 8); Enter busca na hora.
export function SearchInput({ value, onSearch }: SearchInputProps) {
  const id = useId();
  const [text, setText] = useState(value);
  // Último texto que este campo enviou para a URL, para distinguir eco de mudança externa
  const [sent, setSent] = useState(value);
  const [seen, setSeen] = useState(value);

  // Mudança externa (voltar do navegador, limpar filtros...): o campo acompanha a URL.
  // Ajuste de estado durante a renderização, sem efeito.
  if (value !== seen) {
    setSeen(value);
    if (value !== sent) {
      setText(value);
      setSent(value);
    }
  }

  const commit = (next: string) => {
    const clean = next.replace(/\s+/g, ' ').trim();
    if (clean === sent) return;
    setSent(clean);
    onSearch(clean);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean === sent) return;
      setSent(clean);
      onSearch(clean);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, sent, onSearch]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        commit(text);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar perfumes ou marcas
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="search"
          value={text}
          maxLength={100}
          autoComplete="off"
          placeholder="Buscar perfumes ou marcas"
          className="pl-10"
          onChange={(event) => setText(event.target.value)}
        />
      </div>
    </form>
  );
}
