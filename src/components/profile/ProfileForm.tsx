import { useForm } from 'react-hook-form';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
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
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), values });

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
        hint="Define a data do seu Perfume do Dia e a cidade do clima. Ex.: America/Sao_Paulo."
        error={errors.timezone?.message}
        {...register('timezone')}
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
