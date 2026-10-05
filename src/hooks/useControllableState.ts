import { useCallback, useState } from 'react';

interface Options<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: ((next: T) => void) | undefined;
}

// Estado controlado ou não, no padrão dos componentes do Radix
export const useControllableState = <T>({
  value,
  defaultValue,
  onChange,
}: Options<T>): [T, (next: T) => void] => {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return [isControlled ? value : internal, setValue];
};
