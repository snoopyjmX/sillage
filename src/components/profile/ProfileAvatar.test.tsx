import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileAvatar } from './ProfileAvatar';

describe('ProfileAvatar', () => {
  it('sem foto mostra as iniciais', () => {
    render(<ProfileAvatar initials="AS" />);
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('com foto mostra a imagem redonda e não as iniciais', () => {
    render(<ProfileAvatar initials="AS" avatarUrl="https://cdn/a.webp" />);
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://cdn/a.webp');
    expect(img).toHaveClass('rounded-full', 'size-16', 'object-cover');
    expect(screen.queryByText('AS')).not.toBeInTheDocument();
  });

  it('foto que falha ao carregar volta para as iniciais', () => {
    render(<ProfileAvatar initials="AS" avatarUrl="https://cdn/quebrada.webp" />);
    const img = document.querySelector('img');
    if (!img) throw new Error('imagem ausente');
    fireEvent.error(img);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('não editável não oferece nenhuma ação', () => {
    render(<ProfileAvatar initials="AS" avatarUrl="https://cdn/a.webp" />);
    expect(screen.queryByLabelText('Alterar foto de perfil')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover foto de perfil' })).toBeNull();
  });

  it('editável: o input de arquivo aceita só imagens e entrega o arquivo escolhido', () => {
    const onUpload = vi.fn();
    render(<ProfileAvatar initials="AS" editable onUpload={onUpload} />);
    const input = screen.getByLabelText('Alterar foto de perfil');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp,image/avif');
    const file = new File(['x'], 'eu.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('"Remover" só aparece com foto e chama onRemove', () => {
    const onRemove = vi.fn();
    const { rerender } = render(<ProfileAvatar initials="AS" editable onRemove={onRemove} />);
    expect(screen.queryByRole('button', { name: 'Remover foto de perfil' })).toBeNull();
    rerender(
      <ProfileAvatar initials="AS" editable avatarUrl="https://cdn/a.webp" onRemove={onRemove} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remover foto de perfil' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('enviando: aria-busy e as ações ficam desabilitadas', () => {
    const { container } = render(
      <ProfileAvatar initials="AS" editable uploading avatarUrl="https://cdn/a.webp" />
    );
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('Alterar foto de perfil')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remover foto de perfil' })).toBeDisabled();
  });
});
