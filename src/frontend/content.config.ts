import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Страницы документации раскладывает scripts/sync-docs.ts из репозитория nvim:
// `en/extras.md`, `ru/extras.md` и так далее. Править тексты нужно там.
const docs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/frontend/content/docs' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		/** Файл в репозитории nvim, из которого собрана страница. */
		source: z.string(),
	}),
})

export const collections = { docs }
