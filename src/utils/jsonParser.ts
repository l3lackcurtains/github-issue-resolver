/**
 * Extracts JSON from markdown code blocks or returns the original text
 * @param text - The text that might contain JSON wrapped in markdown
 * @returns The extracted JSON string
 */
export function extractJsonFromMarkdown(text: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // Try to find JSON object or array in the text
  const trimmed = text.trim();
  
  // Look for JSON object
  const objectMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    return objectMatch[1];
  }
  
  // Look for JSON array
  const arrayMatch = trimmed.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    return arrayMatch[1];
  }
  
  // If no JSON found, return the original text
  return trimmed;
}

/**
 * Safely parses JSON that might be wrapped in markdown code blocks
 * @param text - The text containing JSON
 * @returns The parsed JSON object
 */
export function parseJsonResponse(text: string): any {
  const cleanJson = extractJsonFromMarkdown(text);
  try {
    return JSON.parse(cleanJson);
  } catch (error) {
    // Log the problematic JSON for debugging
    console.error('Failed to parse JSON:', error.message);
    console.error('JSON content (first 1000 chars):', cleanJson.substring(0, 1000));
    throw error;
  }
}