{
	"name": "{{ package_name }}",
	"version": "0.1.0",
	"private": true,
	"scripts": {
		"deploy": "wrangler deploy",
		"dev": "wrangler dev",
		"start": "wrangler dev",
		"test": "vitest run",
		"cf-typegen": "wrangler types",
		"lint": "eslint src/ test/",
		"prettier": "prettier .",
		"prettier:fix": "prettier --write ."
	},
	"devDependencies": {
		"@cloudflare/vitest-pool-workers": "^0.12.4",
		"@eslint/js": "^10.0.1",
		"@types/node": "^26.1.1",
		"eslint": "^10.7.0",
		"globals": "^17.7.0",
		"jiti": "^2.7.0",
		"prettier": "^3.9.6",
		"typescript": "^5.5.2",
		"typescript-eslint": "^8.65.0",
		"vitest": "~3.2.0",
		"wrangler": "^4.112.0"
	},
	"dependencies": {
		"@llamaindex/llama-cloud": "latest"
	}
}
