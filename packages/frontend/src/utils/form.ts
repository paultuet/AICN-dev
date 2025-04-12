/**
 * Converts an object to URL-encoded form data
 */
export function objectToFormData(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => 
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}