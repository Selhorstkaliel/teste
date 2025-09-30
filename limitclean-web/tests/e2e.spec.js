// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('LimitClean fluxo básico', () => {
  test('login, dashboard e cadastro', async ({ page }) => {
    await page.goto('http://localhost:4173/index.html');
    await page.fill('input[name="username"]', 'Kaliel');
    await page.fill('input[name="password"]', 'kaskolk14');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Dashboard Operacional' })).toBeVisible();
    await page.click('text=Cadastro');
    await page.fill('input[name="doc"]', '52998224725');
    await page.fill('input[name="nome"]', 'Cliente Teste');
    await page.fill('input[name="telefone"]', '11999999999');
    await page.fill('input[name="valor"]', '1000');
    await page.check('input[name="termos"]');
    await page.click('button:has-text("Salvar")');
    await expect(page.getByText('Contrato gerado')).toBeVisible();
  });
});
