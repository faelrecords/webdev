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

test('duplica elemento sem persistir artefatos editoriais', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  const canvas = page.frameLocator('.canvas-frame iframe');
  await canvas.locator('h1').click();
  await page.getByRole('button', { name: 'Avançado' }).click();
  await page.getByRole('button', { name: 'Duplicar elemento' }).click();
  await expect(canvas.locator('h1')).toHaveCount(2);
  await expect(canvas.locator('#wd-editor-bridge')).toHaveCount(1);
  await expect(canvas.locator('.wd-context-menu')).toHaveCount(0);
});

test('copia e cola elemento no canvas', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  const canvas = page.frameLocator('.canvas-frame iframe');
  const heading = canvas.locator('h1');
  await heading.click();
  await heading.press('Control+c');
  await heading.press('Control+v');
  await expect(canvas.locator('h1')).toHaveCount(2);
});

test('mantém estilo separado por dispositivo', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  const canvas = page.frameLocator('.canvas-frame iframe');
  await canvas.locator('h1').click();
  await page.getByRole('button', { name: 'mobile' }).click();
  const size = page.getByRole('textbox', { name: 'Tamanho' });
  await size.fill('31px');
  await size.press('Tab');
  await expect(canvas.locator('h1')).toHaveCSS('font-size', '31px');
  await page.getByRole('button', { name: 'desktop' }).click();
  await expect(canvas.locator('h1')).not.toHaveCSS('font-size', '31px');
});

test('configura animação visual com fallback', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  const canvas = page.frameLocator('.canvas-frame iframe');
  await canvas.locator('h1').click();
  await page.getByRole('button', { name: 'Avançado' }).click();
  await page.getByLabel('Entrada').selectOption('fade-up');
  await expect(canvas.locator('h1')).toHaveAttribute('data-wd-animation', 'fade-up');
  await expect(canvas.locator('h1')).toHaveClass(/wd-animate/);
});

test('oferece widgets avançados', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  await expect(page.getByRole('button', { name: 'Carrossel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Popup' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lottie' })).toBeVisible();
});

test('edita dados SEO da página', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto' }).click();
  await page.getByRole('button', { name: /Página:/ }).click();
  await page.getByRole('button', { name: 'Página e SEO' }).click();
  await page.getByLabel('Título').fill('Título otimizado');
  await page.getByLabel('Descrição').fill('Descrição para mecanismos de busca.');
  await page.locator('.page-settings').getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Página e SEO' })).toHaveCount(0);
});
