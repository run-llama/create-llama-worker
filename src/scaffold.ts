import { resolve } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import {
	renderClassify,
	renderEnv,
	renderEslintCfg,
	renderExtract,
	renderIgnore,
	renderPackage,
	renderParse,
	renderPrettier,
	renderWrangler,
	type ClassifyRule,
} from './render.js';

export type ScaffoldOptions = {
	outDir: string;
	projectName: string;
	apiKey?: string;
	baseUrl?: string;
} & (
	| { service: 'parse'; tier: string; version: string }
	| { service: 'extract'; dataSchema: string; tier?: string; version?: string; systemPrompt?: string }
	| { service: 'classify'; rules: ClassifyRule[] }
);

/**
 * Renders the requested service into `src/index.ts` plus a `.env` file
 * inside `outDir`. This project only ever scaffolds one LlamaParse
 * service (parse | extract | classify) per Cloudflare Worker.
 */
export async function scaffold(options: ScaffoldOptions): Promise<{
	indexPath: string;
	envPath: string;
	wranglerPath: string;
	packagePath: string;
	gitignorePath: string;
	prettiercPath: string;
	eslintConfigPath: string;
}> {
	let indexContent: string;
	switch (options.service) {
		case 'parse':
			indexContent = await renderParse(options.tier, options.version);
			break;
		case 'extract':
			indexContent = await renderExtract(options.dataSchema, options.tier, options.version, options.systemPrompt);
			break;
		case 'classify':
			indexContent = await renderClassify(options.rules);
			break;
	}

	const srcDir = resolve(options.outDir, 'src');
	await mkdir(srcDir, { recursive: true });

	const indexPath = resolve(srcDir, 'index.ts');
	const envPath = resolve(options.outDir, '.env');
	const wranglerPath = resolve(options.outDir, 'wrangler.jsonc');
	const packagePath = resolve(options.outDir, 'package.json');
	const gitignorePath = resolve(options.outDir, '.gitignore');
	const prettiercPath = resolve(options.outDir, '.prettierrc');
	const eslintConfigPath = resolve(options.outDir, 'eslint.config.mts');

	await writeFile(indexPath, indexContent);
	await writeFile(envPath, await renderEnv(options.apiKey, options.baseUrl));
	await writeFile(wranglerPath, await renderWrangler(options.projectName));
	await writeFile(packagePath, await renderPackage(options.projectName));
	await writeFile(gitignorePath, await renderIgnore());
	await writeFile(prettiercPath, await renderPrettier());
	await writeFile(eslintConfigPath, await renderEslintCfg());

	return { indexPath, envPath, wranglerPath, packagePath, gitignorePath, prettiercPath, eslintConfigPath };
}
