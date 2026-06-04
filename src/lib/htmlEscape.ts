const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE_LOOKUP[char]);
}

export function escapeHtmlAttribute(value: unknown): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
