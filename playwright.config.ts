import preset from '@aimuzov-projects/infra-site-kit/playwright'
import type { PlaywrightTestConfig } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 4399)

// e2e-пресет infra-site-kit: Chromium против продовой сборки. Сервер свой, через npm run build:
// пресет зовёт голый `astro build`, а поиску нужен ещё индекс Pagefind и свежие доки.
// Без defineConfig: он склеил бы оба webServer в список, и второй упёрся бы в занятый порт.
export default {
	...preset,
	webServer: {
		command: `npm run build && astro preview --port ${port} --ignore-lock`,
		url: `http://localhost:${port}`,
		reuseExistingServer: false,
		timeout: 180_000,
	},
} satisfies PlaywrightTestConfig
