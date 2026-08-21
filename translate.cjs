const fs = require('fs');

function replaceAll(file) {
  let text = fs.readFileSync(file, 'utf-8');
  
  // FlashcardsView specific
  text = text.replace(/명사 \(名词\)/g, "Noun");
  text = text.replace(/自定义 Custom/g, "Custom");
  text = text.replace(/翻卡模式/g, "Cards");
  text = text.replace(/词表视图/g, "List");
  text = text.replace(/快速测验/g, "Quiz");
  text = text.replace(/听写拼写/g, "Dictation");
  text = text.replace(/添加生词/g, "Add Word");
  text = text.replace(/搜索词汇\.\.\./g, "Search...");
  text = text.replace(/仅看已收藏/g, "Only Saved");
  text = text.replace(/全部词书/g, "All Lists");
  text = text.replace(/TOPIK初级词书/g, "TOPIK Beginner");
  text = text.replace(/TOPIK中级词书/g, "TOPIK Intermediate");
  text = text.replace(/TOPIK高级词书/g, "TOPIK Advanced");
  text = text.replace(/延世大经典词书/g, "Yonsei Vocab");
  text = text.replace(/首尔大经典词书/g, "SNU Vocab");
  text = text.replace(/K-POP饭圈词书/g, "K-POP Vocab");
  text = text.replace(/日常口语词汇/g, "Daily Vocab");
  text = text.replace(/暂无符合筛选条件的词汇卡片/g, "No vocabulary matches your filters.");
  text = text.replace(/暂无符合条件的词汇/g, "No matching vocabulary.");
  text = text.replace(/重置所有筛选/g, "Reset Filters");
  text = text.replace(/张卡片/g, "cards");
  text = text.replace(/第 /g, ""); // "Card X / Y cards" -> just numbers
  text = text.replace(/背面：详细释义与例句 \(Definitions & Examples\)/g, "Back: Definitions & Examples");
  text = text.replace(/正面：韩语与发音 \(Hangul & Pronunciation\)/g, "Front: Hangul & Pronunciation");
  text = text.replace(/单词标准发音/g, "Pronunciation");
  text = text.replace(/收藏到生词本/g, "Save to Notebook");
  text = text.replace(/词源\/汉字:/g, "Origin/Hanja:");
  text = text.replace(/点击卡片任意处翻转查看中英释义与例句/g, "Click anywhere to flip the card for definitions and examples.");
  text = text.replace(/中文:/g, "Meaning:");
  text = text.replace(/中文释义/g, "Meaning");
  text = text.replace(/上一个词/g, "Previous");
  text = text.replace(/下一个词/g, "Next");
  text = text.replace(/没记住/g, "Forgot");
  text = text.replace(/较模糊/g, "Unsure");
  text = text.replace(/已掌握/g, "Mastered");
  text = text.replace(/不认识/g, "Don't know");
  text = text.replace(/认识/g, "Know");
  text = text.replace(/共 (.*?) 个词汇条目/g, "$1 Vocabulary Items");
  text = text.replace(/单词 \(Hangul\)/g, "Word (Hangul)");
  text = text.replace(/词性\/分类/g, "Type/Category");
  text = text.replace(/掌握状态/g, "Mastery");
  text = text.replace(/操作/g, "Actions");
  text = text.replace(/学习中/g, "Learning");
  text = text.replace(/新词/g, "New");
  text = text.replace(/朗读发音/g, "Pronunciation");
  text = text.replace(/收藏/g, "Save");
  text = text.replace(/当前得分:/g, "Score:");
  text = text.replace(/进度:/g, "Progress:");
  text = text.replace(/请选出正确的释义/g, "Select the correct meaning");
  text = text.replace(/下一题/g, "Next Question");
  text = text.replace(/请选择包含至少2个词汇的分类开始测验/g, "Please select a category with at least 2 words to start the quiz.");
  text = text.replace(/默写词汇/g, "Write Word");
  text = text.replace(/点击播放韩语发音/g, "Click to play pronunciation");
  text = text.replace(/提示:/g, "Hint:");
  text = text.replace(/默写韩语单词/g, "Type the Korean word");
  text = text.replace(/在此输入单词\.\.\./g, "Type here...");
  text = text.replace(/正确答案/g, "Correct Answer");
  text = text.replace(/下一个/g, "Next");
  text = text.replace(/提交校验/g, "Submit Answer");
  text = text.replace(/添加自定义生词/g, "Add Custom Word");
  text = text.replace(/韩文单词 \(Hangul\) \*/g, "Korean Word (Hangul) *");
  text = text.replace(/中文释义 \*/g, "Meaning *");
  text = text.replace(/韩文例句/g, "Example Sentence");
  text = text.replace(/例句翻译/g, "Example Translation");
  text = text.replace(/取消/g, "Cancel");
  text = text.replace(/保存生词/g, "Save Word");
  
  // GrammarView
  text = text.replace(/按难度等级筛选：/g, "Filter by difficulty:");
  text = text.replace(/全部等级/g, "All Levels");
  text = text.replace(/初级/g, "Beginner");
  text = text.replace(/中级/g, "Intermediate");
  text = text.replace(/高级/g, "Advanced");
  text = text.replace(/语法模式/g, "Grammar Form");
  text = text.replace(/用法解析/g, "Explanation");
  text = text.replace(/例句/g, "Examples");
  text = text.replace(/对比\/注意点/g, "Comparison / Notes");
  text = text.replace(/暂无对应的语法点。/g, "No grammar points found.");
  text = text.replace(/加入笔记本/g, "Save to Notebook");
  text = text.replace(/已加入笔记本/g, "Saved to Notebook");

  // DictationView
  text = text.replace(/逐字比对 \(Character Breakdown\):/g, "Character Breakdown:");
  text = text.replace(/空/g, "Empty");
  text = text.replace(/连音与发音要点:/g, "Phonetics & Pronunciation:");
  text = text.replace(/收藏此句/g, "Save Sentence");

  // SpeakingView
  text = text.replace(/发音点评:/g, "Pronunciation Feedback:");
  text = text.replace(/练习下一个情境/g, "Next Scenario");
  text = text.replace(/正在倾听你的发音\.\.\. 请清晰朗读上方韩语句子/g, "Listening... Please read the sentence clearly.");
  text = text.replace(/点击麦克风开始口语录音/g, "Tap microphone to record.");
  text = text.replace(/实时识别你的韩语发音并生成 AI 专属纠音报告/g, "Real-time speech recognition and AI evaluation.");
  text = text.replace(/实时语音识别结果 \(Your Spoken Transcript\):/g, "Your Spoken Transcript:");
  text = text.replace(/AI 评分中\.\.\./g, "Evaluating...");
  text = text.replace(/提交 AI 发音多维评分/g, "Submit for AI Evaluation");
  text = text.replace(/综合发音与语调测评得分/g, "Overall Pronunciation & Intonation Score");
  text = text.replace(/发音极其地道！太完美了！🌟/g, "Excellent pronunciation! 🌟");
  text = text.replace(/发音良好！再接再厉！👏/g, "Good job! 👏");
  text = text.replace(/继续加油练习！掌握技巧就会更棒！💪/g, "Keep practicing! 💪");
  text = text.replace(/准确度 \(Accuracy\)/g, "Accuracy");
  text = text.replace(/流畅度 \(Fluency\)/g, "Fluency");
  text = text.replace(/语调抑扬 \(Intonation\)/g, "Intonation");
  text = text.replace(/来自伴学伙伴【(.*?)】的专属打气:/g, "Cheering message from $1:");
  text = text.replace(/听示范发音 \((.*?)\)/g, "Listen to Model ($1)");
  text = text.replace(/核心句型:/g, "Core Grammar:");
  
  // NotebookView
  text = text.replace(/生词本/g, "Vocab");
  text = text.replace(/保存的句子/g, "Sentences");
  text = text.replace(/语法点/g, "Grammar");
  text = text.replace(/错题本/g, "Mistakes");
  text = text.replace(/还没有保存任何(.*?)/g, "You haven't saved any $1 yet.");
  text = text.replace(/生词/g, "vocabulary");
  text = text.replace(/句子/g, "sentences");
  text = text.replace(/在学习或聊天中遇到值得记录的内容时，点击收藏图标即可在这里复习。/g, "Click the save icon when learning or chatting to review them here.");
  text = text.replace(/移除/g, "Remove");

  fs.writeFileSync(file, text, 'utf-8');
}

['src/components/FlashcardsView.tsx', 'src/components/GrammarView.tsx', 'src/components/DictationView.tsx', 'src/components/SpeakingView.tsx', 'src/components/NotebookView.tsx'].forEach(replaceAll);

