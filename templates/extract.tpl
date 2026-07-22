const result = await client.extract.run({
  file_input: fileObj.id,
  configuration: {
    data_schema: {{ data_schema }},
    tier: {{ tier }},
    version: {{ version }},
    system_prompt: {{ system_prompt }},
  }
})
const responseJson = {
  extracted_data: result.extract_result,
  metadata: result.extract_metadata
}
