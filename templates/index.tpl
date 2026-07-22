import LlamaCloud from '@llamaindex/llama-cloud';

export default {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async fetch(request, env, ctx): Promise<Response> {
		const client = new LlamaCloud({ apiKey: env.LLAMA_CLOUD_API_KEY, baseURL: env.LLAMA_CLOUD_BASE_URL, fetch: fetch });
		const form = await request.formData();
		const file = form.get('file');
		if (!file) {
			return Response.json({ detail: 'Expected `file` in FormData, but it was not found' }, { status: 400 });
		}
		if (typeof file === 'string') {
			return Response.json({ detail: 'Expected `file` to carry binary data, but it is a string' }, { status: 400 });
		}
		const fileObj = await client.files.create({
			file: file,
			purpose: '{{ purpose }}',
		});
{{ custom_code }}
		return Response.json(
			responseJson,
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		);
	},
} satisfies ExportedHandler<Env>;
