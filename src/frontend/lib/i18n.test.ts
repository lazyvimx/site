import assert from 'node:assert/strict'
import { test } from 'node:test'

import { alternatePath, langOf, pagePath, slugOf } from './i18n.ts'

test('the language comes from the /ru/ prefix', () => {
	assert.equal(langOf('/'), 'en')
	assert.equal(langOf('/extras'), 'en')
	assert.equal(langOf('/ru/'), 'ru')
	assert.equal(langOf('/ru'), 'ru')
	assert.equal(langOf('/ru/faq'), 'ru')
	assert.equal(langOf('/runtime'), 'en')
})

test('home pages keep the trailing slash, docs do not', () => {
	assert.equal(pagePath('en'), '/')
	assert.equal(pagePath('ru'), '/ru/')
	assert.equal(pagePath('ru', 'extras'), '/ru/extras')
})

test('the slug survives .html and slashes', () => {
	assert.equal(slugOf('/'), undefined)
	assert.equal(slugOf('/ru/'), undefined)
	assert.equal(slugOf('/extras.html'), 'extras')
	assert.equal(slugOf('/ru/faq'), 'faq')
})

test('the alternate page keeps the slug', () => {
	assert.equal(alternatePath('/extras', 'ru'), '/ru/extras')
	assert.equal(alternatePath('/ru/extras', 'en'), '/extras')
	assert.equal(alternatePath('/ru/', 'en'), '/')
})
