import sanitizeHtml from 'sanitize-html';

/**
 * Sanitiza una cadena de texto para prevenir ataques XSS
 * Remueve todo el HTML y tags no seguros
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

/**
 * Sanitiza un array de strings
 */
export function sanitizeInputArray(inputs: string[]): string[] {
  return inputs.map(sanitizeInput);
}

/**
 * Sanitiza un objeto, aplicando sanitización a todas las propiedades string
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
}
