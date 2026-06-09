/* faq.js — FAQ Accordion + Category Filter */

(function () {
  'use strict';

  /* ── FAQ data — V2.2 Final ── */
  var FAQ_LOCAL = [
    /* 🎧 試聽與報名 */
    {category:'試聽與報名',question:'怎麼預約免費試聽？😊',answer:'超簡單！填網站表單、打電話，或直接找 Mina 小幫手都可以。先認識孩子，再安排適合的班級。畢竟選課程跟買鞋子一樣，合腳最重要 👟✨'},
    {category:'試聽與報名',question:'免費試聽真的不用錢嗎？💰',answer:'真的不用！😆 先體驗、先看看、先感受。孩子喜歡、家長放心，再決定也不遲 ❤️'},
    {category:'試聽與報名',question:'試聽要準備什麼？🎒',answer:'人來就好！如果有最近的考卷、作業或課本，也歡迎一起帶來。老師常常一眼就能找到孩子卡關的地方 🔍'},
    {category:'試聽與報名',question:'試聽多久呢？⏰',answer:'會依班級安排實際體驗課程。比起聽介紹，親自坐進教室感受最準！'},
    {category:'試聽與報名',question:'家長可以一起參觀嗎？🏫',answer:'當然可以！很多家長看完環境後，心裡的大石頭就先放下一半了 😊'},
    {category:'試聽與報名',question:'第一次需要測驗嗎？📝',answer:'有時會做簡單程度了解，不是考試啦 😄 只是幫老師找到最適合孩子的位置。'},
    {category:'試聽與報名',question:'可以中途插班嗎？✨',answer:'可以喔！很多孩子都是學期中加入的。我們會協助安排，不用擔心一進教室就滿頭問號 😆'},
    {category:'試聽與報名',question:'報名後多久能上課？📅',answer:'通常很快就能安排，實際依班級名額而定。'},
    {category:'試聽與報名',question:'有報名費嗎？',answer:'依課程規劃說明。我們最怕家長霧煞煞，所以一定會講清楚 😊'},
    {category:'試聽與報名',question:'學費怎麼計算？',answer:'依課程與年級不同而有所差異。歡迎直接詢問，我們很樂意說明。'},
    /* 📚 課程與分班 */
    {category:'課程與分班',question:'有哪些課程？📖',answer:'徐薇英文、偉智數學、安親課輔、正音班、寒暑假營隊和特色課程，一次滿足孩子不同階段需求。'},
    {category:'課程與分班',question:'英文和數學一定要一起上嗎？🤔',answer:'不用喔！每個孩子的需求都不同，可以自由搭配。'},
    {category:'課程與分班',question:'如何分班？📚',answer:'老師會參考年級、程度與學習狀況安排。適合比什麼都重要。'},
    {category:'課程與分班',question:'孩子成績不理想，還有機會嗎？🥺',answer:'這題幾乎每天都有人問！很多孩子剛來時也沒什麼信心，但找到真正卡住的地方後，進步往往比想像中快 💪✨'},
    {category:'課程與分班',question:'程度落後跟得上嗎？🌱',answer:'我們不怕起點慢，只怕放棄。一步一步來，比一次衝太快更重要。'},
    {category:'課程與分班',question:'程度太好會不會太簡單？🚀',answer:'老師也會評估孩子能力，安排更有挑戰性的學習內容。'},
    {category:'課程與分班',question:'一班大概幾位學生？👨‍🏫',answer:'採小班教學，希望老師叫得出每個孩子的名字，也看得到每個孩子的進步。'},
    {category:'課程與分班',question:'孩子不喜歡英文怎麼辦？😅',answer:'很多孩子不是討厭英文，而是曾經一直聽不懂。當理解變多，笑容通常也會變多 ❤️'},
    {category:'課程與分班',question:'數學不是不會，就是一直粗心！😵',answer:'偷偷告訴你，粗心很多時候只是結果。真正原因可能藏在觀念、習慣或閱讀速度裡，我們會陪孩子一起找出來 🔍'},
    {category:'課程與分班',question:'孩子坐不住怎麼辦？😂',answer:'放心，我們看過很多電力滿格的小朋友 ⚡ 慢慢建立學習習慣，比硬壓著坐更有效。'},
    {category:'課程與分班',question:'多久看得到進步？📈',answer:'每個孩子不同，但穩定學習一定比臨時抱佛腳有效。'},
    {category:'課程與分班',question:'有補課制度嗎？',answer:'依課程安排而定，我們會盡量協助孩子跟上進度。'},
    {category:'課程與分班',question:'請假怎麼辦？🤒',answer:'通知老師就可以，好好休息最重要。'},
    {category:'課程與分班',question:'正音班適合誰？🔤',answer:'幼大到國小低年級最適合，是建立語文基礎的重要階段。'},
    {category:'課程與分班',question:'孩子不敢發問怎麼辦？🙋',answer:'老師會透過互動慢慢建立自信，讓孩子從敢開口開始。'},
    /* 🎒 安親與接送 */
    {category:'安親與接送',question:'有課後安親班嗎？🎒',answer:'有喔！除了作業督導，也會照顧孩子放學後的學習與生活。'},
    {category:'安親與接送',question:'老師會檢查作業嗎？✏️',answer:'會，而且不只是檢查。我們更在意孩子知不知道自己為什麼錯 😊'},
    {category:'安親與接送',question:'離旭光國小遠嗎？🚶',answer:'真的很近！近到很多孩子放學後直接走路就到了 😄'},
    {category:'安親與接送',question:'接送方便嗎？🚗',answer:'非常方便，家長接送不用繞來繞去。'},
    {category:'安親與接送',question:'最晚可以到幾點？⏰',answer:'依課程安排說明，可直接詢問老師。'},
    {category:'安親與接送',question:'孩子生病怎麼辦？🤒',answer:'先休息最重要！健康永遠排第一。'},
    {category:'安親與接送',question:'家長臨時晚到接送怎麼辦？',answer:'別緊張，先通知老師。我們會協助照顧孩子。'},
    {category:'安親與接送',question:'有用餐安排嗎？🍱',answer:'依班別安排說明。'},
    {category:'安親與接送',question:'安全方面會特別注意嗎？❤️',answer:'當然！孩子的安全永遠是第一優先。'},
    /* ☀️ 營隊與特色課程 */
    {category:'營隊與特色課程',question:'寒暑假有課程嗎？🌞',answer:'有喔！夏令營、冬令營、學科加強課程都會陸續規劃。'},
    {category:'營隊與特色課程',question:'夏令營適合哪些孩子？🎉',answer:'如果你的孩子精力很多、問題很多、好奇心更多，那通常都很適合 😆'},
    {category:'營隊與特色課程',question:'校外生也可以參加嗎？👋',answer:'部分活動可以，歡迎來詢問。'},
    {category:'營隊與特色課程',question:'除了英數還有其他活動嗎？🎨',answer:'有閱讀活動、主題探索、節慶活動等，學習不該只有課本。'},
    {category:'營隊與特色課程',question:'冬令營也會開嗎？❄️',answer:'會依年度規劃公告。'},
    {category:'營隊與特色課程',question:'活動資訊去哪裡看？✨',answer:'最新消息、LINE 官方帳號或 Mina 小幫手都找得到。'},
    {category:'營隊與特色課程',question:'不知道要選哪個課程怎麼辦？🤔',answer:'直接找我們聊聊！老師最擅長幫家長一起分析孩子需求 ❤️'},
  ];

  var allFaqs = [];
  var curCat = '全部';

  /* ── FAQ load — V1 uses local data directly ── */
  function loadFaq() {
    allFaqs = FAQ_LOCAL;
    renderFAQ();
  }

  function renderFAQ() {
    var list = document.getElementById('faqList');
    if (!list) return;
    var items = allFaqs.filter(function (f) {
      return curCat === '全部' || f.category === curCat;
    });
    if (!items.length) {
      list.innerHTML = '<p style="text-align:center;color:var(--ink-mute);padding:40px 0">此分類暫無問題 😊</p>';
      return;
    }
    list.innerHTML = items.map(function (f, i) {
      return '<details class="qcard faq-item"' + (i === 0 ? ' open' : '') + '>' +
        '<summary><span class="qnum">Q</span>' + escHtml(f.question) + '<span class="plus">+</span></summary>' +
        '<div class="qbody"><p>' + escHtml(f.answer) + '</p></div>' +
        '</details>';
    }).join('');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initCatFilter() {
    document.querySelectorAll('#faqCats .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('#faqCats .chip').forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        curCat = c.dataset.cat;
        renderFAQ();
      });
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    loadFaq();
    initCatFilter();
  });

}());
