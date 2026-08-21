const fs = require('fs');
let chat = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Replace wechat theme colors in CompanionChat.tsx
chat = chat.replace(
  /className=\{(.*?)(`w-full max-w-4xl.*?(?:bg-\[#b2c7d9\]|bg-\[#FAF9F6\]).*?`)(.*?)\}/,
  'className={$1`w-full max-w-4xl mx-auto h-full flex flex-col relative ${theme === \'kkt\' ? \'bg-[#b2c7d9]\' : theme === \'wechat\' ? \'bg-[#EDEDED]\' : \'bg-[#FAF9F6]\'}`$3}'
);

// We need a more reliable replacement for the bubble colors
// "bg-white text-[#2D2D2D]" is assistant default
// "bg-amber-300 text-[#2D2D2D]" is user default, "bg-[#FFEB3B]" is kkt
chat = chat.replace(
  /isUser \? \(theme === 'kkt' \? 'bg-\[#FFEB3B\] text-\[#3E2723\]' : 'bg-amber-300 text-\[#2D2D2D\]'\) : 'bg-white text-\[#2D2D2D\]'/g,
  "isUser ? (theme === 'kkt' ? 'bg-[#FFEB3B] text-[#3E2723]' : theme === 'wechat' ? 'bg-[#95EC69] text-black' : 'bg-amber-300 text-[#2D2D2D]') : 'bg-white text-[#2D2D2D]'"
);

// Remove Chinese
chat = chat.replace(/type: '명사 \(名词\)'/g, "type: 'Noun'");
chat = chat.replace(/meaning_zh: companion\.badge \|\| '核心词汇'/g, "meaning_zh: companion.badge || 'Core Vocabulary'");
chat = chat.replace(/title_zh: '征询意向 \/ 提议 \(要不要一起\.\.\.\?\)'/g, "title_zh: 'Suggestion / Proposal'");
chat = chat.replace(/explanation_zh: '用于亲近的人之间提议一起做某事或征求对方想法。'/g, "explanation_zh: 'Used to suggest or ask for an opinion.'");
chat = chat.replace(/💡 爱豆伴学：\$\{companion\.name_zh\} 正在以 \$\{companion\.tone\} 与你聊天。遇到生词可以随时点选下方解析！/g, "💡 Buddy: ${companion.name_en || companion.name_ko} is chatting with you. Tap words for explanations!");
chat = chat.replace(/Bilibili \(B站\)/g, "Bilibili");
chat = chat.replace(/Weverse \(官方社区\)/g, "Weverse");
chat = chat.replace(/切换成员/g, "Switch Buddy");
chat = chat.replace(/✨ 私信/g, "✨ Message");
chat = chat.replace(/视频分享/g, "Video Share");
chat = chat.replace(/原声朗读/g, "Read out");
chat = chat.replace(/朗读中/g, "Reading");
chat = chat.replace(/原声/g, "Voice");
chat = chat.replace(/收藏此句/g, "Save sentence");
chat = chat.replace(/<span>中 译文<\/span>/g, "<span>Translation</span>");
chat = chat.replace(/<span>词汇/g, "<span>Vocab");
chat = chat.replace(/<span>语法/g, "<span>Grammar");
chat = chat.replace(/<span>小贴士<\/span>/g, "<span>Tips</span>");
chat = chat.replace(/<span>本句核心词汇<\/span>/g, "<span>Core Vocabulary</span>");
chat = chat.replace(/收起/g, "Collapse");
chat = chat.replace(/伴学对话实时提取/g, "Extracted from Chat");
chat = chat.replace(/保存至生词本/g, "Save to Notebook");
chat = chat.replace(/<span>句型语法解析<\/span>/g, "<span>Grammar Analysis</span>");
chat = chat.replace(/💡 地道语境小贴士/g, "💡 Context Tips");
chat = chat.replace(/发送照片 \/ 笔记图片/g, "Send Photo");
chat = chat.replace(/<span className="hidden sm:inline">发送<\/span>/g, "<span className=\"hidden sm:inline\">Send</span>");
chat = chat.replace(/\{companion\.name_zh\} 原声语速与音调调校/g, "Voice Settings for {companion.name_en || companion.name_ko}");
chat = chat.replace(/真实爱豆自然声线/g, "Natural Voice");
chat = chat.replace(/<span>朗读语速 \(TTS Rate\)<\/span>/g, "<span>Speech Rate</span>");
chat = chat.replace(/<span>试听样音<\/span>/g, "<span>Test Voice</span>");
chat = chat.replace(/保存设置/g, "Save Settings");

fs.writeFileSync('src/components/CompanionChat.tsx', chat, 'utf-8');
