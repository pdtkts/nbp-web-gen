/**
 * Fetch a file from a URI and convert it to base64 string.
 * Used when custom backends return image data as fileData.fileUri (URL)
 * instead of inlineData (base64).
 *
 * @param {string} fileUri - The URL to fetch the image from
 * @param {string} [fallbackMimeType='image/png'] - MIME type to use if response doesn't specify
 * @returns {Promise<{ data: string, mimeType: string }>} Base64 data and MIME type
 */
export async function fetchFileUriAsBase64(fileUri, fallbackMimeType = 'image/png') {
  const resp = await fetch(fileUri)
  if (!resp.ok) throw new Error(`Failed to fetch image: HTTP ${resp.status}`)

  const blob = await resp.blob()
  const mimeType = blob.type || fallbackMimeType

  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Strip "data:...;base64," prefix → pure base64
      const result = reader.result
      resolve(result.substring(result.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  return { data, mimeType }
}

/**
 * Convert a fileData.fileUri to a data URL string.
 * Convenience wrapper for contexts that need data:mime;base64,xxx format.
 *
 * @param {string} fileUri - The URL to fetch the image from
 * @param {string} [fallbackMimeType='image/png'] - MIME type fallback
 * @returns {Promise<string>} Data URL (data:mime;base64,xxx)
 */
export async function fetchFileUriAsDataUrl(fileUri, fallbackMimeType = 'image/png') {
  const { data, mimeType } = await fetchFileUriAsBase64(fileUri, fallbackMimeType)
  return `data:${mimeType};base64,${data}`
}
