import { expect, test, type Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const local = process.env.LCP_E2E_ADMIN_PASSWORD
  ? {
      adminPassword: process.env.LCP_E2E_ADMIN_PASSWORD,
      demoPassword: process.env.LCP_E2E_DEMO_PASSWORD,
    }
  : (JSON.parse(
      readFileSync(path.join(root, '.local/runtime.json'), 'utf8').replace(/^\uFEFF/, ''),
    ) as { adminPassword: string; demoPassword: string });
const screenshots = path.join(root, 'artifacts/platform-skeleton/screenshots');
mkdirSync(screenshots, { recursive: true });
async function login(page: Page, role: 'admin' | 'demo') {
  await page.goto('/login');
  await page.getByLabel('账号', { exact: true }).fill(role);
  await page
    .getByLabel('密码', { exact: true })
    .fill(role === 'admin' ? local.adminPassword! : local.demoPassword!);
  await page.getByRole('button', { name: '登录工作空间' }).click();
  await expect(page).toHaveURL(/\/objects\/purchase_request$/);
  await expect(page.getByRole('heading', { name: '采购申请', exact: true })).toBeVisible();
}
async function field(page: Page, label: string, apiName: string, decimal = false) {
  await page.getByRole('button', { name: '添加字段', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('显示名称', { exact: true }).fill(label);
  await dialog.getByLabel('API 名称', { exact: true }).fill(apiName);
  if (decimal) {
    await dialog.getByLabel('字段类型', { exact: true }).click();
    await page.getByText('小数 / 金额', { exact: true }).last().click();
    await dialog.getByLabel('总精度', { exact: true }).fill('20');
  }
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('cell', { name: apiName, exact: true })).toBeVisible();
}

test('login errors, real list/detail, logout and screenshots', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  await page.screenshot({ path: path.join(screenshots, 'login-desktop.png'), fullPage: true });
  await page.getByLabel('账号', { exact: true }).fill('admin');
  await page.getByLabel('密码', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: '登录工作空间' }).click();
  await expect(page.getByText('账号或密码不正确', { exact: true })).toBeVisible();
  await login(page, 'admin');
  await expect(page.getByRole('link', { name: 'PR-DEMO-001', exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, 'records-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'PR-DEMO-001', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PR-DEMO-001', exact: true })).toBeVisible();
  await expect(page.getByText('12,800.00', { exact: true })).toBeVisible();
  await expect(page.getByText('2026-10-20', { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, 'detail-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '平台管理员' }).click();
  await page.getByText('退出登录', { exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/objects/purchase_request');
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test('object manager creates and publishes runtime fields; records round-trip through UI', async ({
  page,
}) => {
  await login(page, 'admin');
  await page.getByRole('menuitem', { name: '对象管理器' }).click();
  await expect(page.getByRole('heading', { name: '对象管理器', exact: true })).toBeVisible();
  await page.screenshot({
    path: path.join(screenshots, 'object-manager-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '新建对象', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const suffix = Date.now().toString(36);
  const apiName = `ui_${suffix}`;
  const label = `验收单据${suffix}`;
  await dialog.getByLabel('显示名称', { exact: true }).fill(label);
  await dialog.getByLabel('API 名称', { exact: true }).fill(apiName);
  await dialog.getByRole('button', { name: '创建对象', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/setup/objects/${apiName}$`));
  await field(page, '单号', 'document_no');
  await field(page, '金额', 'amount', true);
  await page.getByRole('button', { name: '发布对象', exact: true }).click();
  await page.getByRole('button', { name: '确认发布', exact: true }).click();
  await expect(page.getByText('已发布 · v1', { exact: true })).toBeVisible();
  await expect(page.locator('.ant-modal-mask')).toHaveCount(0);
  await page.screenshot({
    path: path.join(screenshots, 'object-configuration-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '查看业务列表', exact: true }).click();
  await page.getByRole('button', { name: `新建${label}`, exact: true }).click();
  const recordDialog = page.getByRole('dialog');
  await recordDialog.getByLabel('单号', { exact: true }).fill('UI-ROUNDTRIP-001');
  await recordDialog.getByLabel('金额', { exact: true }).fill('9007199254740993.21');
  await recordDialog.getByRole('button', { name: '保存记录', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'UI-ROUNDTRIP-001', exact: true })).toBeVisible();
  await expect(page.getByText('9,007,199,254,740,993.21', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '编辑单据', exact: true }).click();
  await page.getByRole('dialog').getByLabel('单号', { exact: true }).fill('UI-ROUNDTRIP-002');
  await page.getByRole('dialog').getByRole('button', { name: '保存记录', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'UI-ROUNDTRIP-002', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('9,007,199,254,740,993.21', { exact: true })).toBeVisible();
});

test('business account sees own records and cannot access manager', async ({ page }) => {
  await login(page, 'demo');
  await expect(page.getByRole('link', { name: 'PR-DEMO-003', exact: true })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: '对象管理器' })).toHaveCount(0);
  await page.goto('/setup/objects');
  await expect(page).toHaveURL(/\/objects\/purchase_request$/);
  const response = await page.request.get('/api/metadata/objects/purchase_request');
  expect(response.ok()).toBeTruthy();
});

test('small viewport and reduced motion retain navigation and record access', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login');
  await page.screenshot({ path: path.join(screenshots, 'login-mobile.png'), fullPage: true });
  await login(page, 'demo');
  await expect(page.getByRole('button', { name: '打开导航' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: path.join(screenshots, 'records-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'PR-DEMO-001', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PR-DEMO-001', exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, 'detail-mobile.png'), fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});
