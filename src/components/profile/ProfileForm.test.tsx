import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as timezone from '@/lib/timezone';
import { ProfileForm } from './ProfileForm';

const toastInfo = vi.fn();
const toastSuccess = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: { info: (m: string) => toastInfo(m), success: (m: string) => toastSuccess(m) },
}));

const values = { displayName: 'Ana', timezone: 'America/Sao_Paulo' };
const TOGGLE = 'Detectar fuso horário automaticamente';

const setup = (onSave = vi.fn()) => {
  render(
    <ProfileForm values={values} timezones={['Europe/Lisbon']} saving={false} onSave={onSave} />
  );
  return onSave;
};

describe('ProfileForm: fuso automático', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.spyOn(timezone, 'getBrowserTimezone').mockReturnValue('Europe/Lisbon');
  });

  it('por padrão está ligado: campo com o fuso do navegador, somente leitura e com a mensagem', async () => {
    setup();
    expect(screen.getByRole('checkbox', { name: TOGGLE })).toBeChecked();
    const field = screen.getByLabelText('Fuso horário');
    await waitFor(() => expect(field).toHaveValue('Europe/Lisbon'));
    expect(field).toHaveAttribute('readonly');
    expect(screen.getByText('Detectado automaticamente pelo navegador.')).toBeInTheDocument();
  });

  it('desligar libera o campo, guarda a preferência e avisa', () => {
    setup();
    fireEvent.click(screen.getByRole('checkbox', { name: TOGGLE }));
    expect(screen.getByLabelText('Fuso horário')).not.toHaveAttribute('readonly');
    expect(window.localStorage.getItem('sillage-timezone-auto')).toBe('false');
    expect(toastInfo).toHaveBeenCalledWith('Detecção automática desligada, o fuso agora é manual.');
  });

  it('preferência manual guardada é respeitada e o fuso do perfil é mantido', () => {
    window.localStorage.setItem('sillage-timezone-auto', 'false');
    setup();
    expect(screen.getByRole('checkbox', { name: TOGGLE })).not.toBeChecked();
    expect(screen.getByLabelText('Fuso horário')).toHaveValue('America/Sao_Paulo');
  });

  it('ligar de novo atualiza o campo na hora e avisa', async () => {
    window.localStorage.setItem('sillage-timezone-auto', 'false');
    setup();
    fireEvent.change(screen.getByLabelText('Fuso horário'), { target: { value: 'Asia/Tokyo' } });
    fireEvent.click(screen.getByRole('checkbox', { name: TOGGLE }));
    await waitFor(() => expect(screen.getByLabelText('Fuso horário')).toHaveValue('Europe/Lisbon'));
    expect(window.localStorage.getItem('sillage-timezone-auto')).toBe('true');
    expect(toastSuccess).toHaveBeenCalledWith('Detecção automática de fuso ativada.');
  });

  it('salvar com o automático ligado envia o fuso do navegador', async () => {
    const onSave = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ displayName: 'Ana', timezone: 'Europe/Lisbon' })
    );
  });
});
