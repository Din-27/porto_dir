module.exports = {
	env: {
		es2021: true,
		node: true
	},
	extends: 'standard-with-typescript',
	overrides: [
		{
			env: {
				node: true
			},
			files: [
				'.eslintrc.{js,cjs}'
			],
			parserOptions: {
				sourceType: 'script'
			}
		}
	],
	ignorePatterns: ['**/tests/**', 'node_modules/', '.eslintrc.cjs', 'database/'],
	parserOptions: {
		ecmaVersion: 'latest'
	},
	rules: {
		'@typescript-eslint/indent': ['error', 'tab'],
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/space-before-function-paren': 'off',
		'@typescript-eslint/prefer-nullish-coalescing': 'off',
		'@typescript-eslint/semi': ['error', 'always', { 'omitLastInOneLineClassBody': true}],
		'@typescript-eslint/no-floating-promises': 'off',
		'@typescript-eslint/consistent-type-imports': 'off',
		'@typescript-eslint/strict-boolean-expressions': 'off',
		'@typescript-eslint/no-misused-promises': 'off',
		'@typescript-eslint/quotes': ['error', 'single'],
		'no-tabs': ['off'],
		'quote-props': 'off'
	}
}
