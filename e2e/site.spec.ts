import { expectAccessible, expectNotFound, pageScheme, siteChecks } from '@aimuzov/infra-site-kit/playwright/checks'
import { expect, test, type Page } from '@playwright/test'

// Проверки, общие для всех сайтов: страницы из sitemap, axe в обеих темах,
// переключатель темы с подглядыванием, ленивая Метрика и общая 404.
siteChecks({
	metrika: true,
	notFound: { exclude: ['/ru/'] },
	theme: { button: (page) => page.locator('body > .nav-bar .theme-toggle'), path: '/extras' },
})

// Записи демо грузятся с CDN, а тестам нужна только разметка вокруг них.
test.beforeEach(async ({ page }) => {
	await page.route(/jsdelivr\.net/, (route) => route.fulfill({ status: 204 }))
})

test('the Russian page links to its English twin and back', async ({ page }) => {
	await page.goto('/ru/extras')

	await expect(page.locator('html')).toHaveAttribute('lang', 'ru')

	await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
		'href',
		'https://lazyvimx.aimuzov.online/extras',
	)

	const menu = page.locator('.nav-bar details.lang')

	await expect(menu.locator('summary')).toHaveText(/RU/)
	await menu.locator('summary').click()
	await expect(menu.getByRole('link', { name: /English/ })).toHaveAttribute('href', '/extras')
	await menu.getByRole('link', { name: /English/ }).click()
	await expect(page).toHaveURL(/\/extras$/)
	await expect(page.locator('html')).toHaveAttribute('lang', 'en')
	expect((await page.context().cookies()).find((c) => c.name === 'lang')?.value).toBe('en')
})

test('old VitePress anchors still lead to their sections', async ({ page }) => {
	await page.goto('/extras#ui-better-colorcolumn')

	await expect(page.locator('h3#ui-better-colorcolumn')).toBeInViewport()
})

test('a demo slot turns into a video', async ({ page }) => {
	await page.goto('/extras')

	const slot = page.locator('.demo-slot').first()

	await slot.scrollIntoViewIfNeeded()
	await expect(slot.locator('video')).toHaveCount(1)
})

test('an extra with a recorded "before" gets the Before / After tabs', async ({ page }) => {
	await page.goto('/extras')

	await expect(page.locator('.demo-slot[data-demo="ui-better-colorcolumn"] .demo-player__tab')).toHaveCount(2)
	await expect(page.locator('.demo-slot[data-before]')).toHaveCount(27)
})

test('the statusline shows the lazyvimx version and the current file', async ({ page }) => {
	await page.goto('/faq')

	await expect(page.locator('.statusline__section--version')).toHaveText(/v\d+\.\d+\.\d+/)
	await expect(page.locator('.statusline__file')).toHaveText('~/lazyvimx/faq.md')
})

test.describe('vim keys', () => {
	test('j scrolls and G jumps to the bottom', async ({ page }) => {
		await page.goto('/extras')
		await page.keyboard.press('j')
		await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)

		await page.keyboard.press('Shift+G')
		await expect(page.locator('.statusline__section--percent')).toHaveText('Bot')
	})

	test('L opens the next page', async ({ page }) => {
		await page.goto('/getting-started')
		await page.keyboard.press('Shift+L')
		await expect(page).toHaveURL(/\/extras$/)
	})

	test(':set bg=dark switches the theme', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' })
		await page.goto('/faq')
		await page.keyboard.press('Shift+Semicolon')
		await page.keyboard.type('set bg=dark')
		await page.keyboard.press('Enter')

		expect(await pageScheme(page)).toBe('dark')
	})

	test('the Russian layout keys work too', async ({ page }) => {
		await page.goto('/ru/faq')
		// В ЙЦУКЕН на месте j лежит "о". Раскладку Playwright не эмулирует,
		// поэтому нажатие собираем сами: символ раскладки и код клавиши.
		await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { key: 'о', code: 'KeyJ' })))
		await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
	})
})

test.describe('search', () => {
	for (const [path, query, title] of [
		['/extras', 'scrollbar', /ui\.scrollbar/],
		['/ru/extras', 'scrollbar', /экстр.*ui\.scrollbar/i],
	] as const) {
		test(`finds pages from ${path}`, async ({ page }) => {
			await page.goto(path)
			await page.keyboard.press('/')

			const input = page.locator('.search__input')

			await expect(input).toBeFocused()
			await input.fill(query)
			await expect(page.locator('.search__hit').first()).toContainText(title)
		})
	}

	test('Ctrl-j/k move through the results, and Esc gives the keys back', async ({ page }) => {
		await page.goto('/extras')
		await page.keyboard.press('/')

		const input = page.locator('.search__input')
		const hits = page.locator('.search__hit')

		await input.fill('scrollbar')
		await expect(hits.nth(1)).toBeVisible()
		await page.keyboard.press('Control+j')
		await expect(hits.nth(1)).toHaveClass(/search__hit--active/)
		// Ctrl-k в ЙЦУКЕН приходит как "л", код клавиши тот же.
		await input.dispatchEvent('keydown', { key: 'л', code: 'KeyK', ctrlKey: true })
		await expect(hits.first()).toHaveClass(/search__hit--active/)

		// Закрытый поиск отдаёт клавиши обратно: j сразу после Esc листает страницу.
		await page.keyboard.press('Escape')
		await page.keyboard.press('j')
		await expect(input).toBeHidden()
		await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
	})
})

test.describe('the Russian 404', () => {
	// astro preview отдаёт на любой неизвестный адрес корневую 404.html, а nginx под /ru/ --
	// русскую. Здесь то же правило из deploy/nginx.conf: 404 документа под /ru/ получает ru/404.html.
	const russian404 = (page: Page) =>
		page.route(/\/ru\//, async (route) => {
			const response = await route.fetch()

			if (route.request().resourceType() !== 'document' || response.status() !== 404) {
				return route.fulfill({ response })
			}

			const ru = await route.fetch({ url: new URL('/ru/404.html', route.request().url()).href })

			return route.fulfill({ status: 404, contentType: 'text/html', body: await ru.text() })
		})

	test.beforeEach(({ page }) => russian404(page))

	test('answers 404 in Russian with a way to the Russian home', async ({ page }) => {
		await expectNotFound(page, { path: '/ru/kit-404-probe', home: '/ru/' })
		await page.goto('/ru/kit-404-probe')
		await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
		await expect(page.locator('h1')).toHaveText('Страница не найдена')
	})

	test('suggests only Russian pages', async ({ page }) => {
		await page.goto('/ru/extra')

		const links = page.locator('[data-not-found-suggest] a')

		await expect(links.first()).toHaveAttribute('href', '/ru/extras')

		for (const href of await links.evaluateAll((all) => all.map((a) => a.getAttribute('href')))) {
			expect(href).toMatch(/^\/ru\//)
		}
	})

	for (const colorScheme of ['light', 'dark'] as const) {
		test(`passes axe in the ${colorScheme} scheme`, async ({ page }) => {
			await page.emulateMedia({ colorScheme })
			await page.goto('/ru/kit-404-probe')
			await expectAccessible(page)
		})
	}
})

test('the English 404 suggests no Russian pages', async ({ page }) => {
	await page.goto('/extra')

	const links = page.locator('[data-not-found-suggest] a')

	await expect(links.first()).toHaveAttribute('href', '/extras')

	for (const href of await links.evaluateAll((all) => all.map((a) => a.getAttribute('href')))) {
		expect(href).not.toMatch(/^\/ru\//)
	}
})
