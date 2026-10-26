import kit from '@aimuzov/infra-site-kit/stylelint'

export default {
	...kit,
	overrides: [
		...kit.overrides,
		// Текст документации приходит из markdown без классов, его стили -- по тегам.
		{ files: ['src/frontend/styles/prose.css'], rules: { 'selector-max-type': null } },
	],
}
