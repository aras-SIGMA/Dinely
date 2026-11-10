/**
 * ============================================================================
 * DINELY - Parser Markdown Ringan untuk Bubble Chatbot
 * ============================================================================
 * Menghasilkan struktur data (bukan string HTML) sehingga Svelte dapat
 * merender tanpa `innerHTML` — aman dari XSS. Mendukung subset markdown:
 * heading, bullet/ordered list, bold, italic, inline code, dan tautan.
 * ============================================================================
 */

export type InlineSpan =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type MarkdownBlock =
  | { type: 'paragraph'; spans: InlineSpan[] }
  | { type: 'heading'; level: number; spans: InlineSpan[] }
  | { type: 'list'; ordered: boolean; items: InlineSpan[][] };

const SAFE_LINK = /^https?:\/\//i;

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  // Urutan penting: code, bold, italic, link, teks biasa
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    const token = match[0];
    if (token.startsWith('`')) {
      spans.push({ type: 'code', text: token.slice(1, -1) });
    } else if (token.startsWith('**')) {
      spans.push({ type: 'bold', text: token.slice(2, -2) });
    } else if (token.startsWith('*')) {
      spans.push({ type: 'italic', text: token.slice(1, -1) });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = linkMatch[2].trim();
        if (SAFE_LINK.test(href)) {
          spans.push({ type: 'link', text: label, href });
        } else {
          spans.push({ type: 'text', text: label });
        }
      } else {
        spans.push({ type: 'text', text: token });
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    spans.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return spans.length > 0 ? spans : [{ type: 'text', text }];
}

export function parseMarkdown(input: string): MarkdownBlock[] {
  if (!input) return [];

  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];

  let listBuffer: { ordered: boolean; items: InlineSpan[][] } | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({
        type: 'paragraph',
        spans: parseInline(paragraphBuffer.join(' '))
      });
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer && listBuffer.items.length > 0) {
      blocks.push({
        type: 'list',
        ordered: listBuffer.ordered,
        items: listBuffer.items
      });
    }
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        spans: parseInline(headingMatch[2].trim())
      });
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bulletMatch || orderedMatch) {
      flushParagraph();
      const ordered = Boolean(orderedMatch);
      const content = (bulletMatch ? bulletMatch[1] : orderedMatch![1]).trim();
      if (!listBuffer || listBuffer.ordered !== ordered) {
        flushList();
        listBuffer = { ordered, items: [] };
      }
      listBuffer.items.push(parseInline(content));
      continue;
    }

    flushList();
    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  flushList();

  return blocks;
}
