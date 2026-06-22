import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('webdev-studio'));
  await page.reload();
});

test('cria projeto e abre editor completo', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByRole('button', { name: 'Exportar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Container' })).toBeVisible();
  await expect(page.locator('.canvas-frame iframe')).toBeVisible();
});

test('adiciona modelo e registra histórico', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  await page.getByRole('button', { name: 'Modelos' }).click();
  await page.getByRole('button', { name: /Hero moderno/ }).click();
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByRole('button', { name: /Adicionar elemento/ })).toBeVisible();
});

test('seleciona elemento e altera estilo', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  const canvas = page.frameLocator('.canvas-frame iframe');
  await canvas.locator('h1').click();
  const size = page.getByRole('textbox', { name: 'Tamanho' });
  await expect(size).toBeVisible();
  await size.fill('64px');
  await size.press('Tab');
  await expect(canvas.locator('h1')).toHaveCSS('font-size', '64px');
});

test('alterna canvas para celular', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  await page.getByRole('button', { name: 'mobile' }).click();
  await expect(page.locator('.canvas-scale')).toHaveCSS('width', /351|350|390/);
  await expect(page.getByText('390 × 844')).toBeVisible();
});
