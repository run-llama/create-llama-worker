import * as p from '@clack/prompts';
import { resolve } from 'path';
import { EXTRACT_TIERS, PARSE_TIERS, isValidJsonSchema, isValidVersion, type ClassifyRule } from './render.js';
import { scaffold } from './scaffold.js';

function onCancel(): never {
	p.cancel('Operation cancelled.');
	process.exit(1);
}

function bail<T>(value: T | symbol): T {
	if (p.isCancel(value)) onCancel();
	return value as T;
}

async function promptVersion(): Promise<string> {
	const version = bail(
		await p.text({
			message: 'Tier version ("latest" or a YYYY-MM-DD release date)',
			placeholder: 'latest',
			defaultValue: 'latest',
			validate: (value) => {
				if (!value) return undefined;
				if (!isValidVersion(value)) return 'Must be "latest" or a date in YYYY-MM-DD format';
				return undefined;
			},
		}),
	);
	return version || 'latest';
}

async function promptOutDir(defaultDir: string): Promise<string> {
	const outDir = bail(
		await p.text({
			message: 'Where should the worker be scaffolded?',
			placeholder: defaultDir,
			defaultValue: defaultDir,
		}),
	);
	return resolve(outDir || '.');
}

async function promptProjectName(): Promise<string> {
	const projectName = bail(
		await p.text({
			message: 'What is the name of this project?',
			placeholder: 'llama-worker',
			defaultValue: 'llama-worker',
		}),
	);
	return projectName;
}

async function promptEnv(): Promise<{ apiKey?: string; baseUrl?: string }> {
	const configureEnv = bail(
		await p.confirm({
			message: 'Configure LLAMA_CLOUD_API_KEY / LLAMA_CLOUD_BASE_URL now?',
			initialValue: Boolean(process.env.LLAMA_CLOUD_API_KEY),
		}),
	);
	if (!configureEnv) return {};

	const apiKey = bail(
		await p.text({
			message: 'LLAMA_CLOUD_API_KEY',
			placeholder: 'llx-...',
			defaultValue: process.env.LLAMA_CLOUD_API_KEY,
		}),
	);
	const baseUrl = bail(
		await p.text({
			message: 'LLAMA_CLOUD_BASE_URL',
			placeholder: 'https://api.cloud.llamaidex.ai',
			defaultValue: process.env.LLAMA_CLOUD_BASE_URL,
		}),
	);
	return { apiKey: apiKey || undefined, baseUrl: baseUrl || undefined };
}

async function runParseFlow() {
	const projectName = await promptProjectName();
	const tier = bail(
		await p.select({
			message: 'Which parsing tier?',
			options: PARSE_TIERS.map((tier) => ({ value: tier, label: tier })),
		}),
	);
	const version = await promptVersion();
	const outDir = await promptOutDir(projectName);
	const env = await promptEnv();

	const s = p.spinner();
	s.start('Scaffolding worker');
	const { indexPath, envPath, wranglerPath, packagePath, gitignorePath, eslintConfigPath, prettiercPath } = await scaffold({
		service: 'parse',
		tier,
		version,
		outDir,
		...env,
		projectName,
	});
	s.stop('Worker scaffolded');

	p.outro(
		`Written:\n  ${indexPath}\n  ${envPath}\n ${wranglerPath}\n${packagePath}\n${eslintConfigPath}\n${prettiercPath}\n${gitignorePath}\n\nRun \`npm install\`, then \`npm run cf-typegen\``,
	);
}

async function runExtractFlow() {
	const projectName = await promptProjectName();
	const schema = bail(
		await p.text({
			message: 'JSON schema for the data to extract (as JSON)',
			placeholder: '{"type":"object","properties":{"foo":{"type":"string"}}}',
			validate: (value) => {
				if (!value) return 'A JSON schema is required';
				if (!isValidJsonSchema(value)) return 'Not a valid JSON schema';
				return undefined;
			},
		}),
	);

	const useTier = bail(await p.confirm({ message: 'Pin a specific extraction tier?', initialValue: false }));
	let tier: string | undefined;
	let version: string | undefined;
	if (useTier) {
		tier = bail(
			await p.select({
				message: 'Which extraction tier?',
				options: EXTRACT_TIERS.map((tier) => ({ value: tier, label: tier })),
			}),
		);
		version = await promptVersion();
	}

	const useSystemPrompt = bail(await p.confirm({ message: 'Add a custom system prompt?', initialValue: false }));
	let systemPrompt: string | undefined;
	if (useSystemPrompt) {
		systemPrompt = bail(
			await p.text({
				message: 'System prompt',
				placeholder: "You're a helpful assistant",
			}),
		);
	}

	const outDir = await promptOutDir(projectName);
	const env = await promptEnv();

	const s = p.spinner();
	s.start('Scaffolding worker');
	const { indexPath, envPath, wranglerPath, packagePath, prettiercPath, gitignorePath, eslintConfigPath } = await scaffold({
		service: 'extract',
		dataSchema: schema,
		tier,
		version,
		systemPrompt: systemPrompt || undefined,
		outDir,
		...env,
		projectName,
	});
	s.stop('Worker scaffolded');

	p.outro(
		`Written:\n  ${indexPath}\n  ${envPath}\n ${wranglerPath}\n${packagePath}\n${eslintConfigPath}\n${prettiercPath}\n${gitignorePath}\n\nRun \`npm install\`, then \`npm run cf-typegen\``,
	);
}

async function runClassifyFlow() {
	const projectName = await promptProjectName();
	const rules: ClassifyRule[] = [];
	let addMore = true;
	while (addMore) {
		const type = bail(
			await p.text({
				message: `Rule #${rules.length + 1}: classification type`,
				validate: (value) => (value ? undefined : 'Required'),
			}),
		);
		const description = bail(
			await p.text({
				message: `Rule #${rules.length + 1}: description`,
				validate: (value) => (value ? undefined : 'Required'),
			}),
		);
		rules.push({ type, description });

		addMore = bail(await p.confirm({ message: 'Add another rule?', initialValue: false }));
	}

	const outDir = await promptOutDir(projectName);
	const env = await promptEnv();

	const s = p.spinner();
	s.start('Scaffolding worker');
	const { indexPath, envPath, wranglerPath, packagePath, gitignorePath, prettiercPath, eslintConfigPath } = await scaffold({
		service: 'classify',
		rules,
		outDir,
		...env,
		projectName,
	});
	s.stop('Worker scaffolded');

	p.outro(
		`Written:\n  ${indexPath}\n  ${envPath}\n ${wranglerPath}\n${packagePath}\n${eslintConfigPath}\n${prettiercPath}\n${gitignorePath}\n\nRun \`npm install\`, then \`npm run cf-typegen\``,
	);
}

export async function runTui() {
	p.intro('create-llama-worker');
	p.note(
		'This scaffolds a Cloudflare Worker around a single LlamaCloud service.\n' + 'Pick the one your worker should expose.',
		'Heads up',
	);

	const service = bail(
		await p.select({
			message: 'Which LlamaCloud service should this worker expose?',
			options: [
				{ value: 'parse', label: 'Parse', hint: 'LlamaParse: turn documents into markdown/text' },
				{ value: 'extract', label: 'Extract', hint: 'LlamaExtract: pull structured data out of documents' },
				{ value: 'classify', label: 'Classify', hint: 'LlamaClassify: label documents against custom rules' },
			],
		}),
	);

	switch (service) {
		case 'parse':
			await runParseFlow();
			break;
		case 'extract':
			await runExtractFlow();
			break;
		case 'classify':
			await runClassifyFlow();
			break;
	}
}
