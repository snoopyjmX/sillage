// Origem: própria. Field de senha com botão de mostrar/ocultar (alvo de toque de 44 px).
import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { Field } from './field';

type PasswordFieldProps = Omit<ComponentProps<typeof Field>, 'type' | 'endAdornment'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <Field
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
        >
          <Icon className="size-5" aria-hidden />
        </button>
      }
      {...props}
    />
  );
}
