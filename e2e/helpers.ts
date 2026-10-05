import { AxeBuilder } from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';

// No desktop os filtros são um painel lateral; no celular, uma gaveta aberta por um botão.
export const openFilters = async (page: Page, isMobile: boolean): Promise<Locator> => {
  if (!isMobile) return page.getByRole('complementary', { name: 'Filtros' });
  await page.getByRole('button', { name: /^Filtros/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Filtros' });
  await drawer.waitFor();
  return drawer;
};

export const closeFilters = async (page: Page, isMobile: boolean): Promise<void> => {
  if (!isMobile) return;
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Filtros' }).waitFor({ state: 'hidden' });
};

// Escolhe uma nota no combobox (digita, clica na opção).
export const pickNote = async (filters: Locator, typed: string, optionName: RegExp) => {
  const combobox = filters.getByRole('combobox', { name: 'Buscar nota' });
  await combobox.fill(typed);
  await filters.getByRole('option', { name: optionName }).click();
};

export const cards = (page: Page): Locator => page.getByRole('article');
export const cardTitle = (page: Page, name: string): Locator =>
  page.getByRole('heading', { level: 2, name });

// Varredura axe com as regras WCAG 2.x A/AA; devolve só o que importa para a mensagem de falha.
export const axeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }));
};
