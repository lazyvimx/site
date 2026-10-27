import { expect, test } from '@playwright/test'

// Записи демо грузятся с CDN, а тестам нужна только разметка вокруг них.
test.beforeEach(async ({ page }) => {
	await page.route(/jsdelivr\.net/, (route) => route.fulfill({ status: 204 }))
})

test('the outline lights up the section the header has covered', async ({ page }) => {
	await page.goto('/faq')

	const active = page.locator('#toc .toc__link--active')
	const heading = page.locator('.doc h2[id]').nth(2)
	const id = await heading.getAttribute('id')

	await expect(active).toHaveCount(0)

	// scrollIntoView ставит заголовок под шапку, на scroll-padding-top.
	await heading.evaluate((node) => node.scrollIntoView())
	await expect(active).toHaveAttribute('href', `#${id}`)
	await expect(page.locator('#toc .toc__marker')).toHaveAttribute('style', /opacity: 1/)

	// Двумя пикселями выше заголовок ещё не дошёл до шапки.
	await page.evaluate(() => scrollBy(0, -2))
	await expect(active).toHaveCount(1)
	await expect(active).not.toHaveAttribute('href', `#${id}`)
})
