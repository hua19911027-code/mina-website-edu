/* Mina 小幫手 Widget v1.0
 * 資料來源：data/mina/mina-advisor-tree.json（嵌入於此，改對話只需改 JSON 再更新此常數）
 */
(function () {
  'use strict';

  // ─── 對話樹資料（來源：data/mina/mina-advisor-tree.json）─────────────
  var TREE = {
    "meta": { "version": "1.0.0" },
    "global": {
      "cta": {
        "trial": { "type": "trial", "label": "📅 預約免費試聽", "url": "/booking.html#bookForm" },
        "line":  { "type": "line",  "label": "💬 加 LINE 詢問", "url": "https://lin.ee/xEQXMdw" },
        "phone": { "type": "phone", "label": "📞 直接電話聯絡", "url": "tel:04-2336-6868" },
        "map":   { "type": "map",   "label": "📍 Google Maps 導航", "url": "https://maps.app.goo.gl/aPqkAwvC9KkYAcSN9" }
      },
      "articles": {
        "english":    { "label": "📖 了解徐薇英文", "url": "https://mina-website-edu.pages.dev/news-single?slug=hsuwei-english-education-concept" },
        "math":       { "label": "🔢 了解偉智數學", "url": "https://mina-website-edu.pages.dev/news-single?slug=wisemath-thinking-learning" },
        "afterschool":{ "label": "🏠 了解安親班",   "url": "https://mina-website-edu.pages.dev/news-single?slug=excellent-after-school-care" },
        "camp":       { "label": "☀️ 查看夏令營課程","url": "https://mina-website-edu.pages.dev/news-single?slug=summer-camp-2026" }
      }
    },
    "flows": {
      "homepage": "home_welcome",
      "course":   "course_welcome",
      "about":    "about_welcome",
      "news":     "news_welcome",
      "faq":      "faq_welcome",
      "quiz":     "quiz_welcome",
      "quiz_archive": "archive_welcome"
    },
    "nodes": {
      "home_welcome": {
        "id": "home_welcome", "type": "options",
        "text": "嗨～我是 Mina 😊\n先別急著找答案（誤 🤭）\n讓我用 30 秒幫你找到最適合孩子的方向！",
        "options": [
          { "label": "找適合孩子的課程", "next": "home_find_course" },
          { "label": "課程規劃與費用",   "next": "global_pricing" },
          { "label": "預約免費試聽",     "next": "home_trial" },
          { "label": "安親服務",         "next": "ans_afterschool" },
          { "label": "認識我們",         "next": "about_welcome" },
          { "label": "聯絡老師",         "next": "global_contact" }
        ]
      },
      "home_find_course": {
        "id": "home_find_course", "type": "options",
        "text": "孩子目前就讀？",
        "options": [
          { "label": "🎒 國小 1–2 年級",     "next": "home_sub_e12" },
          { "label": "📚 國小 3–4 年級",     "next": "home_sub_e34" },
          { "label": "✏️ 國小 5–6 年級",    "next": "home_sub_e56" },
          { "label": "🎯 國中",              "next": "home_sub_jh" },
          { "label": "🌱 要升小一（暑假正音班）","next": "ans_zhengyin" }
        ]
      },
      "home_sub_e12": {
        "id": "home_sub_e12", "type": "options",
        "text": "孩子最需要哪位神隊友？😊",
        "options": [
          { "label": "📖 英文 UP學",        "next": "ans_en_e12" },
          { "label": "🔢 數學 WISE",        "next": "ans_ma_e12" },
          { "label": "🎒 安親服務",          "next": "ans_afterschool" },
          { "label": "🤔 我也不確定，想聽建議","next": "unsure_concern_e12" }
        ]
      },
      "home_sub_e34": {
        "id": "home_sub_e34", "type": "options",
        "text": "孩子最需要哪位神隊友？😊",
        "options": [
          { "label": "📖 英文 UP學",        "next": "ans_en_e34" },
          { "label": "🔢 數學 WISE",        "next": "ans_ma_e34" },
          { "label": "🎒 安親服務",          "next": "ans_afterschool" },
          { "label": "🤔 我也不確定，想聽建議","next": "unsure_concern_e34" }
        ]
      },
      "home_sub_e56": {
        "id": "home_sub_e56", "type": "options",
        "text": "孩子最需要哪位神隊友？😊",
        "options": [
          { "label": "📖 英文 UP學",        "next": "ans_en_e56" },
          { "label": "🔢 數學 WISE",        "next": "ans_ma_e56" },
          { "label": "🎒 安親服務",          "next": "ans_afterschool" },
          { "label": "🤔 我也不確定，想聽建議","next": "unsure_concern_e56" }
        ]
      },
      "home_sub_jh": {
        "id": "home_sub_jh", "type": "options",
        "text": "國中階段，孩子目前最需要加強？",
        "options": [
          { "label": "📖 英文（有開設）",      "next": "ans_en_jh" },
          { "label": "🔢 數學（想了解）",      "next": "ans_ma_jh" },
          { "label": "🤔 我也不確定，想聽建議","next": "unsure_concern_jh" }
        ]
      },
      "home_trial": {
        "id": "home_trial", "type": "answer",
        "text": "太好了！✨\n\n預約試聽，讓老師親自了解孩子——\n這是最準確的方式 😊\n\n可以直接填下方預約表單，\n習慣用 LINE 的話也可以直接找我們！\n\n🕐 LINE 回覆時間提醒：\n平日 13:30–19:30 回覆最快，\n其他時間也會看，但可能稍慢一點 😄",
        "cta": ["trial","line","phone"]
      },
      "course_welcome": {
        "id": "course_welcome", "type": "options",
        "text": "嗨！看課程介紹，有什麼想多了解的？😊",
        "options": [
          { "label": "📖 英文 UP學",          "next": "course_grade_en" },
          { "label": "🔢 數學 WISE",          "next": "course_grade_ma" },
          { "label": "🎒 安親課後",            "next": "ans_afterschool" },
          { "label": "☀️ 暑假 / 正音課程",    "next": "global_camp_zhengyin" },
          { "label": "🤔 我也不確定，想聽建議","next": "unsure_grade" }
        ]
      },
      "course_grade_en": {
        "id": "course_grade_en", "type": "options",
        "text": "孩子目前幾年級呢？📚",
        "options": [
          { "label": "🎒 國小 1–2 年級","next": "ans_en_e12" },
          { "label": "📚 國小 3–4 年級","next": "ans_en_e34" },
          { "label": "✏️ 國小 5–6 年級","next": "ans_en_e56" },
          { "label": "🎯 國中",          "next": "ans_en_jh" }
        ]
      },
      "course_grade_ma": {
        "id": "course_grade_ma", "type": "options",
        "text": "孩子目前幾年級呢？📐",
        "options": [
          { "label": "🎒 國小 1–2 年級",  "next": "ans_ma_e12" },
          { "label": "📚 國小 3–4 年級",  "next": "ans_ma_e34" },
          { "label": "✏️ 國小 5–6 年級", "next": "ans_ma_e56" },
          { "label": "🎯 國中（想了解）", "next": "ans_ma_jh" }
        ]
      },
      "about_welcome": {
        "id": "about_welcome", "type": "options",
        "text": "嗨！你好 👋\n\n這頁的家長通常都在想一個問題：\n「這間補習班⋯⋯可以信任嗎？」\n\n很合理！選擇補習班本來就要謹慎 😊\n\n想了解哪個部分呢？",
        "options": [
          { "label": "📖 教學理念",   "next": "about_philosophy" },
          { "label": "👨‍🏫 師資介紹", "next": "about_teacher" },
          { "label": "🏫 上課環境",   "next": "about_environment" },
          { "label": "⭐ 家長評價",   "next": "about_reviews" },
          { "label": "📅 預約來看看", "next": "about_visit" }
        ]
      },
      "about_philosophy": {
        "id": "about_philosophy", "type": "answer",
        "text": "我們的理念很簡單——\n\n不追求「塞最多」，\n而是追求「孩子真的懂」。\n\n讓孩子在學習中找到成就感，\n他自己就會想學 😊\n\n這不是廣告詞，是真的——\n很多孩子試聽完就開始期待上課了！",
        "cta": ["trial","line","phone"],
        "articles": ["english","math"]
      },
      "about_teacher": {
        "id": "about_teacher", "type": "answer",
        "text": "師資這件事，我很驕傲可以說——\n\n我們的老師都是全職老師，不是臨時兼差的 😊\n\n每位老師都長期跟著同一批孩子，\n知道每個孩子的狀況、個性、弱點，\n不是每天換面孔的那種。\n\n家長最常說的是：\n「老師真的很了解我的孩子。」\n\n想見見老師嗎？來試聽就可以囉！",
        "cta": ["trial","line","phone"]
      },
      "about_environment": {
        "id": "about_environment", "type": "answer",
        "text": "上課環境的話——\n\n小班制，每班不多，\n老師可以真的注意到每一個孩子 😊\n\n有固定的學習空間，孩子可以專心，\n不像大班課那樣容易分心。\n\n有機會的話，歡迎直接來看看！\n（百聞不如一見，對補習班也適用 🤭）",
        "cta": ["trial","map","line"]
      },
      "about_reviews": {
        "id": "about_reviews", "type": "answer",
        "text": "家長評價的話——\n\n說幾個真實的狀況：\n\n「孩子本來很抗拒補習，\n 現在自己說要來上課」\n\n「成績進步了，但更重要的是\n 他開始不怕數學了」\n\n「老師很有耐心，對孩子很用心」\n\n這些我們都真的聽到過 😊\n\n每個孩子的狀況不同——\n最好的方式還是先來試聽，\n讓老師直接了解你的孩子！",
        "cta": ["trial","line","phone"]
      },
      "about_visit": {
        "id": "about_visit", "type": "answer",
        "text": "歡迎直接來看看！😊\n\n來試聽就是最好的參觀——\n孩子可以感受上課氛圍，\n家長也可以跟老師聊聊孩子的狀況。\n\n我們在烏日區，旭光國小旁邊，很好找！",
        "cta": ["trial","map","line"]
      },
      "news_welcome": {
        "id": "news_welcome", "type": "options",
        "text": "這篇內容有幫助到你嗎？😊",
        "options": [
          { "label": "👍 有幫助，謝謝！",   "next": "news_helpful" },
          { "label": "🤔 還想了解更多",     "next": "home_find_course" },
          { "label": "📅 想預約試聽",       "next": "home_trial" },
          { "label": "💬 想直接問老師",     "next": "global_contact" }
        ]
      },
      "news_helpful": {
        "id": "news_helpful", "type": "answer",
        "text": "太好了！😊\n\n如果之後有問題，隨時都可以找 Mina！\n\n也歡迎認識我們的課程——\n說不定有適合孩子的方案 😊",
        "cta": ["trial","line","phone"],
        "articles": ["english","math","afterschool"]
      },
      "faq_welcome": {
        "id": "faq_welcome", "type": "options",
        "text": "嗨！我是 Mina 😊\n有什麼問題，我幫你找答案！",
        "options": [
          { "label": "怎麼預約試聽？😊",    "next": "home_trial" },
          { "label": "孩子適合哪個班？📚",  "next": "home_find_course" },
          { "label": "有安親班嗎？🎒",      "next": "ans_afterschool" },
          { "label": "離旭光國小遠嗎？🚶",  "next": "faq_location" }
        ]
      },
      "faq_trial": {
        "id": "faq_trial", "type": "options",
        "text": "關於試聽，你想了解什麼？",
        "options": [
          { "label": "試聽怎麼進行？",           "next": "faq_trial_how" },
          { "label": "試聽有費用嗎？",           "next": "faq_trial_free" },
          { "label": "試聽後需要立刻決定嗎？",   "next": "faq_trial_decision" },
          { "label": "怎麼預約試聽？",           "next": "home_trial" }
        ]
      },
      "faq_trial_how": {
        "id": "faq_trial_how", "type": "answer",
        "text": "試聽大約 40–50 分鐘，流程大概是這樣：\n\n1️⃣ 老師先跟你聊聊孩子目前的狀況\n2️⃣ 上一堂正式課的內容，讓孩子實際感受\n3️⃣ 試聽結束後，老師分析孩子的程度，\n   告訴你適合的課程安排\n\n全程沒有業務感，\n就是真的讓你了解我們怎麼教 😊\n\n（沒有「今天就要決定！名額有限！」的壓力——\n那種事我們不做 😂）",
        "cta": ["trial","line","phone"]
      },
      "faq_trial_free": {
        "id": "faq_trial_free", "type": "answer",
        "text": "試聽完全免費！😊\n\n不用任何費用，\n老師就會幫你完整評估孩子的狀況，\n說明課程規劃和費用。\n\n所以說，\n不來試聽好像說不過去對吧 🤭",
        "cta": ["trial","line","phone"]
      },
      "faq_trial_decision": {
        "id": "faq_trial_decision", "type": "answer",
        "text": "完全不需要！😄\n\n試聽完可以帶孩子回去討論，感受一下，\n想清楚再決定。\n\n我們這裡沒有人會盯著你說\n「今天就決定！名額有限！」\n那種事我們不做 😂\n\n放心來，沒壓力的！",
        "cta": ["trial","line","phone"]
      },
      "faq_location": {
        "id": "faq_location", "type": "answer",
        "text": "我們在台中市烏日區，旭光國小旁邊！😊\n\n📍 烏日區健行北路 96 號\n\n另外，安親班有到學校集合接孩子的服務！\n放學時老師會到學校，把孩子一起帶回來 🚶\n不用擔心孩子自己在路邊等 😊",
        "cta": ["map","trial","line","phone"]
      },
      "quiz_welcome": {
        "id": "quiz_welcome", "type": "options",
        "text": "找題庫嗎？我來幫你！😊\n\n想找哪個科目的題目？",
        "options": [
          { "label": "📖 英文","next": "quiz_grade_en" },
          { "label": "🔢 數學","next": "quiz_grade_ma" }
        ]
      },
      "quiz_grade_en": {
        "id": "quiz_grade_en", "type": "options",
        "text": "幾年級的英文題庫？",
        "options": [
          { "label": "1 年級","next": "quiz_result_en_g1" },
          { "label": "2 年級","next": "quiz_result_en_g2" },
          { "label": "3 年級","next": "quiz_result_en_g3" },
          { "label": "4 年級","next": "quiz_result_en_g4" },
          { "label": "5 年級","next": "quiz_result_en_g5" },
          { "label": "6 年級","next": "quiz_result_en_g6" }
        ]
      },
      "quiz_grade_ma": {
        "id": "quiz_grade_ma", "type": "options",
        "text": "幾年級的數學題庫？",
        "options": [
          { "label": "1 年級","next": "quiz_result_ma_g1" },
          { "label": "2 年級","next": "quiz_result_ma_g2" },
          { "label": "3 年級","next": "quiz_result_ma_g3" },
          { "label": "4 年級","next": "quiz_result_ma_g4" },
          { "label": "5 年級","next": "quiz_result_ma_g5" },
          { "label": "6 年級","next": "quiz_result_ma_g6" }
        ]
      },
      "quiz_result_en_g1": {
        "id": "quiz_result_en_g1", "type": "quiz_result",
        "filter": { "subject": "en", "grade": "grade_1" },
        "text": "已幫你篩選「1 年級 / 英文」題庫 📖\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_en" },
          { "label": "換數學題庫", "next": "quiz_grade_ma" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_en_g2": {
        "id": "quiz_result_en_g2", "type": "quiz_result",
        "filter": { "subject": "en", "grade": "grade_2" },
        "text": "已幫你篩選「2 年級 / 英文」題庫 📖\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_en" },
          { "label": "換數學題庫", "next": "quiz_grade_ma" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_en_g3": {
        "id": "quiz_result_en_g3", "type": "quiz_result",
        "filter": { "subject": "en", "grade": "grade_3" },
        "text": "已幫你篩選「3 年級 / 英文」題庫 📖\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_en" },
          { "label": "換數學題庫", "next": "quiz_grade_ma" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_en_g4": {
        "id": "quiz_result_en_g4", "type": "quiz_result",
        "filter": { "subject": "en", "grade": "grade_4" },
        "text": "已幫你篩選「4 年級 / 英文」題庫 📖\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_en" },
          { "label": "換數學題庫", "next": "quiz_grade_ma" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_en_g5": {
        "id": "quiz_result_en_g5", "type": "quiz_result",
        "filter": { "subject": "en", "grade": "grade_5" },
        "text": "已幫你篩選「5 年級 / 英文」題庫 📖\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_en" },
          { "label": "換數學題庫", "next": "quiz_grade_ma" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_en_g6": {
        "id": "quiz_result_en_g6", "type": "quiz_result",
        "filter": { "subject": "en", "grade": "grade_6" },
        "text": "已幫你篩選「6 年級 / 英文」題庫 📖\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_en" },
          { "label": "換數學題庫", "next": "quiz_grade_ma" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_ma_g1": {
        "id": "quiz_result_ma_g1", "type": "quiz_result",
        "filter": { "subject": "ma", "grade": "grade_1" },
        "text": "已幫你篩選「1 年級 / 數學」題庫 🔢\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_ma" },
          { "label": "換英文題庫", "next": "quiz_grade_en" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_ma_g2": {
        "id": "quiz_result_ma_g2", "type": "quiz_result",
        "filter": { "subject": "ma", "grade": "grade_2" },
        "text": "已幫你篩選「2 年級 / 數學」題庫 🔢\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_ma" },
          { "label": "換英文題庫", "next": "quiz_grade_en" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_ma_g3": {
        "id": "quiz_result_ma_g3", "type": "quiz_result",
        "filter": { "subject": "ma", "grade": "grade_3" },
        "text": "已幫你篩選「3 年級 / 數學」題庫 🔢\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_ma" },
          { "label": "換英文題庫", "next": "quiz_grade_en" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_ma_g4": {
        "id": "quiz_result_ma_g4", "type": "quiz_result",
        "filter": { "subject": "ma", "grade": "grade_4" },
        "text": "已幫你篩選「4 年級 / 數學」題庫 🔢\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_ma" },
          { "label": "換英文題庫", "next": "quiz_grade_en" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_ma_g5": {
        "id": "quiz_result_ma_g5", "type": "quiz_result",
        "filter": { "subject": "ma", "grade": "grade_5" },
        "text": "已幫你篩選「5 年級 / 數學」題庫 🔢\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_ma" },
          { "label": "換英文題庫", "next": "quiz_grade_en" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_result_ma_g6": {
        "id": "quiz_result_ma_g6", "type": "quiz_result",
        "filter": { "subject": "ma", "grade": "grade_6" },
        "text": "已幫你篩選「6 年級 / 數學」題庫 🔢\n上面有符合的題目嗎？😊",
        "options": [
          { "label": "換個年級",   "next": "quiz_grade_ma" },
          { "label": "換英文題庫", "next": "quiz_grade_en" },
          { "label": "找不到我要的","next": "quiz_not_found" }
        ]
      },
      "quiz_not_found": {
        "id": "quiz_not_found", "type": "answer",
        "text": "😱 Mina 暫時翻不到這份題庫耶～\n\n題庫我們一直在更新！\n如果找不到你要的章節或題型，\n加 LINE 告訴老師，我們會幫你準備 😊",
        "cta": ["line","phone","trial"]
      },
      "archive_welcome": {
        "id": "archive_welcome", "type": "options",
        "text": "幫你查歷屆題庫！😊\n\n（近三個月以前的題目，最多顯示 36 題）\n\n先選科目：",
        "options": [
          { "label": "📖 英文", "next": "archive_grade_en", "setFilter": {"subject":"英文"} },
          { "label": "🔢 數學", "next": "archive_grade_ma", "setFilter": {"subject":"數學"} }
        ]
      },
      "archive_grade_en": {
        "id": "archive_grade_en", "type": "options",
        "text": "幾年級的英文？",
        "options": [
          { "label": "小一", "next": "archive_fetch", "setFilter": {"grade":"小一"} },
          { "label": "小二", "next": "archive_fetch", "setFilter": {"grade":"小二"} },
          { "label": "小三", "next": "archive_fetch", "setFilter": {"grade":"小三"} },
          { "label": "小四", "next": "archive_fetch", "setFilter": {"grade":"小四"} },
          { "label": "小五", "next": "archive_fetch", "setFilter": {"grade":"小五"} },
          { "label": "小六", "next": "archive_fetch", "setFilter": {"grade":"小六"} }
        ]
      },
      "archive_grade_ma": {
        "id": "archive_grade_ma", "type": "options",
        "text": "幾年級的數學？",
        "options": [
          { "label": "小一", "next": "archive_fetch", "setFilter": {"grade":"小一"} },
          { "label": "小二", "next": "archive_fetch", "setFilter": {"grade":"小二"} },
          { "label": "小三", "next": "archive_fetch", "setFilter": {"grade":"小三"} },
          { "label": "小四", "next": "archive_fetch", "setFilter": {"grade":"小四"} },
          { "label": "小五", "next": "archive_fetch", "setFilter": {"grade":"小五"} },
          { "label": "小六", "next": "archive_fetch", "setFilter": {"grade":"小六"} }
        ]
      },
      "archive_fetch": {
        "id": "archive_fetch", "type": "archive_fetch",
        "text": "查詢中，請稍候 🔍"
      },
      "archive_not_found": {
        "id": "archive_not_found", "type": "options",
        "text": "😊 這個範圍暫時沒有歷屆題目\n\n可以換個年級或科目看看嗎？",
        "options": [
          { "label": "換英文年級", "next": "archive_grade_en" },
          { "label": "換數學年級", "next": "archive_grade_ma" }
        ]
      },
      "archive_limit_reached": {
        "id": "archive_limit_reached", "type": "answer",
        "text": "📚 已顯示 36 題（歷屆題庫查詢上限）\n\n如果需要更多題目，歡迎直接聯絡老師！",
        "cta": ["line","phone","trial"]
      },
      "ans_en_e12": {
        "id": "ans_en_e12", "type": "answer",
        "text": "小一小二的英文，從這裡起步最剛好！🌱\n\n我們不急著塞單字給孩子背——\n而是先讓他「不怕開口說英文」。\n\n從聽說入手，帶入自然發音，\n讓英文從一開始就是有趣的事 🎉\n\n很多一開始說「英文好可怕」的孩子，\n試聽完都說「好想再來！」\n（真的不是廣告詞 😄）",
        "cta": ["trial","line","phone"],
        "articles": ["english"]
      },
      "ans_en_e34": {
        "id": "ans_en_e34", "type": "answer",
        "text": "中年級是打英文底子的黃金期！✨\n\n這個階段我們特別重視兩件事：\n📖 閱讀理解——不只是背單字，要真的讀懂句子\n📝 文法觀念——讓孩子開始理解英文的邏輯\n\n很多孩子來之前對英文沒什麼感覺，\n試聽完之後就開始期待上課了——\n老師到底用了什麼魔法我也不清楚 🤭",
        "cta": ["trial","line","phone"],
        "articles": ["english"]
      },
      "ans_en_e56": {
        "id": "ans_en_e56", "type": "answer",
        "text": "高年級英文，說實話——開始有壓力了 😤\n\n但壓力不是壞事！壓力代表孩子準備要跳躍了！\n\n我們這個階段主要做兩件事：\n📝 段考成績——先讓孩子建立「英文我也行！」的自信\n🚀 升國中準備——提早把底子打穩，升上去不慌張\n\n小班制、老師盯得近\n（溫柔地盯，不是兇那種 😂）",
        "cta": ["trial","line","phone"],
        "articles": ["english"]
      },
      "ans_en_jh": {
        "id": "ans_en_jh", "type": "answer",
        "text": "國中英文的挑戰是真的不小 😅\n\n文法、大量單字、閱讀、寫作... 一口氣全來！\n\n我們依程度小班分組，\n讓孩子和程度相近的同學一起學，\n進步速度通常快很多。\n\n老師也很懂「考試這件事」——\n哪裡會考、怎麼拿分，這種實戰感很重要 😏",
        "cta": ["trial","line","phone"],
        "articles": ["english"]
      },
      "ans_ma_e12": {
        "id": "ans_ma_e12", "type": "answer",
        "text": "從小把數學觀念弄清楚，以後真的省很多力氣！😊\n\n低年級數學，我們的方法是讓孩子「真的懂」，\n而不是死背步驟和公式。\n\n老師有辦法用孩子聽得懂的方式解釋，\n讓他們覺得「數學其實還好嘛！」——\n然後回家跟爸媽說「今天數學好好玩」😄\n（這種事真的有發生過）",
        "cta": ["trial","line","phone"],
        "articles": ["math"]
      },
      "ans_ma_e34": {
        "id": "ans_ma_e34", "type": "answer",
        "text": "中年級數學開始有點複雜了！📐\n\n分數、小數點、應用題——\n很多孩子卡關就卡在這裡。\n\n我們的做法是先拆解觀念，再練題目，\n讓孩子搞懂「為什麼這樣算」，不只是套公式。\n\n真正理解了，考試遇到變化題也不怕 💪",
        "cta": ["trial","line","phone"],
        "articles": ["math"]
      },
      "ans_ma_e56": {
        "id": "ans_ma_e56", "type": "answer",
        "text": "高年級數學，說實在話——是有點硬！😤\n\n面積、體積、比例... 觀念一個接一個，\n還沒搞懂前面就來後面，\n當然越積越多問號。\n\n我們這個階段主要做兩件事：\n🧩 把卡住的觀念逐一補起來\n🎯 針對段考重點加強，先讓成績穩住\n\n小班制的好處就是老師知道每個孩子卡在哪，\n直接針對那個點幫他解開！",
        "cta": ["trial","line","phone"],
        "articles": ["math"]
      },
      "ans_ma_jh": {
        "id": "ans_ma_jh", "type": "answer",
        "text": "🧮 國中數學嗎？\n\n哎呀～這題 Mina 差點答錯 😆\n\n目前我們有：\n✅ 徐薇英文（國小～國中）\n✅ 偉智數學（國小）\n\n國中數學目前還沒有開課喔～\n\n但別急著把考卷藏起來 🤭\n\n如果孩子是國中生，\n英文課程還是可以幫到會考、文法、閱讀理解喔 📚\n\n如果很多家長都敲碗，\n說不定哪天國中數學就真的出現了 👀",
        "cta": ["line","phone"],
        "articles": ["english"]
      },
      "ans_afterschool": {
        "id": "ans_afterschool", "type": "answer",
        "text": "安親班的日常是這樣的 😊\n\n🏫 放學集合：老師到學校把孩子一起帶回來\n   （不用擔心孩子自己在路邊等）\n🍱 點心時間：補充體力，準備念書\n📚 寫作業時段：固定時間，老師在旁邊顧著\n❓ 課業問題：直接問老師，不用等回家傷腦筋\n\n孩子放學後這段時間被顧好，\n家長上班也比較放心 😊\n\n目前安親服務適合國小 1–6 年級喔！",
        "cta": ["trial","line","phone"],
        "articles": ["afterschool"]
      },
      "ans_zhengyin": {
        "id": "ans_zhengyin", "type": "answer",
        "text": "正音班是為要升小一的孩子準備的！🌱\n\n每年八月開設，\n幫孩子在進小學前先熟悉注音、練習說話，\n讓第一天上課不怕不知所措 😊\n\n具體時間和報名資訊，\n建議直接加 LINE 或打電話給老師確認！\n（每年梯次可能稍有不同）",
        "cta": ["line","phone","trial"]
      },
      "global_pricing": {
        "id": "global_pricing", "type": "answer",
        "text": "💰 想了解費用嗎？\n\n嘿嘿～\n老實說，這大概是 Mina 被問最多次的問題第一名 🏆\n\n如果我直接報一個數字給你，\n老師等一下可能會追著我跑 🤣\n\n因為課程費用會依：\n📚 年級\n📚 科目\n📚 上課頻率\n📚 是否搭配安親\n...而有所不同。\n\n━━━━━━━━━━━━\n\n不過你放心 😊\n\n老師說明課程時，一定也會一起說明：\n✅ 課程規劃\n✅ 收費方式\n✅ 目前優惠方案\n✅ 適合孩子的班別\n\n不會有神秘價格，也不會有突然冒出來的費用 👌\n\n想用哪種方式了解呢？",
        "cta": ["trial","line","phone"]
      },
      "global_contact": {
        "id": "global_contact", "type": "answer",
        "text": "這個問題讓老師直接回答你最準確！😊\n\n老師很好說話的，\n不會有被催報名的壓力 😄\n\n選一個你最方便的方式：",
        "cta": ["line","phone","trial"]
      },
      "global_camp_zhengyin": {
        "id": "global_camp_zhengyin", "type": "answer",
        "text": "暑假 / 正音課程——\n\n☀️ 夏令營課程詳細資訊都在這裡！\n進去看完應該就清楚了 😊\n\n🌱 要升小一的孩子：\n每年八月我們會開設正音班，\n幫孩子在升小學前打好注音和說話的底子。\n\n詳細梯次和內容，\n進去看或直接問老師都可以！",
        "cta": ["line","phone"],
        "articles": ["camp"]
      },
      "global_other_subject": {
        "id": "global_other_subject", "type": "options",
        "text": "哇！你這題有點超出 Mina 的考試範圍了 😂\n\n目前我們主要提供：\n📖 英文課程　🔢 數學課程　🎒 安親服務\n\n至於其他科目，目前還沒有開課喔 🙈\n\n你最希望我們開什麼課呢？\n（告訴老師，說不定你就是促成新課程的關鍵人物 👀）",
        "options": [
          { "label": "🌿 自然", "next": "other_collected" },
          { "label": "🗺️ 社會","next": "other_collected" },
          { "label": "📝 國文", "next": "other_collected" },
          { "label": "🔮 其他", "next": "other_collected" }
        ]
      },
      "other_collected": {
        "id": "other_collected", "type": "answer",
        "text": "記下來了！😄\n\n我會偷偷轉告老師「有家長在敲碗」\n（希望有一天能讓你等到 🤞）\n\n在那之前，可以先看看我們目前有的課程：",
        "cta": ["line","phone"],
        "articles": ["english","math","afterschool"]
      },
      "unsure_grade": {
        "id": "unsure_grade", "type": "options",
        "text": "沒關係！這其實是最常見的狀況 😄\n\n「就是覺得孩子需要補，但不確定補什麼！」\n\n讓我先了解一下孩子的情形——\n他目前幾年級？",
        "options": [
          { "label": "🎒 國小 1–2 年級","next": "unsure_concern_e12" },
          { "label": "📚 國小 3–4 年級","next": "unsure_concern_e34" },
          { "label": "✏️ 國小 5–6 年級","next": "unsure_concern_e56" },
          { "label": "🎯 國中",          "next": "unsure_concern_jh" }
        ]
      },
      "unsure_concern_e12": {
        "id": "unsure_concern_e12", "type": "answer",
        "text": "不確定很正常！讓我給你個建議 😊\n\n對國小 1–2 年級的孩子來說：\n\n如果孩子放學後沒地方去，\n先考慮安親——穩定的學習環境很重要 🎒\n\n如果想加強科目，英文是最適合從小開始的，\n低年級打好底子，以後輕鬆很多 📖\n\n最準確的還是來試聽，讓老師直接評估！",
        "cta": ["trial","line","phone"],
        "articles": ["english","afterschool"]
      },
      "unsure_concern_e34": {
        "id": "unsure_concern_e34", "type": "answer",
        "text": "不確定很正常！😊\n\n中年級是個很重要的過渡期——\n英文和數學都開始有點難度，\n很多孩子就在這裡開始覺得「跟不上了」。\n\n我的建議：先來試聽，\n讓老師評估孩子哪裡最需要加強，\n再針對性地補——不用全部一起補，會太累 😅",
        "cta": ["trial","line","phone"],
        "articles": ["english","math"]
      },
      "unsure_concern_e56": {
        "id": "unsure_concern_e56", "type": "answer",
        "text": "不確定很正常！😊\n\n高年級是升國中前的關鍵衝刺期——\n英文和數學的觀念都在快速累積，\n有一科沒跟上，後面壓力就大了。\n\n我的建議：先來試聽，\n讓老師評估哪科最需要加強，\n有針對性地補，成效最好！",
        "cta": ["trial","line","phone"],
        "articles": ["english","math"]
      },
      "unsure_concern_jh": {
        "id": "unsure_concern_jh", "type": "answer",
        "text": "不確定很正常！😊\n\n國中階段，目前我們主要開設英文課程喔！\n\n國中英文對會考影響很大，\n文法、閱讀、寫作——老師都有幫孩子準備。\n\n要不要先來試聽，讓老師評估孩子的狀況？",
        "cta": ["trial","line","phone"],
        "articles": ["english"]
      }
    }
  };

  // ─── CTA 樣式對應 ───────────────────────────────
  var CTA_CLASSES = {
    trial: 'cta-primary',
    line:  'cta-line',
    phone: 'cta-secondary',
    map:   'cta-map'
  };

  // ─── 狀態 ────────────────────────────────────────
  var state = {
    currentNodeId: null,
    history: [],
    depth: 0,
    sessionId: getOrCreateSessionId(),
    archiveFilter: {}
  };

  var chatBody, isOpen = false;

  // ─── Session ID ──────────────────────────────────
  function getOrCreateSessionId() {
    try {
      var id = sessionStorage.getItem('mina_session');
      if (!id) {
        id = 'mina-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
        sessionStorage.setItem('mina_session', id);
      }
      return id;
    } catch (e) {
      return 'mina-' + Date.now();
    }
  }

  // ─── 頁面 flow 偵測 ──────────────────────────────
  function getFlowByUrl() {
    var rawPath = window.location.pathname;
    var path;
    try { path = decodeURIComponent(rawPath); } catch (e) { path = rawPath; }

    if (path.indexOf('course') !== -1 || path.indexOf('課程') !== -1) return 'course';
    if (path.indexOf('about') !== -1  || path.indexOf('關於') !== -1) return 'about';
    if (path.indexOf('news')  !== -1  || path.indexOf('消息') !== -1) return 'news';
    if (path.indexOf('faq')   !== -1  || path.indexOf('常見') !== -1) return 'faq';
    if (path.indexOf('quiz')  !== -1  || path.indexOf('練習') !== -1 ||
        path.indexOf('題庫')  !== -1  || path.indexOf('practice') !== -1) return 'quiz';
    return 'homepage';
  }

  // ─── DOM 建立 ────────────────────────────────────
  function createWidget() {
    var widget = document.createElement('div');
    widget.id = 'mina-widget';
    widget.innerHTML =
      '<button class="mina-fab" aria-label="開啟 Mina 小幫手" aria-expanded="false">' +
        '<span class="mina-fab-icon"><img src="assets/logo/zhuoyue-logo.svg" alt="Mina" style="width:30px;height:30px;object-fit:contain;display:block;"></span>' +
        '<span class="mina-fab-label">問 Mina</span>' +
      '</button>' +
      '<div class="mina-panel" role="dialog" aria-modal="true" aria-label="Mina 小幫手" hidden>' +
        '<div class="mina-panel-header">' +
          '<div class="mina-header-info">' +
            '<div class="mina-avatar-wrap"><img src="assets/logo/zhuoyue-logo.svg" alt="卓越" style="width:100%;height:100%;object-fit:contain;padding:4px;"></div>' +
            '<div class="mina-header-text">' +
              '<div class="mina-name">Mina 小幫手</div>' +
              '<div class="mina-status">線上回覆中</div>' +
            '</div>' +
          '</div>' +
          '<button class="mina-close" aria-label="關閉">✕</button>' +
        '</div>' +
        '<div class="mina-chat-body" id="mina-chat-body" role="log" aria-live="polite"></div>' +
        '<div class="mina-panel-footer">' +
          '<button class="mina-reset">↺ 重新開始</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(widget);

    chatBody = widget.querySelector('#mina-chat-body');

    widget.querySelector('.mina-fab').addEventListener('click', togglePanel);
    widget.querySelector('.mina-close').addEventListener('click', closePanel);
    widget.querySelector('.mina-reset').addEventListener('click', resetConversation);
  }

  function togglePanel() {
    if (isOpen) closePanel(); else openPanel();
  }

  function openPanel() {
    var panel = document.querySelector('.mina-panel');
    var fab = document.querySelector('.mina-fab');
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('open'); });
    fab.setAttribute('aria-expanded', 'true');
    isOpen = true;
    if (!state.currentNodeId || chatBody.children.length === 0) startConversation();
    else scrollToBottom();
  }

  function closePanel() {
    var panel = document.querySelector('.mina-panel');
    var fab = document.querySelector('.mina-fab');
    panel.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    isOpen = false;
    setTimeout(function () {
      if (!panel.classList.contains('open')) panel.hidden = true;
    }, 280);
  }

  // ─── 對話控制 ────────────────────────────────────
  function startConversation() {
    var flow = getFlowByUrl();
    var startNodeId = TREE.flows[flow] || TREE.flows['homepage'];
    state.currentNodeId = startNodeId;
    state.history = [];
    state.depth = 0;
    renderNode(startNodeId);
  }

  function resetConversation() {
    chatBody.innerHTML = '';
    state.currentNodeId = null;
    state.history = [];
    state.depth = 0;
    state.archiveFilter = {};
    startConversation();
  }

  // ─── 節點渲染 ────────────────────────────────────
  function renderNode(nodeId) {
    var node = TREE.nodes[nodeId];
    if (!node) {
      console.warn('[Mina] 找不到節點:', nodeId);
      return;
    }
    state.currentNodeId = nodeId;
    state.history.push(nodeId);
    state.depth++;

    if (node.text) addBubble(node.text);

    if (node.type === 'options') {
      addOptions(node.options);
    } else if (node.type === 'answer') {
      if (node.cta && node.cta.length) addCTAs(node.cta);
      if (node.articles && node.articles.length) addArticles(node.articles);
    } else if (node.type === 'quiz_result') {
      if (node.filter) dispatchQuizFilter(node.filter);
      if (node.options && node.options.length) addOptions(node.options);
    } else if (node.type === 'archive_fetch') {
      renderArchiveFetch(node);
      return;
    }

    scrollToBottom();
  }

  // ─── 泡泡元素 ────────────────────────────────────
  function addBubble(text) {
    var row = document.createElement('div');
    row.className = 'mina-msg-row';

    var avatar = document.createElement('div');
    avatar.className = 'mina-msg-avatar';
    avatar.textContent = '🌸';

    var bubble = document.createElement('div');
    bubble.className = 'mina-bubble';
    bubble.innerHTML = escHtml(text).replace(/\n/g, '<br>');

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatBody.appendChild(row);
    requestAnimationFrame(function () { row.classList.add('visible'); });
  }

  function addUserBubble(text) {
    var row = document.createElement('div');
    row.className = 'mina-msg-row user';
    var bubble = document.createElement('div');
    bubble.className = 'mina-bubble user';
    bubble.textContent = text;
    row.appendChild(bubble);
    chatBody.appendChild(row);
    requestAnimationFrame(function () { row.classList.add('visible'); });
  }

  // ─── 選項按鈕 ────────────────────────────────────
  function addOptions(options) {
    var wrap = document.createElement('div');
    wrap.className = 'mina-options';

    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'mina-opt-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', function () {
        if (opt.setFilter) {
          Object.keys(opt.setFilter).forEach(function (k) {
            state.archiveFilter[k] = opt.setFilter[k];
          });
        }
        addUserBubble(opt.label);
        wrap.querySelectorAll('.mina-opt-btn').forEach(function (b) {
          b.disabled = true;
          b.classList.add('selected');
        });
        btn.classList.add('chosen');
        setTimeout(function () { renderNode(opt.next); }, 300);
      });
      wrap.appendChild(btn);
    });

    chatBody.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('visible'); });
  }

  // ─── CTA 按鈕 ────────────────────────────────────
  function addCTAs(ctaKeys) {
    var wrap = document.createElement('div');
    wrap.className = 'mina-cta-wrap';

    ctaKeys.forEach(function (key) {
      var def = TREE.global.cta[key];
      if (!def) return;

      var a = document.createElement('a');
      a.className = 'mina-cta-btn ' + (CTA_CLASSES[key] || '');
      a.href = def.url;
      a.textContent = def.label;
      if (def.url.indexOf('http') === 0 || def.url.indexOf('#LINE') === 0) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      wrap.appendChild(a);

      if (key === 'line') {
        var note = document.createElement('div');
        note.className = 'mina-line-note';
        note.textContent = '平日 13:30–19:30 回覆較快，其他時間稍慢';
        wrap.appendChild(note);
      }
    });

    chatBody.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('visible'); });
  }

  // ─── 文章連結 ────────────────────────────────────
  function addArticles(articleKeys) {
    var wrap = document.createElement('div');
    wrap.className = 'mina-articles';

    var label = document.createElement('span');
    label.className = 'articles-label';
    label.textContent = '相關課程介紹';
    wrap.appendChild(label);

    articleKeys.forEach(function (key) {
      var def = TREE.global.articles[key];
      if (!def) return;
      var a = document.createElement('a');
      a.href = def.url;
      a.textContent = def.label;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      wrap.appendChild(a);
    });

    chatBody.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('visible'); });
  }

  // ─── Quiz 篩選事件 ───────────────────────────────
  function dispatchQuizFilter(filter) {
    try {
      document.dispatchEvent(new CustomEvent('minaQuizFilter', {
        detail: { subject: filter.subject, grade: filter.grade },
        bubbles: true
      }));
    } catch (e) { /* IE fallback ignored in V1 */ }

    var qcards = document.getElementById('qcards');
    if (qcards) {
      setTimeout(function () {
        qcards.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    }
  }

  // ─── Archive Fetch ───────────────────────────────
  var API_BASE = 'https://mina-api.hua19911027.workers.dev';

  function renderArchiveFetch(node) {
    state.currentNodeId = node.id;
    state.history.push(node.id);
    state.depth++;

    if (node.text) addBubble(node.text);

    var loadingRow = document.createElement('div');
    loadingRow.className = 'mina-msg-row';
    var loadingBubble = document.createElement('div');
    loadingBubble.className = 'mina-bubble';
    loadingBubble.innerHTML = '<span class="mina-loading-dots"><i></i><i></i><i></i></span>';
    loadingRow.appendChild(loadingBubble);
    chatBody.appendChild(loadingRow);
    scrollToBottom();

    var params = Object.assign({ page: 1, limit: 6 }, state.archiveFilter);

    fetch(API_BASE + '/api/v1/practice/archive?' + new URLSearchParams(params))
      .then(function (r) { return r.json(); })
      .then(function (json) {
        chatBody.removeChild(loadingRow);
        if (!json.ok || !json.data.questions.length) {
          renderNode('archive_not_found');
          return;
        }
        renderArchiveCards(json.data.questions);
        if (json.data.reachedLimit) {
          setTimeout(function () { renderNode('archive_limit_reached'); }, 200);
        } else {
          addOptions([
            { label: '換英文年級', next: 'archive_grade_en' },
            { label: '換數學年級', next: 'archive_grade_ma' },
            { label: '回主選單',   next: 'archive_welcome' }
          ]);
        }
        scrollToBottom();
      })
      .catch(function () {
        chatBody.removeChild(loadingRow);
        addBubble('抱歉，題庫暫時無法載入，請稍後再試 😅');
        addOptions([
          { label: '重新查詢', next: 'archive_fetch' },
          { label: '回主選單', next: 'archive_welcome' }
        ]);
        scrollToBottom();
      });
  }

  function renderArchiveCards(questions) {
    var wrap = document.createElement('div');
    wrap.className = 'mina-q-list';

    questions.forEach(function (q, i) {
      var card = document.createElement('div');
      card.className = 'mina-q-card';

      var header = document.createElement('button');
      header.className = 'mina-q-header';
      header.setAttribute('aria-expanded', 'false');
      header.innerHTML =
        '<span class="mina-q-number">Q' + (i + 1) + '</span>' +
        '<span class="mina-q-title">' + escHtml(q.question) + '</span>' +
        '<span class="mina-q-toggle">+</span>';

      var body = document.createElement('div');
      body.className = 'mina-q-body';
      body.hidden = true;

      var optLabels = ['A', 'B', 'C', 'D'];
      var optsHtml = '<div class="mina-q-options">' +
        q.options.map(function (o, j) {
          var letter = optLabels[j] || String(j + 1);
          var isAns = letter === q.answer;
          return '<div class="mina-q-opt' + (isAns ? ' correct' : '') + '">' +
            '<span class="mina-q-letter">' + letter + '</span>' +
            '<span>' + escHtml(o) + '</span>' +
            (isAns ? '<span class="mina-q-ans-badge">✓</span>' : '') +
            '</div>';
        }).join('') +
        '</div>';

      body.innerHTML = optsHtml +
        '<div class="mina-exp ok"><b>✓ 正確觀念</b><p>' + escHtml(q.explanation.concept) + '</p></div>' +
        '<div class="mina-exp err"><b>✕ 常見錯誤</b><p>' + escHtml(q.explanation.commonMistake) + '</p></div>' +
        '<div class="mina-exp tip"><b>★ 記憶提示</b><p>' + escHtml(q.explanation.memoryTip) + '</p></div>';

      header.addEventListener('click', function () {
        var expanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', String(!expanded));
        header.querySelector('.mina-q-toggle').textContent = expanded ? '+' : '×';
        body.hidden = expanded;
        scrollToBottom();
      });

      card.appendChild(header);
      card.appendChild(body);
      wrap.appendChild(card);
    });

    chatBody.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('visible'); });
  }

  // ─── Helpers ─────────────────────────────────────
  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollToBottom() {
    setTimeout(function () {
      if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 60);
  }

  // ─── 初始化 ──────────────────────────────────────
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        createWidget();
        exposeApi();
      });
    } else {
      createWidget();
      exposeApi();
    }
  }

  function exposeApi() {
    window.minaWidget = {
      open:  openPanel,
      close: closePanel,
      reset: resetConversation,
      openToNode: function (nodeId) {
        openPanel();
        if (nodeId) {
          chatBody.innerHTML = '';
          state.currentNodeId = null;
          state.history = [];
          state.depth = 0;
          state.archiveFilter = {};
          renderNode(nodeId);
        }
      }
    };
  }

  init();
})();
