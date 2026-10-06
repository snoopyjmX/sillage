import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_BANNER_TEXT } from '@/constants/offline';
import { OfflineBanner } from './OfflineBanner';

const setOnline = (value: boolean) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
};

afterEach(() => vi.restoreAllMocks());

describe('OfflineBanner', () => {
  it('só aparece sem conexão', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    setOnline(false);
    expect(screen.getByRole('status')).toHaveTextContent(OFFLINE_BANNER_TEXT);
  });
});
