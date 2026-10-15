import assert from 'node:assert/strict'
import { test } from 'node:test'

import { demoMarkup, extractTitle, github, tapeSize, toEntry, transform, withTitle } from './transform.ts'

const noDemo = () => ({ width: 1200, height: 604, before: false })
const en = (text: string) => transform(text, 'en', noDemo)
const ru = (text: string) => transform(text, 'ru', noDemo)

test('the language tip and flag tails are dropped', () => {
	const text =
		'> [!TIP]\n> **🇷🇺 Русская версия:** [EXTRAS.ru.md](EXTRAS.ru.md)\n\n- [Extras](docs/EXTRAS.md) ([🇷🇺](docs/EXTRAS.ru.md))\n'

	assert.equal(en(text), '- [Extras](/extras)\n')
})

test('the README banner and badges are dropped', () => {
	const text = '![lazyvimx](https://x/banner.jpeg)\n\n<div align="center">\n\n[![b](x)](y)\n\n</div>\n\nBody\n'

	assert.equal(en(text), 'Body\n')
})

test('the HTML header of the README is dropped up to the first markdown', () => {
	const text = [
		'<p align="center">\n\t<img src="lang.svg" alt="English">\n</p>',
		'<p align="center">\n\t<a href="/"><img src="banner.jpg" alt="b"></a>\n</p>',
		'<h3 align="center">Tagline</h3>\n<p align="center">Docs at <a href="/">site</a></p>',
		'**Body** with <p>inline html</p> later.\n',
	].join('\n\n')

	assert.equal(en(text), '**Body** with <p>inline html</p> later.\n')
})

test('links between the docs point at site pages of the same locale', () => {
	assert.equal(
		en('[a](./CONFIGURATION.md#setup) [b](../README.md)'),
		'[a](/configuration#setup) [b](/getting-started)',
	)

	assert.equal(ru('[a](docs/FAQ.ru.md) [b](../README.ru.md)'), '[a](/ru/faq) [b](/ru/getting-started)')
})

test('emoji headings get an explicit anchor and links to them lose the emoji', () => {
	assert.equal(en('## 📖 Overview'), '## 📖 Overview {#overview}')
	assert.equal(en('## 🧩 Core Modules'), '## 🧩 Core Modules {#core-modules}')
	assert.equal(en('[o](#📖-overview)'), '[o](#overview)')
	assert.equal(en('[o](./EXTRAS.md#🎨-ui)'), '[o](/extras#ui)')
	assert.equal(ru('[o](EXTRAS.ru.md#🎨-ui)'), '[o](/ru/extras#ui)')
})

test('repository-only paths go to GitHub', () => {
	assert.equal(en('[l](../lua/lazyvimx/init.lua)'), `[l](${github}/blob/main/lua/lazyvimx/init.lua)`)
	assert.equal(en('[e](examples/x)'), `[e](${github}/tree/main/examples/x)`)
	assert.equal(en('[c](CONTRIBUTING.md)'), `[c](${github}/blob/main/CONTRIBUTING.md)`)
	assert.equal(en('[c](../CHANGELOG.md)'), `[c](${github}/blob/main/CHANGELOG.md)`)
	assert.equal(en('[d](./)'), `[d](${github}/tree/main/docs)`)
})

test('an extra import links to its source on main', () => {
	assert.equal(
		en('**Import:** `lazyvimx.extras.ui.better-float`'),
		`**Import:** [\`lazyvimx.extras.ui.better-float\`](${github}/blob/main/lua/lazyvimx/extras/ui/better-float.lua)`,
	)
})

test('a demo GIF becomes a slot sized by its tape', () => {
	const gif = '![Demo](https://raw.githubusercontent.com/lazyvimx/nvim/assets/demo/ui-scrollbar.gif)'
	const out = transform(gif, 'en', (name) => ({ width: 1000, height: 500, before: name === 'ui-scrollbar' }))

	assert.equal(
		out,
		'<div class="demo-slot" data-demo="ui-scrollbar" data-alt="Demo" data-width="1000" data-height="500" data-before></div>',
	)
})

test('the demo alt text is escaped', () => {
	assert.match(demoMarkup('x', 'a "b" <c>', noDemo()), /data-alt="a &quot;b&quot; &lt;c&gt;"/)
})

test('the tape size falls back to the default recording size', () => {
	assert.deepEqual(tapeSize('Set Width 1400\nSet Height 700\n'), { width: 1400, height: 700 })
	assert.deepEqual(tapeSize(undefined), { width: 1200, height: 604 })
})

test('the README gets a title, other docs keep their own', () => {
	assert.equal(withTitle('Body'), '# lazyvimx\n\nBody')
	assert.equal(extractTitle('# Extras Reference\n\nBody'), 'Extras Reference')
})

test('the entry frontmatter survives quotes and colons in the title', () => {
	const entry = toEntry('# FAQ: "why"\n', 'docs/FAQ.md')

	assert.equal(entry, '---\ntitle: "FAQ: \\"why\\""\nsource: "docs/FAQ.md"\n---\n\n# FAQ: "why"\n')
})
