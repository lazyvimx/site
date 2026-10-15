// Тянет документацию из репозитория lazyvimx/nvim и раскладывает её
// по коллекции Astro. Сами правки текста -- в src/sync/transform.ts.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { github, pages, tapeSize, toEntry, transform } from '#sync/transform.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'src/frontend/content/docs')

// Локальная рабочая копия удобнее для разработки, в CI и в Docker её нет -- клонируем.
function findSource() {
	const local = process.env.LAZYVIMX_DIR || resolve(root, '../nvim')

	if (existsSync(join(local, 'docs/EXTRAS.md'))) return local

	const cache = join(root, '.cache/lazyvimx')

	rmSync(cache, { recursive: true, force: true })
	mkdirSync(dirname(cache), { recursive: true })
	execFileSync('git', ['clone', '--depth', '1', '--branch', 'main', `${github}.git`, cache], { stdio: 'inherit' })

	return cache
}

const src = findSource()
const read = (path: string) => (existsSync(join(src, path)) ? readFileSync(join(src, path), 'utf8') : undefined)

// Экстры, у которых записан "до"-вариант. По папке tapes-before его не узнать:
// она в .gitignore и генерируется почти для всех тейпов, а записаны не все.
// Список повторяет записи в ветке assets lazyvimx/nvim, при дозаписи пополнять оба места.
const withBefore = new Set([
	'buf-tab-scope',
	'coding-comments',
	'git-conflicts',
	'motions-better-cursor-move',
	'motions-better-move-between-words',
	'motions-langmapper',
	'motions-sibling-move',
	'motions-sibling-swap',
	'motions-splitting-joining-blocks',
	'ui-better-colorcolumn',
	'ui-better-cursorline',
	'ui-better-diagnostic',
	'ui-better-float',
	'ui-better-insert-mode',
	'ui-better-linenumbers',
	'ui-better-live-rename',
	'ui-better-reference-highlight',
	'ui-better-whitespace',
	'ui-bolder-separators',
	'ui-diff-view',
	'ui-highlighted-ansi-escape',
	'ui-highlighted-colors',
	'ui-peek-preview',
	'ui-scrollbar',
	'ui-simple-mode',
	'ui-symbol-usage',
	'ui-winbar',
])

function demo(name: string) {
	return { ...tapeSize(read(`docs/demo/tapes/${name}.tape`)), before: withBefore.has(name) }
}

rmSync(out, { recursive: true, force: true })

for (const lang of ['en', 'ru'] as const) {
	mkdirSync(join(out, lang), { recursive: true })

	for (const { source, slug } of pages) {
		const file = `${source}${lang === 'ru' ? '.ru' : ''}.md`
		const text = read(file)

		if (text === undefined) throw new Error(`${file} is missing in ${src}`)

		writeFileSync(join(out, lang, `${slug}.md`), toEntry(transform(text, lang, demo), file))
	}
}

console.log(`synced ${pages.length * 2} pages from ${src}`)

// Версию сайт показывает в статуслайне. Теги в неглубокий клон не попадают,
// а package.json release-it бампит вместе с тегом.
const { version } = JSON.parse(read('package.json') ?? '{}') as { version?: string }

mkdirSync(join(root, 'src/frontend/data'), { recursive: true })
writeFileSync(join(root, 'src/frontend/data/version.json'), `${JSON.stringify({ version })}\n`)
console.log(`version: ${version}`)
