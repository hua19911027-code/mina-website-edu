// scripts/setup-notion-dbs.js
const NOTION_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = '374b8ee106b480eaa0f9dccaae830e8a';

async function createDB(title, properties) {
  const res = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
      title: [{ type: 'text', text: { content: title } }],
      properties
    })
  });
  const data = await res.json();
  if (!data.id) {
    console.error(`建立失敗：`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data.id.replace(/-/g, '');
}

async function main() {
  console.log('建立 Mina 題庫 Database...');
  const practiceId = await createDB('Mina 題庫', {
    '題目ID':   { title: {} },
    '年級':     { select: { options: [
      {name:'小一'},{name:'小二'},{name:'小三'},{name:'小四'},{name:'小五'},{name:'小六'}
    ]}},
    '科目':     { select: { options: [{name:'英文'},{name:'數學'}] }},
    '題型':     { select: { options: [
      {name:'標準題型'},{name:'觀念拆解'},{name:'錯題診斷'}
    ]}},
    '教材版本': { select: { options: [
      {name:'康軒Wonder World'},{name:'何嘉仁Super Fun'},{name:'康軒'},{name:'翰林'},{name:'南一'}
    ]}},
    '學期':     { select: { options: [{name:'上學期'},{name:'下學期'}] }},
    '學年度':   { select: { options: [{name:'114學年度'},{name:'115學年度'},{name:'116學年度'}] }},
    '單元':     { rich_text: {} },
    '題目':     { rich_text: {} },
    '選項A':    { rich_text: {} },
    '選項B':    { rich_text: {} },
    '選項C':    { rich_text: {} },
    '選項D':    { rich_text: {} },
    '答案':     { select: { options: [{name:'A'},{name:'B'},{name:'C'},{name:'D'}] }},
    '正確觀念': { rich_text: {} },
    '常見錯誤': { rich_text: {} },
    '記憶提示': { rich_text: {} },
    '發布日期': { date: {} },
    '是否發布': { checkbox: {} },
    '已封存':   { checkbox: {} }
  });
  console.log(`✅ 題庫 DB 建立完成，ID：${practiceId}`);

  console.log('建立 Mina 考前複習 Database...');
  const examId = await createDB('Mina 考前複習', {
    '名稱':     { title: {} },
    '科目':     { select: { options: [
      {name:'英文'},{name:'數學'},{name:'國語'},{name:'自然'},{name:'社會'}
    ]}},
    '年級':     { select: { options: [
      {name:'小一'},{name:'小二'},{name:'小三'},{name:'小四'},{name:'小五'},{name:'小六'}
    ]}},
    'PDF':      { files: {} },
    '開始時間': { date: {} },
    '結束時間': { date: {} },
    '是否啟用': { checkbox: {} }
  });
  console.log(`✅ 考前複習 DB 建立完成，ID：${examId}`);

  console.log(`\nNOTION_PRACTICE_DB_ID=${practiceId}`);
  console.log(`NOTION_EXAM_REVIEW_DB_ID=${examId}`);

  const fs = await import('fs');
  fs.writeFileSync('/home/manko94134/mina-website-edu/.notion-db-ids.tmp',
    `NOTION_PRACTICE_DB_ID=${practiceId}\nNOTION_EXAM_REVIEW_DB_ID=${examId}\n`);
}

main();
