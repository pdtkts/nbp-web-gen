/**
 * Build GoogleGenAI constructor options.
 * When baseUrl is provided, routes all SDK requests through the custom endpoint.
 * @param {string} apiKey
 * @param {string} [baseUrl] - Custom API endpoint (e.g., 'https://proxy.example.com')
 * @returns {Object} Options for `new GoogleGenAI(options)`
 */
export function buildSdkOptions(apiKey, baseUrl) {
  const options = { apiKey }
  if (baseUrl) {
    options.httpOptions = { baseUrl }
  }
  return options
}
