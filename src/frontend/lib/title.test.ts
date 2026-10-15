import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pageTitle } from './title.ts'

test('the home page gets only the site name', () => {
	assert.equal(pageTitle(), 'lazyvimx')
	assert.equal(pageTitle('lazyvimx'), 'lazyvimx')
})

test('other pages get their own name and the site name after a bar', () => {
	assert.equal(pageTitle('Extras Reference'), 'Extras Reference | lazyvimx')
})
