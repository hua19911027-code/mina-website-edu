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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function richTextToHtml(richTexts: any[]): string {
  if (!Array.isArray(richTexts)) return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return richTexts.map((rt: any) => {
    let text = (rt.plain_text ?? '') as string;
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (rt.annotations?.bold) text = `<strong>${text}</strong>`;
    if (rt.annotations?.italic) text = `<em>${text}</em>`;
    if (rt.annotations?.strikethrough) text = `<s>${text}</s>`;
    if (rt.annotations?.code) text = `<code>${text}</code>`;
    if (rt.href) text = `<a href="${rt.href as string}" target="_blank" rel="noopener">${text}</a>`;
    return text;
  }).join('');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockToHtml(block: any): string {
  const type = block.type as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = block[type] as any;
  if (!data) return '';

  switch (type) {
    case 'paragraph':
      return `<p>${richTextToHtml(data.rich_text)}</p>`;

    case 'heading_1':
    case 'heading_2':
      return `<h2>${richTextToHtml(data.rich_text)}</h2>`;

    case 'heading_3':
      return `<h3>${richTextToHtml(data.rich_text)}</h3>`;

    case 'bulleted_list_item':
    case 'numbered_list_item':
      return `<li>${richTextToHtml(data.rich_text)}</li>`;

    case 'quote':
      return `<blockquote>${richTextToHtml(data.rich_text)}</blockquote>`;

    case 'callout': {
      const icon = (data.icon?.emoji ?? data.icon?.external?.url ?? '') as string;
      const text = richTextToHtml(data.rich_text);
      return `<div class="callout">${icon ? `<span>${icon}</span>` : ''}${text}</div>`;
    }

    case 'divider':
      return '<hr/>';

    case 'image': {
      const url = (data.type === 'external' ? data.external?.url : data.file?.url) as string | undefined;
      if (!url) return '';
      const caption = richTextToHtml(data.caption ?? []);
      return `<figure><img src="${url}" alt="${caption || '圖片'}" loading="lazy"/>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
    }

    case 'toggle':
      return `<p>${richTextToHtml(data.rich_text)}</p>`;

    case 'code':
      return `<pre><code>${richTextToHtml(data.rich_text)}</code></pre>`;

    case 'table':
    case 'table_row':
    case 'column_list':
    case 'column':
    case 'child_page':
    case 'child_database':
    case 'embed':
    case 'bookmark':
    case 'link_preview':
    case 'template':
    case 'synced_block':
    case 'breadcrumb':
    case 'table_of_contents':
    case 'equation':
    case 'pdf':
    case 'video':
    case 'audio':
    case 'file':
    case 'link_to_page':
      return '';

    default:
      return '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function blocksToHtml(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';

  const parts: string[] = [];
  let inBullet = false;
  let inNumber = false;

  for (const block of blocks) {
    try {
      const type = block.type as string;

      if (type === 'bulleted_list_item') {
        if (!inBullet) { parts.push('<ul>'); inBullet = true; }
        if (inNumber) { parts.push('</ol>'); inNumber = false; }
      } else if (type === 'numbered_list_item') {
        if (!inNumber) { parts.push('<ol>'); inNumber = true; }
        if (inBullet) { parts.push('</ul>'); inBullet = false; }
      } else {
        if (inBullet) { parts.push('</ul>'); inBullet = false; }
        if (inNumber) { parts.push('</ol>'); inNumber = false; }
      }

      parts.push(blockToHtml(block));
    } catch {
      // 單個 block 出錯，跳過，不影響其餘內容
    }
  }

  if (inBullet) parts.push('</ul>');
  if (inNumber) parts.push('</ol>');

  return parts.join('');
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

/* ── getProperty helpers ── */

export function getTitleText(page: NotionPage): string {
  const props = Object.values(page.properties) as Record<string, unknown>[];
  const prop = props.find((p) => p['type'] === 'title');
  if (!prop) return '';
  const arr = prop['title'] as NotionRichText[] | undefined;
  return arr ? arr.map((t) => t.plain_text).join('') : '';
}

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
