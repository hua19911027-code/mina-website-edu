// scripts/create-booking-db.js
// 在 Notion 建立預約管理 DB 並更新 Cloudflare Worker secret
//
// 前置條件：
//   在 Notion 打開 mina-website 整合的父頁面，點選右上角 [...]
//   → 「新增連線」 → 選「mina-website」整合
//
// 執行方式：
//   NOTION_API_KEY=<your_notion_api_key> node scripts/create-booking-db.js

const NOTION_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = '374b8ee1-06b4-80ea-a0f9-dccaae830e8a';

async function main() {
  console.log('建立 Mina 預約管理 Database...');

  const res = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
      title: [{ type: 'text', text: { content: 'Mina 預約管理' } }],
      properties: {
        '家長姓名':   { title: {} },
        '聯絡電話':   { phone_number: {} },
        '學生姓名':   { rich_text: {} },
        '年級':       { select: { options: [
          { name: '小一' }, { name: '小二' }, { name: '小三' },
          { name: '小四' }, { name: '小五' }, { name: '小六' },
        ] } },
        '有興趣課程': { multi_select: { options: [
          { name: '徐薇英文 UP學' }, { name: '偉智數學 WISE' },
        ] } },
        '希望時段':   { rich_text: {} },
        '備注':       { rich_text: {} },
        '狀態':       { select: { options: [
          { name: '待聯繫' }, { name: '已聯繫' }, { name: '已報名' }, { name: '取消' },
        ] } },
        '預約時間':   { date: {} },
      },
    }),
  });

  const data = await res.json();
  if (!data.id) {
    console.error('❌ 建立失敗：', JSON.stringify(data, null, 2));
    console.error('\n請確認已在 Notion 將父頁面分享給 mina-website 整合');
    process.exit(1);
  }

  const dbId = data.id.replace(/-/g, '');
  console.log(`✅ 預約管理 DB 建立完成`);
  console.log(`   DB ID：${dbId}`);
  console.log('');
  console.log('請執行以下指令更新 Cloudflare Worker secret：');
  console.log(`  cd workers && echo "${dbId}" | npx wrangler secret put NOTION_BOOKING_DB_ID`);
}

main();
