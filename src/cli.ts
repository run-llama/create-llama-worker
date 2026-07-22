import { Command } from 'commander';
import { resolve } from 'path';
import { EXTRACT_TIERS, PARSE_TIERS, isValidJsonSchema, isValidVersion, type ClassifyRule } from './render.js';
import { scaffold } from './scaffold.js';

function fail(message: string): never {
	console.error(`Error: ${message}`);
	process.exit(1);
}

function checkVersion(version: string) {
	if (!isValidVersion(version)) {
		fail(`Invalid --version "${version}". Expected "latest" or a date in YYYY-MM-DD format.`);
	}
}

function parseClassifyRule(raw: string): ClassifyRule {
	const idx = raw.indexOf(':');
	if (idx === -1) {
		fail(`Invalid --rule "${raw}". Expected format "<type>:<description>".`);
	}
	const type = raw.slice(0, idx).trim();
	const description = raw.slice(idx + 1).trim();
	if (!type || !description) {
		fail(`Invalid --rule "${raw}". Both <type> and <description> are required.`);
	}
	return { type, description };
}

export function buildCli(): Command {
	const program = new Command();

	program
		.name('create-llama-worker')
		.description(
			'Scaffold a Cloudflare Worker that exposes a single LlamaCloud service (parse, extract, or classify).\n' +
				'Run without arguments to use the interactive prompts instead.',
		)
		.version('0.1.0');

	const commonOptions = (cmd: Command) =>
		cmd
			.option('-o, --out-dir <dir>', 'Directory to scaffold the worker into', '.')
			.option('--api-key <key>', 'LLAMA_CLOUD_API_KEY to write into .env (defaults to $LLAMA_CLOUD_API_KEY)')
			.option('--base-url <url>', 'LLAMA_CLOUD_BASE_URL to write into .env (defaults to $LLAMA_CLOUD_BASE_URL)')
			.option('--project-name <name>', 'Name of the project');

	commonOptions(
		program
			.command('parse')
			.description('Scaffold a worker that runs LlamaParse')
			.requiredOption('-t, --tier <tier>', `Parsing tier (${PARSE_TIERS.join(' | ')})`)
			.requiredOption('-v, --version <version>', 'Tier version ("latest" or YYYY-MM-DD)'),
	).action(async (opts) => {
		if (!PARSE_TIERS.includes(opts.tier)) {
			fail(`Invalid --tier "${opts.tier}". Expected one of: ${PARSE_TIERS.join(', ')}`);
		}
		checkVersion(opts.version);
		const { indexPath, envPath, wranglerPath, packagePath, eslintConfigPath, prettiercPath, gitignorePath } = await scaffold({
			service: 'parse',
			tier: opts.tier,
			version: opts.version,
			outDir: resolve(opts.outDir),
			apiKey: opts.apiKey,
			baseUrl: opts.baseUrl,
			projectName: opts.projectName,
		});
		console.log(`Worker written to ${indexPath}`);
		console.log(`Environment file written to ${envPath}`);
		console.log(`Wrangler configuration written to ${wranglerPath}`);
		console.log(`package.json written to ${packagePath}`);
		console.log(`prettier config written to ${prettiercPath}`);
		console.log(`eslint config written to ${eslintConfigPath}`);
		console.log(`gitignore written to ${gitignorePath}`);
		console.log(`\nRun \`npm install\`, then \`npm run cf-typegen\`.`);
	});

	commonOptions(
		program
			.command('extract')
			.description('Scaffold a worker that runs LlamaExtract')
			.requiredOption('-s, --schema <json>', 'JSON schema describing the data to extract (as a JSON string)')
			.option('-t, --tier <tier>', `Extraction tier (${EXTRACT_TIERS.join(' | ')})`)
			.option('-v, --version <version>', 'Tier version ("latest" or YYYY-MM-DD)')
			.option('-p, --system-prompt <prompt>', 'Optional system prompt to guide extraction'),
	).action(async (opts) => {
		if (!isValidJsonSchema(opts.schema)) {
			fail('The provided --schema is not a valid JSON schema.');
		}
		if (opts.tier && !EXTRACT_TIERS.includes(opts.tier)) {
			fail(`Invalid --tier "${opts.tier}". Expected one of: ${EXTRACT_TIERS.join(', ')}`);
		}
		if (opts.version) checkVersion(opts.version);
		const { indexPath, envPath, wranglerPath, packagePath, prettiercPath, eslintConfigPath, gitignorePath } = await scaffold({
			service: 'extract',
			dataSchema: opts.schema,
			tier: opts.tier,
			version: opts.version,
			systemPrompt: opts.systemPrompt,
			outDir: resolve(opts.outDir),
			apiKey: opts.apiKey,
			baseUrl: opts.baseUrl,
			projectName: opts.projectName,
		});
		console.log(`Worker written to ${indexPath}`);
		console.log(`Environment file written to ${envPath}`);
		console.log(`Wrangler configuration written to ${wranglerPath}`);
		console.log(`package.json written to ${packagePath}`);
		console.log(`prettier config written to ${prettiercPath}`);
		console.log(`eslint config written to ${eslintConfigPath}`);
		console.log(`gitignore written to ${gitignorePath}`);
		console.log(`\nRun \`npm install\`, then \`npm run cf-typegen\`.`);
	});

	commonOptions(
		program
			.command('classify')
			.description('Scaffold a worker that runs LlamaClassify')
			.requiredOption(
				'-r, --rule <type:description>',
				"A classification rule as '<type>:<description>'. Repeat for multiple rules.",
				(value: string, previous: ClassifyRule[]) => [...(previous ?? []), parseClassifyRule(value)],
				[] as ClassifyRule[],
			),
	).action(async (opts) => {
		const rules = opts.rule as ClassifyRule[];
		if (rules.length === 0) {
			fail('At least one --rule is required.');
		}
		const { indexPath, envPath, wranglerPath, packagePath, eslintConfigPath, prettiercPath, gitignorePath } = await scaffold({
			service: 'classify',
			rules,
			outDir: resolve(opts.outDir),
			apiKey: opts.apiKey,
			baseUrl: opts.baseUrl,
			projectName: opts.projectName,
		});
		console.log(`Worker written to ${indexPath}`);
		console.log(`Environment file written to ${envPath}`);
		console.log(`Wrangler configuration written to ${wranglerPath}`);
		console.log(`package.json written to ${packagePath}`);
		console.log(`prettier config written to ${prettiercPath}`);
		console.log(`eslint config written to ${eslintConfigPath}`);
		console.log(`gitignore written to ${gitignorePath}`);
		console.log(`\nRun \`npm install\`, then \`npm run cf-typegen\`.`);
	});

	return program;
}
