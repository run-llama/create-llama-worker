# create-llama-worker

Scaffold a [Cloudflare Worker](https://workers.cloudflare.com/) that exposes a single [LlamaParse Platform](https://cloud.llamaindex.ai/) service — **Parse**, **Extract**, or **Classify** — behind a simple HTTP endpoint.

Point it at a running worker with a `file` upload and get back structured JSON: markdown/text (Parse), structured data (Extract), or a label with reasoning and confidence (Classify).

## Usage

Run without arguments for an interactive setup:

```bash
npx @llamaindex/create-llama-worker
npm create @llamaindex/llama-worker
```

Or use one of the subcommands directly for non-interactive / scripted scaffolding.

### `parse`

Scaffold a worker that runs [LlamaParse](https://docs.cloud.llamaindex.ai/llamaparse/getting_started) to turn documents into markdown/text.

```bash
npx @llamaindex/create-llama-worker parse \
  --tier agentic \
  --version latest \
  --out-dir my-parse-worker
```

| Option                    | Required | Description                                               |
| ------------------------- | -------- | --------------------------------------------------------- |
| `-t, --tier <tier>`       | yes      | `fast` \| `cost_effective` \| `agentic` \| `agentic_plus` |
| `-v, --version <version>` | yes      | `latest` or a `YYYY-MM-DD` release date                   |

### `extract`

Scaffold a worker that runs [LlamaExtract](https://docs.cloud.llamaindex.ai/llamaextract/getting_started) to pull structured data out of documents.

```bash
npx @llamaindex/create-llama-worker extract \
  --schema '{"type":"object","properties":{"invoice_number":{"type":"string"}}}' \
  --tier agentic \
  --system-prompt "Extract invoice fields only" \
  --out-dir my-extract-worker
```

| Option                         | Required | Description                                                  |
| ------------------------------ | -------- | ------------------------------------------------------------ |
| `-s, --schema <json>`          | yes      | JSON schema describing the data to extract, as a JSON string |
| `-t, --tier <tier>`            | no       | `cost_effective` \| `agentic`                                |
| `-v, --version <version>`      | no       | `latest` or a `YYYY-MM-DD` release date                      |
| `-p, --system-prompt <prompt>` | no       | Custom system prompt to guide extraction                     |

### `classify`

Scaffold a worker that runs [LlamaClassify](https://docs.cloud.llamaindex.ai/) to label documents against custom rules.

```bash
npx @llamaindex/create-llama-worker classify \
  --rule "invoice:A billing document requesting payment" \
  --rule "contract:A legal agreement between two parties" \
  --out-dir my-classify-worker
```

| Option                          | Required | Description                                                                 |
| ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `-r, --rule <type:description>` | yes      | A classification rule as `<type>:<description>`. Repeat for multiple rules. |

### Common options

Available on every subcommand:

| Option                  | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `-o, --out-dir <dir>`   | Directory to scaffold the worker into (default: `.`)                              |
| `--api-key <key>`       | `LLAMA_CLOUD_API_KEY` to write into `.env` (defaults to `$LLAMA_CLOUD_API_KEY`)   |
| `--base-url <url>`      | `LLAMA_CLOUD_BASE_URL` to write into `.env` (defaults to `$LLAMA_CLOUD_BASE_URL`) |
| `--project-name <name>` | Name of the project                                                               |

## What gets generated

Each run scaffolds a self-contained Cloudflare Worker project in `--out-dir`:

```
<out-dir>/
├── src/index.ts        # the Worker: uploads the file, calls the LlamaCloud service, returns JSON
├── .env                # LLAMA_CLOUD_API_KEY / LLAMA_CLOUD_BASE_URL
├── wrangler.jsonc       # Wrangler configuration (worker name, compatibility date, nodejs_compat)
├── package.json         # scripts: dev, deploy, test, cf-typegen, lint, prettier
├── .gitignore
├── .prettierrc
└── eslint.config.mts
```

After scaffolding:

```bash
cd <out-dir>
npm install
npm run cf-typegen   # generate Env types from wrangler.jsonc
npm run dev          # run locally with wrangler dev
npm run deploy       # deploy to Cloudflare
```

The generated Worker accepts a `multipart/form-data` POST request with a `file` field, uploads it to LlamaCloud, runs the configured service, and returns JSON, e.g.:

```bash
curl -X POST http://localhost:8787 -F "file=@invoice.pdf"
```

## Development

This repo (the CLI itself, not the generated workers) uses `pnpm`.

```bash
pnpm install
pnpm run build     # bundles src/index.ts -> dist/index.js with esbuild
pnpm run lint
pnpm run prettier:fix
```

Source layout:

- `src/index.ts` – entry point; runs the interactive TUI when called with no args, otherwise dispatches to the CLI
- `src/cli.ts` – `commander`-based non-interactive CLI (`parse` / `extract` / `classify` subcommands)
- `src/tui.ts` – `@clack/prompts`-based interactive flow
- `src/scaffold.ts` – writes the rendered files to disk
- `src/render.ts` – renders `templates/*.tpl` (via `nunjucks`) into the final generated files
- `templates/` – Nunjucks templates for the generated Worker's `index.ts`, `wrangler.jsonc`, `package.json`, etc.

## License

MIT
