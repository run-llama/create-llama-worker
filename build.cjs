/* eslint-disable */

// build.cjs
const esbuild = require('esbuild');

esbuild
	.build({
		entryPoints: ['src/index.ts'],
		bundle: true,
		outfile: 'dist/index.js',
		platform: 'node',
		target: 'node24',
		format: 'esm',
		sourcemap: true,
		external: ['@clack/prompts', 'nunjucks'],
	})
	.catch(() => process.exit(1));
