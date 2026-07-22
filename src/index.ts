#!/usr/bin/env node

import { buildCli } from './cli.js';
import { runTui } from './tui.js';

async function main() {
	if (process.argv.length <= 2) {
		await runTui();
		return;
	}
	await buildCli().parseAsync(process.argv);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
