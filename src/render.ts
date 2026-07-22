import { dirname, resolve } from 'path';
import nunjucks from 'nunjucks';
import Ajv from 'ajv';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const ajv = new Ajv();
const _dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(_dirname, '../templates');

export const PARSE_TIERS = ['fast', 'cost_effective', 'agentic', 'agentic_plus'] as const;
export const EXTRACT_TIERS = ['cost_effective', 'agentic'] as const;

export type ParseTier = (typeof PARSE_TIERS)[number];
export type ExtractTier = (typeof EXTRACT_TIERS)[number];

export type ClassifyRule = { type: string; description: string };

const VERSION_LATEST = 'latest';
const DATE_VERSION_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidVersion(version: string): boolean {
	return version === VERSION_LATEST || DATE_VERSION_RE.test(version);
}

export function isValidJsonSchema(dataSchema: string): boolean {
	let obj: object;
	try {
		obj = JSON.parse(dataSchema);
	} catch {
		return false;
	}
	try {
		ajv.compile(obj);
	} catch {
		return false;
	}
	return true;
}

export async function renderExtract(dataSchema: string, tier?: string, version?: string, systemPrompt?: string) {
	if (!isValidJsonSchema(dataSchema)) {
		throw new Error('The provided JSON schema is invalid');
	}
	const content = await readFile(resolve(TEMPLATES_DIR, 'extract.tpl'), { encoding: 'utf-8' });
	nunjucks.configure({ autoescape: false });
	const rendered = nunjucks.renderString(content, {
		tier: tier ? `'${tier}'` : 'undefined',
		version: version ? `'${version}'` : 'undefined',
		data_schema: dataSchema,
		system_prompt: systemPrompt ? `\`${systemPrompt.replaceAll("'", "\\'")}\`` : 'undefined',
	});
	const indexts = await readFile(resolve(TEMPLATES_DIR, 'index.tpl'), { encoding: 'utf-8' });
	const customCode = rendered
		.split('\n')
		.map((line) => `\t\t${line}`)
		.join('\n');
	const renderedIndex = nunjucks.renderString(indexts, { custom_code: customCode, purpose: 'extract' });
	return renderedIndex;
}

export async function renderParse(tier: string, version: string) {
	const content = await readFile(resolve(TEMPLATES_DIR, 'parse.tpl'), { encoding: 'utf-8' });
	nunjucks.configure({ autoescape: false });
	const rendered = nunjucks.renderString(content, { tier: `'${tier}'`, version: `'${version}'` });
	const indexts = await readFile(resolve(TEMPLATES_DIR, 'index.tpl'), { encoding: 'utf-8' });
	const customCode = rendered
		.split('\n')
		.map((line) => `\t\t${line}`)
		.join('\n');
	const renderedIndex = nunjucks.renderString(indexts, { custom_code: customCode, purpose: 'parse' });
	return renderedIndex;
}

export async function renderClassify(rules: ClassifyRule[]) {
	const content = await readFile(resolve(TEMPLATES_DIR, 'classify.tpl'), { encoding: 'utf-8' });
	let rulesStr = '[';
	for (const rule of rules) {
		rulesStr += `{ type: '${rule.type.replaceAll("'", "\\'")}', description: '${rule.description.replaceAll("'", "\\'")}' },`;
	}
	rulesStr += ']';
	nunjucks.configure({ autoescape: false });
	const rendered = nunjucks.renderString(content, { rules: rulesStr });
	const indexts = await readFile(resolve(TEMPLATES_DIR, 'index.tpl'), { encoding: 'utf-8' });
	const customCode = rendered
		.split('\n')
		.map((line) => `\t\t${line}`)
		.join('\n');
	const renderedIndex = nunjucks.renderString(indexts, { custom_code: customCode, purpose: 'classify' });
	return renderedIndex;
}

export async function renderEnv(apiKeyInput?: string, baseUrlInput?: string) {
	const apiKey = apiKeyInput ?? process.env.LLAMA_CLOUD_API_KEY ?? 'llx-your-api-key';
	const baseUrl = baseUrlInput ?? process.env.LLAMA_CLOUD_BASE_URL ?? 'https://api.cloud.llamaidex.ai';
	nunjucks.configure({ autoescape: false });
	const content = await readFile(resolve(TEMPLATES_DIR, '.env.tpl'), { encoding: 'utf-8' });
	const rendered = nunjucks.renderString(content, { api_key: apiKey, base_url: baseUrl });
	return rendered;
}

export async function renderWrangler(projectName: string) {
	nunjucks.configure({ autoescape: false });
	const content = await readFile(resolve(TEMPLATES_DIR, 'wrangler.tpl'), { encoding: 'utf-8' });
	const today = new Date();
	const rendered = nunjucks.renderString(content, { worker_name: projectName, compatibility_date: `${today.toISOString().slice(0, 10)}` });
	return rendered;
}

export async function renderPackage(projectName: string) {
	nunjucks.configure({ autoescape: false });
	const content = await readFile(resolve(TEMPLATES_DIR, 'package.tpl'), { encoding: 'utf-8' });
	const rendered = nunjucks.renderString(content, { package_name: projectName });
	return rendered;
}

export async function renderIgnore() {
	const content = await readFile(resolve(TEMPLATES_DIR, '.gitignore.tpl'), { encoding: 'utf-8' });
	return content;
}

export async function renderPrettier() {
	const content = await readFile(resolve(TEMPLATES_DIR, '.prettierrc.tpl'), { encoding: 'utf-8' });
	return content;
}

export async function renderEslintCfg() {
	const content = await readFile(resolve(TEMPLATES_DIR, '.eslintconfig.tpl'), { encoding: 'utf-8' });
	return content;
}
