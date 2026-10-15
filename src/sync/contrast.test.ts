import assert from 'node:assert/strict'
import { test } from 'node:test'

import { contrast, readableOn, withReadableTokens } from './contrast.ts'

test('contrast follows WCAG', () => {
	assert.equal(Math.round(contrast('#000000', '#ffffff')), 21)
	assert.equal(contrast('#777777', '#777777'), 1)
})

test('a dark enough color stays as it is', () => {
	assert.equal(readableOn('#4c4f69', '#ffffff'), '#4c4f69')
})

test('a pale color darkens up to AA and keeps its alpha', () => {
	const fixed = readableOn('#04a5e5', '#ffffff')

	assert.ok(contrast(fixed, '#ffffff') >= 4.5)
	assert.equal(readableOn('#04a5e580', '#ffffff').slice(7), '80')
})

test('the theme copy fixes token colors only', () => {
	const theme = { name: 'latte', tokenColors: [{ settings: { foreground: '#04a5e5' } }, { settings: {} }] }
	const fixed = withReadableTokens(theme, '#ffffff')

	assert.equal(fixed.name, 'latte')
	assert.notEqual(fixed.tokenColors[0].settings.foreground, '#04a5e5')
	assert.deepEqual(fixed.tokenColors[1].settings, {})
})
