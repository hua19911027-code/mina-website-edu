/* GET /api/v1/practice?subject=en|ma&grade=1-2|3-4|5-6 */

import { Hono } from 'hono';
import type { Bindings, PracticeData } from '../types';

/* Static imports — bundled by wrangler at build time */
import en12 from '../../../data/practice/en/grade1-2.json';
import en34 from '../../../data/practice/en/grade3-4.json';
import en56 from '../../../data/practice/en/grade5-6.json';
import ma12 from '../../../data/practice/ma/grade1-2.json';
import ma34 from '../../../data/practice/ma/grade3-4.json';
import ma56 from '../../../data/practice/ma/grade5-6.json';

const dataMap: Record<string, PracticeData> = {
  'en:1-2': en12 as PracticeData,
  'en:3-4': en34 as PracticeData,
  'en:5-6': en56 as PracticeData,
  'ma:1-2': ma12 as PracticeData,
  'ma:3-4': ma34 as PracticeData,
  'ma:5-6': ma56 as PracticeData,
};

const VALID_SUBJECTS = ['en', 'ma'];
const VALID_GRADES = ['1-2', '3-4', '5-6'];

const route = new Hono<{ Bindings: Bindings }>();

route.get('/', (c) => {
  const subject = c.req.query('subject') || 'en';
  const grade = c.req.query('grade') || '1-2';

  if (!VALID_SUBJECTS.includes(subject)) {
    return c.json({ ok: false, error: { code: 'INVALID_PARAM', message: 'subject must be en or ma' } }, 400);
  }
  if (!VALID_GRADES.includes(grade)) {
    return c.json({ ok: false, error: { code: 'INVALID_PARAM', message: 'grade must be 1-2, 3-4, or 5-6' } }, 400);
  }

  const key = `${subject}:${grade}`;
  const data = dataMap[key];

  if (!data) {
    return c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Practice data not found' } }, 404);
  }

  /* Shuffle questions for variety */
  const shuffled = [...data.questions].sort(() => Math.random() - 0.5);

  return c.json({
    ok: true,
    data: { ...data, questions: shuffled },
  });
});

export default route;
