/* Shared TypeScript types for Cloudflare Workers */

export type Bindings = {
  NOTION_API_KEY: string;
  NOTION_BOOKING_DB_ID: string;
  NOTION_NEWS_DB_ID: string;
  NOTION_FAQ_DB_ID: string;
  NOTION_PRACTICE_DB_ID: string;
  NOTION_EXAM_REVIEW_DB_ID: string;
  LINE_OFFICIAL_URL: string;
  N8N_BOOKING_WEBHOOK?: string;
  N8N_REGEN_WEBHOOK?: string;
  ADMIN_SECRET: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  KV_SETTINGS: KVNamespace;
};

/* ── API Response shapes ── */

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

/* ── Booking ── */

export interface BookingPayload {
  parentName: string;
  phone: string;
  studentName?: string;
  grade: string;
  courses?: string[];
  subjects?: string[];
  preferredTime?: string;
  note?: string;
}

/* ── News ── */

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
  coverImage?: string;
  photos: string[];
  publishedAt: string;
  tags: string[];
  content?: string;
  related?: Article[];
}

export interface ArticleList {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/* ── FAQ ── */

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

export interface FaqList {
  faqs: FaqItem[];
}

/* ── Practice ── */

export interface PracticeExplanation {
  concept: string;
  commonMistake: string;
  memoryTip: string;
}

export interface PracticeQuestion {
  id: string;
  grade: string;
  subject: string;
  type: string;
  unit: string;
  question: string;
  options: string[];
  answer: string;
  explanation: PracticeExplanation;
  publishedAt: string;
}

export interface PracticeList {
  questions: PracticeQuestion[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  lastUpdated: string;
  reachedLimit?: boolean;
}

export interface ExamReviewItem {
  id: string;
  name: string;
  subject: string;
  grade: string;
  pdfUrl: string;
  startAt: string;
  endAt: string;
}

export interface ExamReviewData {
  active: boolean;
  grade: string;
  items: ExamReviewItem[];
}

export interface PracticeData {
  subject: string;
  grade: string;
  gradeLabel: string;
  updatedAt: string;
  questions: PracticeQuestion[];
}

/* ── Mina QA Tree ── */

export interface MinaOption {
  label: string;
  nodeId: string;
}

export interface MinaCta {
  label: string;
  url: string;
}

export interface MinaNode {
  id: string;
  type: 'options' | 'answer' | 'handoff';
  text: string | null;
  options: MinaOption[];
  cta?: MinaCta;
}

export interface MinaTree {
  version: string;
  updatedAt: string;
  welcome: string;
  handoffMessage: string;
  handoffCta: MinaCta;
  nodes: Record<string, MinaNode>;
}

/* ── Notion types ── */

export interface NotionFileProp {
  type: 'file' | 'external';
  file?: { url: string; expiry_time: string };
  external?: { url: string };
}

export interface NotionFilesProperty {
  type: 'files';
  files: NotionFileProp[];
}

export interface NotionRichText {
  type: string;
  text?: { content: string; link?: { url: string } | null };
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
}

export interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
  url?: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

export interface QueryOpts {
  filter?: unknown;
  sorts?: unknown[];
  page_size?: number;
  start_cursor?: string;
}
