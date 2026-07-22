const result = await client.classify.run({
  file_input: fileObj.id,
  configuration: {
    rules: {{ rules }},
    mode: "FAST",
  },
})
const responseJson = result.result ? {
  classification: result.result.type,
  reasoning: result.result.reasoning,
  confidence: result.result.confidence,
  error: null
} : { classification: null, reasoning: null, confidence: null, error: "The Classify service did not produce any result" };
