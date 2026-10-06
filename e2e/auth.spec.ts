import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { randomUUID } from 'node:crypto';
import { axeViolations } from './helpers.ts';
import { findVerifyLink } from './mailbox.ts';

const PASSWORD = 'Sillage2026x';
const THEME_KEY = 'sillage-theme';

// Cada teste cria o próprio usuário (e-mail com UUID) e roda em paralelo com os demais.
const uniqueEmail = (): string => `e2e-${randomUUID()}@exemplo.com`;

const registerViaUi = async (page: Page, email: string, password = PASSWORD) => {
  await page.goto('/register');
  await page.getByLabel('Nome').fill('Ana E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
};

const loginViaUi = async (page: Page, email: string, password: string) => {
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
};

const signOutViaUi = async (page: Page) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/$/);
};

test.describe('autenticação', () => {
  test('cadastro de novo usuário já entra na conta', async ({ page }) => {
    const email = uniqueEmail();
    await registerViaUi(page, email);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toHaveCount(0);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('sair limpa a sessão e volta à Home', async ({ page }) => {
    await registerViaUi(page, uniqueEmail());
    await expect(page).toHaveURL(/\/$/);
    await signOutViaUi(page);

    // Na Home há o "Entrar" da barra (desktop) e o do convite; basta que algum esteja à vista
    await expect(
      page.getByRole('link', { name: 'Entrar', exact: true }).locator('visible=true').first()
    ).toBeVisible();
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile$/);
  });

  test('senha incorreta mostra mensagem amigável em português', async ({ page }) => {
    const email = uniqueEmail();
    await registerViaUi(page, email);
    await expect(page).toHaveURL(/\/$/);
    await signOutViaUi(page);

    await page.goto('/login');
    await loginViaUi(page, email, 'SenhaErrada99');

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('E-mail ou senha incorretos');
    await expect(alert).not.toContainText(/invalid|credentials/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rota privada redireciona para o login e volta ao destino depois de entrar', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerViaUi(page, email);
    await expect(page).toHaveURL(/\/$/);
    await signOutViaUi(page);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile$/);
    await loginViaUi(page, email, PASSWORD);

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible();
  });

  test('quem já está logado não vê o login e segue para o ?redirect=', async ({ page }) => {
    await registerViaUi(page, uniqueEmail());
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/login?redirect=%2Fprofile');
    await expect(page).toHaveURL(/\/profile$/);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/$/);
  });

  test('esqueci a senha: e-mail, link, nova senha e login com ela', async ({ page }) => {
    const email = uniqueEmail();
    await registerViaUi(page, email);
    await expect(page).toHaveURL(/\/$/);
    await signOutViaUi(page);

    await page.goto('/forgot-password');
    await page.getByLabel('E-mail').fill(email);
    await page.getByRole('button', { name: 'Enviar link' }).click();
    await expect(page.getByRole('status')).toContainText('Se esse e-mail estiver cadastrado');

    // O e-mail chega ao Mailpit do Supabase local
    let link: string | null = null;
    await expect
      .poll(async () => (link = await findVerifyLink(email)), { timeout: 15_000 })
      .not.toBeNull();
    await page.goto(link ?? '');

    await expect(page).toHaveURL(/\/reset-password/);
    await expect(page.getByRole('heading', { name: 'Nova senha', level: 1 })).toBeVisible();
    const newPassword = 'NovaSenha2026y';
    await page.getByLabel('Nova senha', { exact: true }).fill(newPassword);
    await page.getByLabel('Repita a nova senha').fill(newPassword);
    await page.getByRole('button', { name: 'Salvar nova senha' }).click();
    await expect(page).toHaveURL(/\/$/);

    await signOutViaUi(page);
    await page.goto('/login');
    await loginViaUi(page, email, PASSWORD);
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
    await loginViaUi(page, email, newPassword);
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/profile');
    await expect(page.getByText(email)).toBeVisible();
  });

  test('link de recuperação inválido mostra como pedir outro', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Link inválido ou expirado' })).toBeVisible();
    await page.getByRole('link', { name: 'Pedir novo link' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});

const THEMES = ['light', 'dark'] as const;
const WIDTHS = [
  { width: 360, height: 780 },
  { width: 1280, height: 800 },
] as const;

for (const theme of THEMES) {
  for (const viewport of WIDTHS) {
    test.describe(`axe nas telas de auth a ${viewport.width} px, tema ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(
          ([key, value]) => window.localStorage.setItem(key as string, value as string),
          [THEME_KEY, theme]
        );
        await page.setViewportSize(viewport);
      });

      const expectTheme = async (page: Page) =>
        expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);

      test('login, com erros de validação', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await expect(page.getByText('Informe seu e-mail.')).toBeVisible();
        await expectTheme(page);
        expect(await axeViolations(page)).toEqual([]);
      });

      test('cadastro, com erros de validação', async ({ page }) => {
        await page.goto('/register');
        await page.getByRole('button', { name: 'Criar conta' }).click();
        await expect(page.getByText('Informe como podemos chamar você.')).toBeVisible();
        await expectTheme(page);
        expect(await axeViolations(page)).toEqual([]);
      });

      test('esqueci a senha', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.getByRole('button', { name: 'Enviar link' }).click();
        await expect(page.getByText('Informe seu e-mail.')).toBeVisible();
        await expectTheme(page);
        expect(await axeViolations(page)).toEqual([]);
      });

      test('redefinir senha: link inválido', async ({ page }) => {
        await page.goto('/reset-password');
        await expect(
          page.getByRole('heading', { name: 'Link inválido ou expirado' })
        ).toBeVisible();
        await expectTheme(page);
        expect(await axeViolations(page)).toEqual([]);
      });

      test('redefinir senha: formulário (sessão de recuperação), com erros', async ({ page }) => {
        await registerViaUi(page, uniqueEmail());
        await expect(page).toHaveURL(/\/$/);
        await page.goto('/reset-password');
        await page.getByRole('button', { name: 'Salvar nova senha' }).click();
        await expect(page.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeVisible();
        await expectTheme(page);
        expect(await axeViolations(page)).toEqual([]);
      });
    });
  }
}
