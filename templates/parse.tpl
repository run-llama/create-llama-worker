const result = await client.parsing.parse({
  file_id: fileObj.id,
  tier: {{ tier }},
  version: {{ version }},
  expand: ["markdown_full", "text_full", "items"]
})

const responseJson = { content: result.markdown_full ?? result.text_full ?? "", items: result.items }
