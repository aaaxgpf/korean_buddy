const fs = require('fs');

function replaceAll(file) {
  let text = fs.readFileSync(file, 'utf-8');
  
  // GrammarView
  text = text.replace(/동사\+종결어미 \(动词\+意向终结词尾\)/g, "Verb + Ending");
  text = text.replace(/서술어 \(谓语\)/g, "Predicate");
  text = text.replace(/要去吗\/好吗？/g, "shall we go?");
  text = text.replace(/目的连接词尾 \(去做某事\)/g, "Purpose Conjunctive Ending (to go do)");
  text = text.replace(/表示去或来某地的具体目的/g, "Indicates the specific purpose of going or coming to a place");
  text = text.replace(/词干有收音用 -으러 가다 \(먹다 -> 먹으러 가다\)；无收音用 -러 가다 \(보다 -> 보러 가다\)/g, "With batchim: -으러 가다; Without batchim: -러 가다");
  text = text.replace(/提议\/意向疑问词尾 \(要不要\/好吗\)/g, "Propositive/Intentional Interrogative Ending");
  text = text.replace(/在日常口语中亲切地询问对方的意向，或提出一起做某事的提议/g, "Friendly inquiry about intention or proposal in daily conversation");
  text = text.replace(/词干无收音\/ㄹ收音用 -ㄹ래요\?；有收音用 -을래요\?/g, "Without batchim: -ㄹ래요?; With batchim: -을래요?");
  text = text.replace(/连音法则 \(연음\)/g, "Liaison (연음)");
  text = text.replace(/激音化法则 \(격음화: ㄷ \+ ㅎ -> ㅌ\)/g, "Aspiration (격음화)");
  text = text.replace(/日常亲近礼貌口语 \(해요체\)，语气非常亲切自然，非常适合朋友、伴学搭子或偶像日常交流。/g, "Friendly and polite spoken language (해요체).");
  text = text.replace(/平语/g, "Casual form");
  text = text.replace(/同龄朋友\/亲近平语 \(반말\)/g, "Casual speech (반말)");
  text = text.replace(/今晚去吃泡菜汤不？/g, "Wanna go eat kimchi stew tonight?");
  text = text.replace(/格式体极敬语/g, "Formal high honorific");
  text = text.replace(/正式职场\/商务礼仪敬语/g, "Formal/Business honorific");
  text = text.replace(/请问您今晚是否愿意一同前往品尝泡菜汤？/g, "Would you like to go eat kimchi stew this evening?");
  text = text.replace(/智能拆解/g, "AI Breakdown");
  text = text.replace(/语法库/g, "Grammar Library");
  text = text.replace(/输入韩语sentences\.\.\./g, "Enter Korean sentences...");
  text = text.replace(/解析中\.\.\./g, "Analyzing...");
  text = text.replace(/拆解/g, "Breakdown");
  text = text.replace(/示例:/g, "Example:");
  text = text.replace(/标准发音朗读/g, "Pronounce");
  text = text.replace(/实际真实发音与连音变音规则 \(Phonological Rules\)/g, "Phonological Rules");
  text = text.replace(/形态素与成分逐字逐词拆解 \(Morphemic Analysis\)/g, "Morphemic Analysis");
  text = text.replace(/语节\/词汇 \(Token\)/g, "Token");
  text = text.replace(/词性 \(POS\)/g, "POS");
  text = text.replace(/句中成分 \(Role\)/g, "Role");
  text = text.replace(/中文含义/g, "Meaning");
  text = text.replace(/核心语法公式与接续规则 \(Grammar Formulas\)/g, "Grammar Formulas");
  text = text.replace(/功能:/g, "Function:");
  text = text.replace(/接续规则:/g, "Formation:");
  text = text.replace(/语境与敬语级别说明:/g, "Context & Honorifics:");
  text = text.replace(/不同语境下的地道替换表达 \(Natural Variations\)/g, "Natural Variations");
  text = text.replace(/搜索语法公式、关键词 \(例: -\(으\)ㄹ 수 있다, 助词, 愿望\.\.\.\)/g, "Search grammar...");
  text = text.replace(/全部分类/g, "All");
  text = text.replace(/助词/g, "Particle");
  text = text.replace(/终结词尾/g, "Ending");
  text = text.replace(/意图愿望/g, "Intention");
  text = text.replace(/惯用句型/g, "Idiom");
  text = text.replace(/连接词尾/g, "Conjunction");
  text = text.replace(/已Save/g, "Saved");
  text = text.replace(/Save此语法/g, "Save Grammar");
  text = text.replace(/📌 接续规则 \(Formation\):/g, "📌 Formation:");
  text = text.replace(/Examples与双语对照 \(Examples\):/g, "Examples:");
  text = text.replace(/⚠️ 常见混淆避坑:/g, "⚠️ Common Mistakes:");

  // SpeakingView
  text = text.replace(/您的浏览器不支持语音识别API，已自动填入模拟语音用于评分测试。/g, "Browser does not support Speech API, using mock data.");
  text = text.replace(/发音非常地道！连音与语调自然流畅，很有韩剧主角和偶像对话的感觉！/g, "Very natural pronunciation!");
  text = text.replace(/初声与元音非常标准/g, "Initial and vowel are very accurate");
  text = text.replace(/와! (.*?), 발음 진짜 대박이야! 완전 감동했어~ \(哇！发音真的太绝了，完全被你感动到了～\)/g, "Wow! $1, your pronunciation is amazing!");
  
  // NotebookView
  text = text.replace(/Save对话/g, "Saved Chat");
  text = text.replace(/条/g, "items");
  text = text.replace(/vocabulary卡片/g, "Vocab Cards");
  text = text.replace(/词/g, "words");
  text = text.replace(/精选语法/g, "Grammar");
  text = text.replace(/重点vocabulary/g, "Vocab");
  text = text.replace(/核心语法/g, "Grammar");
  text = text.replace(/暂无Save的对话。在伴学聊天时点击书签按钮即可Save精彩回复！/g, "No saved chats. Click the bookmark icon in chat to save!");
  text = text.replace(/ 的对话/g, "'s Chat");
  text = text.replace(/语音播放/g, "Play audio");
  text = text.replace(/包含重点词汇:/g, "Core vocab:");
  text = text.replace(/💡 解析:/g, "💡 Tip:");
  text = text.replace(/Vocab还是Empty的。在聊天或词汇库中点击加号\/书签即可保存！/g, "Notebook is empty. Save items from chat or study modules!");
  text = text.replace(/发音/g, "Pronunciation");
  text = text.replace(/移出Vocab/g, "Remove from Notebook");
  text = text.replace(/例:/g, "Ex:");
  text = text.replace(/暂无Save的语法。在语法库中点击书签按钮即可一键Save！/g, "No saved grammar yet.");
  text = text.replace(/移出Save/g, "Remove");
  text = text.replace(/接续:/g, "Formation:");

  fs.writeFileSync(file, text, 'utf-8');
}

['src/components/GrammarView.tsx', 'src/components/SpeakingView.tsx', 'src/components/NotebookView.tsx'].forEach(replaceAll);

