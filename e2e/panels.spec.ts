import { expectAccessible, expectPanelToggle } from '@aimuzov/infra-site-kit/playwright/checks'
import { expect, test, type Page } from '@playwright/test'

const sidebar = (page: Page) => page.locator('button[data-panel="sidebar"]')
const toc = (page: Page) => page.locator('button[data-panel="toc"]')
const left = (page: Page) => page.locator('.doc-page__main').evaluate((node) => node.getBoundingClientRect().left)

test.beforeEach(async ({ page }) => {
	await page.route(/jsdelivr\.net/, (route) => route.fulfill({ status: 204 }))
})

test('the sidebar hides and stays hidden after a reload', ({ page }) =>
	expectPanelToggle(page, sidebar(page), { path: '/faq' }))

test('the outline hides and stays hidden after a reload', ({ page }) =>
	expectPanelToggle(page, toc(page), { path: '/faq' }))

test('hidden panels leave a rail with the show button and move the text', async ({ page }) => {
	await page.goto('/ru/faq')

	const before = await left(page)

	await sidebar(page).click()
	await toc(page).click()

	await expect(page.locator('#sidebar-tree')).toBeHidden()
	await expect(page.locator('#toc')).toBeHidden()
	await expect(sidebar(page)).toHaveAccessibleName('Показать навигацию')
	await expect(toc(page)).toHaveAccessibleName('Показать оглавление')
	await expect.poll(() => left(page)).toBeLessThan(before)
	await expectAccessible(page)
})

test('narrow screens have no panel buttons', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 900 })
	await page.goto('/faq')

	await expect(sidebar(page)).toBeHidden()
	await expect(toc(page)).toBeHidden()
})
