import assert from 'node:assert/strict'
import { test } from 'node:test'

import { keyCandidates, qwertyChar } from './vim-keys.ts'

const press = (key: string, code: string, shiftKey = false) => keyCandidates({ key, code, shiftKey })

test('letters and digits come from the key position', () => {
	assert.equal(qwertyChar('KeyJ', false), 'j')
	assert.equal(qwertyChar('KeyG', true), 'G')
	assert.equal(qwertyChar('Digit3', false), '3')
	assert.equal(qwertyChar('Digit3', true), null)
	assert.equal(qwertyChar('Slash', true), '?')
	assert.equal(qwertyChar('Escape', false), null)
})

test('the Russian layout offers both the typed char and the QWERTY one', () => {
	assert.deepEqual(press('о', 'KeyJ'), ['о', 'j'])
	assert.deepEqual(press('.', 'Slash'), ['.', '/'])
	assert.deepEqual(press('Ж', 'Semicolon', true), ['Ж', ':'])
})

test('the QWERTY layout gives a single candidate', () => {
	assert.deepEqual(press('j', 'KeyJ'), ['j'])
	assert.deepEqual(press('}', 'BracketRight', true), ['}'])
})

test('named keys give no chars', () => {
	assert.deepEqual(press('Escape', 'Escape'), [])
})
