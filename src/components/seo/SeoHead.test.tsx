import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeoHead } from './SeoHead';

const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content');

describe('SeoHead', () => {
  it('concatena a marca ao título e usa a imagem padrão em URL absoluta', async () => {
    render(<SeoHead title="Catálogo" description="Explore." />);
    await waitFor(() => expect(document.title).toBe('Catálogo — Sillage'));
    expect(meta('meta[property="og:title"]')).toBe('Catálogo — Sillage');
    expect(meta('meta[property="og:type"]')).toBe('website');
    expect(meta('meta[property="og:image"]')).toBe(`${window.location.origin}/pwa-512x512.png`);
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('não duplica a marca quando o título já é Sillage', async () => {
    render(<SeoHead title="Sillage" />);
    await waitFor(() => expect(meta('meta[property="og:title"]')).toBe('Sillage'));
  });

  it('respeita imageUrl e type informados', async () => {
    render(<SeoHead title="X" imageUrl="https://cdn.test/x.jpg" type="article" />);
    await waitFor(() => expect(meta('meta[property="og:type"]')).toBe('article'));
    expect(meta('meta[name="twitter:image"]')).toBe('https://cdn.test/x.jpg');
  });
});
