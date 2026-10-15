// Темы подсветки catppuccin рассчитаны на свой фон. На белом фоне блоков кода
// часть цветов latte проваливает WCAG AA, и мы доводим их до порога,
// сохраняя оттенок: подмешиваем чёрный, пока контраст не станет достаточным.

/** Порог WCAG AA для обычного текста, с запасом на округление. */
const AA = 4.6

type Rgb = [number, number, number]

function parse(hex: string): Rgb | undefined {
	const match = hex.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i)

	if (!match) return

	const value = Number.parseInt(match[1], 16)

	return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const toHex = (rgb: Rgb) => `#${rgb.map((part) => Math.round(part).toString(16).padStart(2, '0')).join('')}`

function luminance([r, g, b]: Rgb) {
	const channel = (value: number) => {
		const c = value / 255

		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
	}

	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(a: string, b: string) {
	const [x, y] = [parse(a), parse(b)].map((rgb) => (rgb ? luminance(rgb) : 0))

	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Затемняет цвет, пока он не читается на светлом фоне. Прозрачность и формат не трогает. */
export function readableOn(color: string, background: string) {
	const rgb = parse(color)

	if (!rgb || contrast(color, background) >= AA) return color

	const alpha = color.length === 9 ? color.slice(7) : ''

	for (let darker = rgb; ;) {
		darker = darker.map((part) => part * 0.97) as Rgb

		const hex = toHex(darker)

		if (contrast(hex, background) >= AA) return hex + alpha
	}
}

type Theme = { tokenColors?: { settings: { foreground?: string } }[] }

/** Копия темы Shiki, где цвет каждого токена читается на `background`. */
export function withReadableTokens<T extends Theme>(theme: T, background: string): T {
	return {
		...theme,
		tokenColors: theme.tokenColors?.map((rule) => ({
			...rule,
			settings: {
				...rule.settings,
				...(rule.settings.foreground && { foreground: readableOn(rule.settings.foreground, background) }),
			},
		})),
	}
}
