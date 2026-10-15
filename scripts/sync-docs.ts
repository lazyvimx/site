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
	// Актуальные доки живут в develop: main отстаёт до ближайшего релиза.
	execFileSync('git', ['clone', '--depth', '1', '--branch', 'develop', `${github}.git`, cache], { stdio: 'inherit' })

	return cache
}

const src = findSource()
const read = (path: string) => (existsSync(join(src, path)) ? readFileSync(join(src, path), 'utf8') : undefined)

// Вариант "до" есть у тех экстр, для которых записан свой тейп в tapes-before.
function demo(name: string) {
	return {
		...tapeSize(read(`docs/demo/tapes/${name}.tape`)),
		before: existsSync(join(src, `docs/demo/tapes-before/${name}-before.tape`)),
	}
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
