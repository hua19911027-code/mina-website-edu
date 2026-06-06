/* Notion API adapter — all Notion calls are centralized here */

import type {
  NotionPage,
  NotionBlock,
  NotionFilesProperty,
  NotionFileProp,
  NotionRichText,
  QueryOpts,
} from '../types';

const NOTION_VERSION = '2022-06-28';
const BASE_URL = 'https://api.notion.com/v1';

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: 'Bearer ' + apiKey,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

/* ── queryDatabase ── */

export async function queryDatabase(
  apiKey: string,
  dbId: string,
  opts: QueryOpts = {}
): Promise<{ results: NotionPage[]; has_more: boolean; next_cursor: string | null }> {
  console.log('[notion] querying DB:', dbId);
  console.log('[notion] filter:', JSON.stringify(opts.filter));

  const res = await fetch(`${BASE_URL}/databases/${dbId}/query`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      filter: opts.filter,
      sorts: opts.sorts,
      page_size: opts.page_size ?? 20,
      start_cursor: opts.start_cursor,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion queryDatabase failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    results: NotionPage[];
    has_more: boolean;
    next_cursor: string | null;
  };
  const pages = json.results;
  console.log('[notion] raw response pages:', pages.length);
  if (pages.length > 0) console.log('[notion] first page props:', JSON.stringify(Object.keys(pages[0].properties)));
  return json;
}

/* ── getPage ── */

export async function getPage(apiKey: string, pageId: string): Promise<NotionPage> {
  const res = await fetch(`${BASE_URL}/pages/${pageId}`, {
    headers: headers(apiKey),
  });

  if (!res.ok) {
    throw new Error(`Notion getPage failed: ${res.status}`);
  }

  return (await res.json()) as NotionPage;
}

/* ── getPageBlocks ── */

export async function getPageBlocks(apiKey: string, pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const url = `${BASE_URL}/blocks/${pageId}/children?page_size=100` +
      (cursor ? `&start_cursor=${cursor}` : '');
    const res = await fetch(url, { headers: headers(apiKey) });

    if (!res.ok) break;

    const json = (await res.json()) as {
      results: NotionBlock[];
      has_more: boolean;
      next_cursor: string | null;
    };

    blocks.push(...json.results);
    cursor = json.has_more && json.next_cursor ? json.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/* ── blocksToHtml ── */

export function blocksToHtml(blocks: NotionBlock[]): string {
  const parts: string[] = [];
  let ulOpen = false;
  let olOpen = false;

  function closeList() {
    if (ulOpen) { parts.push('</ul>'); ulOpen = false; }
    if (olOpen) { parts.push('</ol>'); olOpen = false; }
  }

  for (const block of blocks) {
    try {
      const type = block.type as string;

      if (type !== 'bulleted_list_item' && ulOpen) { parts.push('</ul>'); ulOpen = false; }
      if (type !== 'numbered_list_item' && olOpen) { parts.push('</ol>'); olOpen = false; }

      const richTexts = getRichTexts(block, type);

      switch (type) {
        case 'paragraph': {
          const html = richTextsToHtml(richTexts);
          if (html) parts.push(`<p>${html}</p>`);
          break;
        }
        case 'heading_1': {
          const html = richTextsToHtml(richTexts);
          if (html) parts.push(`<h1>${html}</h1>`);
          break;
        }
        case 'heading_2': {
          const html = richTextsToHtml(richTexts);
          if (html) parts.push(`<h2>${html}</h2>`);
          break;
        }
        case 'heading_3': {
          const html = richTextsToHtml(richTexts);
          if (html) parts.push(`<h3>${html}</h3>`);
          break;
        }
        case 'bulleted_list_item': {
          if (!ulOpen) { parts.push('<ul>'); ulOpen = true; }
          parts.push(`<li>${richTextsToHtml(richTexts)}</li>`);
          break;
        }
        case 'numbered_list_item': {
          if (!olOpen) { parts.push('<ol>'); olOpen = true; }
          parts.push(`<li>${richTextsToHtml(richTexts)}</li>`);
          break;
        }
        case 'callout': {
          closeList();
          const b = block as Record<string, unknown>;
          const calloutData = b['callout'] as Record<string, unknown> | undefined;
          if (calloutData) {
            const icon = calloutData['icon'] as Record<string, unknown> | undefined;
            const emoji = (icon?.['type'] === 'emoji' ? icon['emoji'] as string : '') || '';
            const calloutTexts = (calloutData['rich_text'] as NotionRichText[] | undefined) || [];
            const html = richTextsToHtml(calloutTexts);
            if (html || emoji) {
              parts.push(`<div class="art-callout">${emoji}${emoji ? ' ' : ''}${html}</div>`);
            }
          }
          break;
        }
        case 'quote': {
          closeList();
          const html = richTextsToHtml(richTexts);
          if (html) parts.push(`<blockquote>${html}</blockquote>`);
          break;
        }
        case 'divider': {
          closeList();
          parts.push('<hr>');
          break;
        }
        case 'image': {
          closeList();
          const img = block as Record<string, unknown>;
          let src = '';
          const imgData = img['image'] as Record<string, unknown> | undefined;
          if (imgData) {
            if (imgData['type'] === 'file') {
              src = ((imgData['file'] as Record<string, unknown>)['url'] as string) || '';
            } else if (imgData['type'] === 'external') {
              src = ((imgData['external'] as Record<string, unknown>)['url'] as string) || '';
            }
          }
          if (src) {
            const capArr = imgData?.['caption'] as NotionRichText[] | undefined;
            const cap = capArr ? richTextsToHtml(capArr) : '';
            parts.push(`<figure><img src="${escHtml(src)}" alt="${escHtml(cap)}" loading="lazy"></figure>`);
          }
          break;
        }
        case 'toggle': {
          closeList();
          const html = richTextsToHtml(richTexts);
          if (html) parts.push(`<p>${html}</p>`);
          break;
        }
        case 'table':
        case 'table_row':
        case 'column_list':
        case 'column':
          break;
        default:
          break;
      }
    } catch {
      // skip unrenderable block
    }
  }

  closeList();
  return parts.join('\n');
}

/* ── extractFileUrls ── */

export function extractFileUrls(prop: NotionFilesProperty | undefined): string[] {
  if (!prop || !prop.files) return [];
  return prop.files
    .map((f: NotionFileProp) => {
      if (f.type === 'file' && f.file) return f.file.url;
      if (f.type === 'external' && f.external) return f.external.url;
      return null;
    })
    .filter((u): u is string => u !== null);
}

/* ── Helpers ── */

function getRichTexts(block: NotionBlock, type: string): NotionRichText[] {
  const b = block as Record<string, unknown>;
  const inner = b[type] as Record<string, unknown> | undefined;
  if (!inner) return [];
  return (inner['rich_text'] as NotionRichText[] | undefined) || [];
}

function richTextsToHtml(texts: NotionRichText[]): string {
  return texts
    .map((t) => {
      let text = escHtml(t.plain_text || '');
      const ann = t.annotations;
      if (ann) {
        if (ann.bold) text = `<strong>${text}</strong>`;
        if (ann.italic) text = `<em>${text}</em>`;
        if (ann.code) text = `<code>${text}</code>`;
        if (ann.strikethrough) text = `<s>${text}</s>`;
        if (ann.underline) text = `<u>${text}</u>`;
      }
      if (t.href) text = `<a href="${escHtml(t.href)}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    })
    .join('');
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── getProperty helpers ── */

export function getPropText(page: NotionPage, name: string): string {
  const prop = (page.properties[name] as Record<string, unknown>) || {};
  const type = prop['type'] as string | undefined;

  if (type === 'title') {
    const arr = prop['title'] as NotionRichText[] | undefined;
    return arr ? arr.map((t) => t.plain_text).join('') : '';
  }
  if (type === 'rich_text') {
    const arr = prop['rich_text'] as NotionRichText[] | undefined;
    return arr ? arr.map((t) => t.plain_text).join('') : '';
  }
  if (type === 'select') {
    const sel = prop['select'] as Record<string, unknown> | null | undefined;
    return sel ? (sel['name'] as string) || '' : '';
  }
  if (type === 'multi_select') {
    const arr = prop['multi_select'] as Record<string, unknown>[] | undefined;
    return arr ? arr.map((s) => s['name'] as string).join(',') : '';
  }
  if (type === 'date') {
    const d = prop['date'] as Record<string, unknown> | null | undefined;
    return d ? (d['start'] as string) || '' : '';
  }

  return '';
}

export function getPropFiles(page: NotionPage, name: string): NotionFilesProperty | undefined {
  const prop = page.properties[name] as NotionFilesProperty | undefined;
  return prop;
}

export function getPropTags(page: NotionPage, name: string): string[] {
  const prop = (page.properties[name] as Record<string, unknown>) || {};
  const arr = prop['multi_select'] as Record<string, unknown>[] | undefined;
  return arr ? arr.map((s) => s['name'] as string) : [];
}
