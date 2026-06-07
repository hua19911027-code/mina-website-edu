const QDATA={
  en:{
    '觀念拆解':[
      {q:'have been to 和 have gone to 差在哪？',ok:'have been to＝「去過」（人已經回來了）；have gone to＝「去了」（人還在那裡沒回來）。',err:'把兩者當同義字，導致語意整個顛倒。',tip:'been＝back 回來了；gone＝走了還沒回。'},
      {q:'a 和 an 到底怎麼分？',ok:'看「發音」不是看字母：母音開頭用 an，子音開頭用 a。',err:'只看拼字，忽略 an hour、a university 這種例外。',tip:'念念看，嘴巴張開（母音）就用 an。'},
      {q:'some 和 any 怎麼用？',ok:'肯定句多用 some；否定句與疑問句多用 any。',err:'不分句型，一律用 some 或一律用 any。',tip:'問句、否定→any；其餘→some。'},
    ],
    '錯題診斷':[
      {q:'為什麼 He don\'t like 是錯的？',ok:'主詞第三人稱單數，助動詞要用 doesn\'t，後面動詞回原形：He doesn\'t like。',err:'主詞單複數沒判斷，don\'t / doesn\'t 混用。',tip:'他、她、它（單數）配 doesn\'t。'},
      {q:'Yesterday I go to school 哪裡錯？',ok:'有過去時間 yesterday，動詞要用過去式：went。',err:'看到 yesterday 仍用原形 go。',tip:'出現 yesterday、last… 就換過去式。'},
      {q:'much 和 many 老是用錯？',ok:'many 接可數名詞複數，much 接不可數名詞。',err:'寫成 many money、much books。',tip:'數得出來→many，數不出來→much。'},
    ],
    '考前清單':[
      {q:'段考前一週英文該複習什麼？',ok:'先掃單字與片語，再回頭看課文文法重點，最後做一份模擬題抓手感。',err:'只背單字不看文法，題目換句型就答不出來。',tip:'單字→文法→題目，三步驟順序別顛倒。'},
      {q:'to V 和 V-ing 怎麼選？',ok:'不同動詞固定接法不同，want to do、enjoy doing 要分開記。',err:'全部用同一種接法硬套。',tip:'把常見動詞分兩袋背：接 to / 接 -ing。'},
      {q:'時態總是搞混？',ok:'先確定句子的「時間點」，再決定用哪個時態。',err:'只看中文翻譯硬套時態。',tip:'找句中的時間副詞當線索。'},
    ],
    '資源整理':[
      {q:'課後想自己練習，有推薦的方向嗎？',ok:'從課本單元延伸，每天 15 分鐘聽讀，比週末一次衝兩小時有效。',err:'臨時抱佛腳，平常完全不碰英文。',tip:'少量多餐，天天一點點。'},
      {q:'單字老是背了就忘？',ok:'用句子記單字，把字放進情境一起記。',err:'只背中英對照表，背完就忘。',tip:'一個字配一個例句。'},
      {q:'聽力怎麼練最有效？',ok:'挑聽得懂約八成的素材，反覆聽同一段。',err:'一直換新教材，每段都只聽一次。',tip:'重複聽熟，比聽得多更有用。'},
    ],
  },
  ma:{
    '觀念拆解':[
      {q:'為什麼「負負得正」？',ok:'把「負」想成「相反方向」，相反的相反就轉回原本的方向，所以變正。',err:'死背口訣卻不懂方向意義，遇到變化題就卡住。',tip:'「敵人的敵人，是朋友」。'},
      {q:'分數除法為什麼要「顛倒相乘」？',ok:'除以一個數＝乘以它的倒數，所以把除數分子分母對調再相乘。',err:'把被除數也一起顛倒，整題算錯。',tip:'只翻「後面那個」，前面不動。'},
      {q:'任何數的 0 次方為什麼是 1？',ok:'由次方相除規律：aⁿ÷aⁿ=a⁰=1（a≠0）。',err:'誤以為 0 次方等於 0。',tip:'相同底數相除，指數相減。'},
    ],
    '錯題診斷':[
      {q:'計算 -3² 為什麼不是 9？',ok:'-3² 是 -(3×3)=-9；要得到 9 必須寫成 (-3)²。',err:'忽略次方優先於負號，少了括號就算錯。',tip:'沒括號，負號站旁邊看戲，先算次方。'},
      {q:'去括號 -(a-b) 會變什麼？',ok:'負號要分配到每一項：-(a-b)=-a+b。',err:'只變第一項符號，寫成 -a-b。',tip:'負號要「雨露均霑」每一項。'},
      {q:'移項常常忘了變號？',ok:'移到等號另一邊：加變減、乘變除。',err:'直接把項搬過去卻沒變號。',tip:'過橋（等號）就要換裝（變號）。'},
    ],
    '考前清單':[
      {q:'數學段考前怎麼準備最有效？',ok:'先重做考卷上錯過的題，再練同類型變化題，最後限時模擬一次。',err:'一直做會的題目刷成就感，難題反而沒碰。',tip:'專攻錯題，不重複舒適圈。'},
      {q:'幾何證明不知從何下手？',ok:'先標出已知與要證的，找對應的定理把它們連起來。',err:'只在腦中空想，不動手畫圖。',tip:'先把已知條件標在圖上。'},
      {q:'應用題讀不懂？',ok:'圈出關鍵數字與問句，設未知數再列式。',err:'還沒讀完題目就急著算。',tip:'把文字一句一句翻成算式。'},
    ],
    '資源整理':[
      {q:'觀念聽得懂但一考就忘怎麼辦？',ok:'聽懂後當天自己重算一次，並用自己的話寫下「為什麼」。',err:'只看老師解，從沒自己動筆算。',tip:'手寫一遍，勝過看十遍。'},
      {q:'計算常常粗心？',ok:'養成「回代檢查」習慣，把答案帶回題目驗算。',err:'算完就交，從不檢查。',tip:'最後留兩分鐘回頭驗算。'},
      {q:'公式記不熟？',ok:'理解公式怎麼推來的，比硬背更牢。',err:'只背結果不懂推導。',tip:'自己推一次，記得最久。'},
    ],
  },
};
const AppState={subj:'en',chip:'觀念拆解'};
(function(){
  const qcards=document.getElementById('qcards');
  if(!qcards)return;
  function renderQ(){
    const list=(QDATA[AppState.subj]&&QDATA[AppState.subj][AppState.chip])||[];
    if(!list.length){qcards.innerHTML='<p style="text-align:center;color:var(--ink-mute);padding:30px;">這個分類的題目即將上線，敬請期待 ✦</p>';return;}
    qcards.innerHTML=list.map((d,i)=>`
      <details class="qcard"${i===0?' open':''}>
        <summary><span class="qnum">${i+1}</span>${d.q}<span class="plus">+</span></summary>
        <div class="qbody">
          <div class="qseg ok"><div class="st">✓ 正確觀念</div><div class="sx">${d.ok}</div></div>
          <div class="qseg err"><div class="st">✕ 常見錯誤</div><div class="sx">${d.err}</div></div>
          <div class="qseg tip"><div class="st">★ 記憶提示</div><div class="sx">${d.tip}</div></div>
        </div>
      </details>`).join('');
  }
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');AppState.subj=t.dataset.subj;renderQ();
  }));
  document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');AppState.chip=c.dataset.chip;renderQ();
  }));
  renderQ();

  // Mina widget quiz filter: 收到科目篩選事件時切換 subject tab
  document.addEventListener('minaQuizFilter', function (e) {
    var subj = e.detail && e.detail.subject;
    if (!subj) return;
    var tab = document.querySelector('.tab[data-subj="' + subj + '"]');
    if (tab) tab.click();
  });
})();
