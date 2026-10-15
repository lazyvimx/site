import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markdownToHtml, type HastPluginInput } from 'satteri'

import { docPlugin, slugify } from './doc-plugin.ts'

// Синхронные плагины Sätteri дают синхронный результат, но тип допускает и промис.
const render = async (md: string, plugins: HastPluginInput[] = [docPlugin]) =>
	(await markdownToHtml(md, { hastPlugins: plugins })).html.trim()

test('slugs follow VitePress, not GitHub', () => {
	assert.equal(slugify('ui.better-colorcolumn'), 'ui-better-colorcolumn')
	assert.equal(slugify('Why not `vim.opt`?'), 'why-not-vim-opt')
	assert.equal(slugify('1. Install'), '_1-install')
	assert.equal(slugify('Быстрый старт'), 'быстрыи-старт')
})

test('a heading gets its id and an empty permalink', async () => {
	assert.equal(
		await render('### ui.better-float'),
		'<h3 id="ui-better-float">ui.better-float<a class="header-anchor" href="#ui-better-float" aria-label="Permalink to “ui.better-float”"></a></h3>',
	)
})

test('an explicit anchor wins and leaves the heading text', async () => {
	assert.match(await render('## 📖 Overview {#overview}'), /^<h2 id="overview">📖 Overview<a /)
})

test('repeated headings are numbered', async () => {
	const html = await render('## Setup\n\n## Setup\n')

	assert.match(html, /id="setup"/)
	assert.match(html, /id="setup-1"/)
})

test('a highlighted block gets a frame with its language and a copy button', async () => {
	// В Astro язык на <pre> ставит Shiki, здесь его заменяет плагин-заглушка.
	const lang: HastPluginInput = {
		name: 'lang',
		element: { filter: ['pre'], visit: (node, ctx) => ctx.setProperty(node, 'dataLanguage', 'lua') },
	}
	const html = await render('```lua\nx = 1\n```', [lang, docPlugin])

	assert.match(html, /^<div class="code-block"><pre data-language="lua">.*<\/pre><button class="code-block__copy"/s)
	assert.match(html, /<span class="code-block__lang" aria-hidden="true">lua<\/span><\/div>$/)
})

test('external links open in a new tab, site links stay', async () => {
	assert.equal(
		await render('[gh](https://github.com) [x](/extras)'),
		'<p><a href="https://github.com" target="_blank" rel="noreferrer">gh</a> <a href="/extras">x</a></p>',
	)
})
