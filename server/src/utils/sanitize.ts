import { Parser } from 'htmlparser2';

/**
 * Allow-list for TipTap output. Scripts, styles, event handlers and javascript: URLs are stripped.
 * Implemented on htmlparser2 directly: sanitize-html is CommonJS and require()s the ESM-only
 * htmlparser2, which the Vercel Node runtime rejects with ERR_REQUIRE_ESM.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'hr', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

const VOID_TAGS = new Set(['br', 'hr', 'img']);

/** Tags whose contents must be dropped, not turned into text. */
const RAW_DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noembed', 'noscript', 'textarea', 'title', 'xmp', 'noframes']);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
};

const URL_ATTRS = new Set(['href', 'src']);
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);
const SAFE_TARGETS = new Set(['_blank', '_self', '_parent', '_top']);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeUrl(raw: string): boolean {
  const value = raw.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!value || value.startsWith('//') || value.startsWith('\\')) return false;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(value);
  if (!scheme) return true;
  return SAFE_SCHEMES.has(scheme[1].toLowerCase());
}

function renderAttrs(tag: string, attribs: Record<string, string>): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return '';
  const pairs: [string, string][] = [];
  for (const name of allowed) {
    const value = attribs[name];
    if (!value) continue;
    if (URL_ATTRS.has(name) && !isSafeUrl(value)) continue;
    if (name === 'target' && !SAFE_TARGETS.has(value)) continue;
    pairs.push([name, value]);
  }
  if (tag === 'a' && attribs.target === '_blank') {
    const rel = pairs.find(([name]) => name === 'rel');
    if (rel) rel[1] = 'noopener noreferrer';
    else pairs.push(['rel', 'noopener noreferrer']);
  }
  return pairs.map(([name, value]) => ` ${name}="${escapeHtml(value)}"`).join('');
}

function sanitize(html: string, allowTags: boolean): string {
  let result = '';
  const stack: string[] = [];
  let skip = 0;

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (skip) {
          skip += 1;
          return;
        }
        if (RAW_DROP.has(name)) {
          skip = 1;
          return;
        }
        if (!allowTags || !ALLOWED_TAGS.has(name)) return;
        result += `<${name}${renderAttrs(name, attribs)}>`;
        if (!VOID_TAGS.has(name)) stack.push(name);
      },
      ontext(text) {
        if (!skip) result += escapeHtml(text);
      },
      onclosetag(name) {
        if (skip) {
          skip -= 1;
          return;
        }
        const index = stack.lastIndexOf(name);
        if (index === -1) return;
        while (stack.length > index) result += `</${stack.pop()}>`;
      },
    },
    { decodeEntities: true },
  );

  parser.write(html);
  parser.end();
  while (stack.length) result += `</${stack.pop()}>`;
  return result;
}

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return '';
  return sanitize(html, true);
}

export function stripHtml(html: string): string {
  return sanitize(html, false).replace(/\s+/g, ' ').trim();
}
