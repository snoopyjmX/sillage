import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from '@/lib/toast';
import { getBrowserTimezone, readTimezoneAuto, writeTimezoneAuto } from '@/lib/timezone';
import { zodResolver } from '@/lib/zodResolver';
import { MAX_NAME_LENGTH } from '@/schemas/auth';
import { profileSchema, type ProfileValues } from '@/schemas/profile';

interface ProfileFormProps {
  values: ProfileValues;
  timezones: readonly string[];
  saving: boolean;
  onSave: (values: ProfileValues) => void;
}

const DATALIST_ID = 'profile-timezones';

// Nome de exibição e fuso (RHF + Zod). Só apresenta: quem usa decide o que fazer ao salvar.
export function ProfileForm({ values, timezones, saving, onSave }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), values });

  // Fuso automático: o campo acompanha o navegador (e fica só leitura) até o usuário desligar
  const [auto, setAuto] = useState(readTimezoneAuto);
  useEffect(() => {
    if (auto) setValue('timezone', getBrowserTimezone(), { shouldDirty: true });
  }, [auto, values.timezone, setValue]);

  const handleAutoChange = (next: boolean) => {
    setAuto(next);
    writeTimezoneAuto(next);
    if (next) {
      setValue('timezone', getBrowserTimezone(), { shouldDirty: true });
      toast.success('Detecção automática de fuso ativada.');
    } else {
      toast.info('Detecção automática desligada, o fuso agora é manual.');
    }
  };

  const onSubmit = handleSubmit((next) => onSave(next));

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Dados do perfil"
      className="flex flex-col gap-4"
    >
      <Field
        label="Nome"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        error={errors.displayName?.message}
        {...register('displayName')}
      />
      <Field
        label="Fuso horário"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        list={DATALIST_ID}
        readOnly={auto}
        hint={
          auto
            ? 'Detectado automaticamente pelo navegador.'
            : 'Define a data do seu Perfume do Dia e a cidade do clima. Ex.: America/Sao_Paulo.'
        }
        error={errors.timezone?.message}
        {...register('timezone')}
      />
      <Checkbox
        label="Detectar fuso horário automaticamente"
        checked={auto}
        onChange={(event) => handleAutoChange(event.target.checked)}
        className="font-medium"
      />
      <datalist id={DATALIST_ID}>
        {timezones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
      <SubmitButton loading={saving} loadingLabel="Salvando…" className="sm:self-start">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}
