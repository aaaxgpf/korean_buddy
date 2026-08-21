const fs = require('fs');

const moreWords = [
  // TOPIK 1-2
  { id: "topik_1_ex1", word: "가족", hangul: "가족", hanja_or_root: "家族", type: "명사 (名词)", meaning_zh: "家庭，家人", meaning_en: "Family", example_kr: "가족이 몇 명이에요?", example_zh: "家里有几口人？", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex2", word: "학교", hangul: "학교", hanja_or_root: "学校", type: "명사 (名词)", meaning_zh: "学校", meaning_en: "School", example_kr: "학교에 가요.", example_zh: "去学校。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex3", word: "공부하다", hangul: "공부하다", hanja_or_root: "工夫", type: "동사 (动词)", meaning_zh: "学习", meaning_en: "Study", example_kr: "한국어를 공부해요.", example_zh: "学习韩语。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex4", word: "친구", hangul: "친구", hanja_or_root: "亲旧", type: "명사 (名词)", meaning_zh: "朋友", meaning_en: "Friend", example_kr: "친구를 만나요.", example_zh: "见朋友。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex5", word: "밥", hangul: "밥", hanja_or_root: "固有词", type: "명사 (名词)", meaning_zh: "饭", meaning_en: "Rice/Meal", example_kr: "밥을 먹어요.", example_zh: "吃饭。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex6", word: "물", hangul: "물", hanja_or_root: "固有词", type: "명사 (名词)", meaning_zh: "水", meaning_en: "Water", example_kr: "물을 마셔요.", example_zh: "喝水。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex7", word: "책", hangul: "책", hanja_or_root: "册", type: "명사 (名词)", meaning_zh: "书", meaning_en: "Book", example_kr: "책을 읽어요.", example_zh: "读书。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex8", word: "영화", hangul: "영화", hanja_or_root: "映画", type: "명사 (名词)", meaning_zh: "电影", meaning_en: "Movie", example_kr: "영화를 봐요.", example_zh: "看电影。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex9", word: "음악", hangul: "음악", hanja_or_root: "音乐", type: "명사 (名词)", meaning_zh: "音乐", meaning_en: "Music", example_kr: "음악을 들어요.", example_zh: "听音乐。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  { id: "topik_1_ex10", word: "시간", hangul: "시간", hanja_or_root: "时间", type: "명사 (名词)", meaning_zh: "时间", meaning_en: "Time", example_kr: "시간이 없어요.", example_zh: "没有时间。", category: "TOPIK 1-2 初级", level: "TOPIK 1-2", mastery: "new" },
  // TOPIK 3-4
  { id: "topik_3_ex1", word: "경험", hangul: "경험", hanja_or_root: "经验", type: "명사 (名词)", meaning_zh: "经验", meaning_en: "Experience", example_kr: "경험을 쌓다.", example_zh: "积累经验。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex2", word: "노력하다", hangul: "노력하다", hanja_or_root: "努力", type: "동사 (动词)", meaning_zh: "努力", meaning_en: "Make an effort", example_kr: "열심히 노력할게요.", example_zh: "我会努力的。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex3", word: "성격", hangul: "성격", hanja_or_root: "性格", type: "명사 (名词)", meaning_zh: "性格", meaning_en: "Personality", example_kr: "성격이 좋아요.", example_zh: "性格很好。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex4", word: "관심", hangul: "관심", hanja_or_root: "关心", type: "명사 (名词)", meaning_zh: "关心，兴趣", meaning_en: "Interest", example_kr: "관심이 많아요.", example_zh: "很感兴趣。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex5", word: "발전", hangul: "발전", hanja_or_root: "发展", type: "명사 (名词)", meaning_zh: "发展", meaning_en: "Development", example_kr: "기술의 발전.", example_zh: "技术的发展。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex6", word: "결정하다", hangul: "결정하다", hanja_or_root: "决定", type: "동사 (动词)", meaning_zh: "决定", meaning_en: "Decide", example_kr: "마음을 결정했어요.", example_zh: "决定好了。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex7", word: "확인하다", hangul: "확인하다", hanja_or_root: "确认", type: "동사 (动词)", meaning_zh: "确认", meaning_en: "Confirm", example_kr: "예약을 확인해 주세요.", example_zh: "请确认预约。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex8", word: "이해하다", hangul: "이해하다", hanja_or_root: "理解", type: "동사 (动词)", meaning_zh: "理解", meaning_en: "Understand", example_kr: "이해가 안 가요.", example_zh: "不明白。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex9", word: "해결하다", hangul: "해결하다", hanja_or_root: "解决", type: "동사 (动词)", meaning_zh: "解决", meaning_en: "Solve", example_kr: "문제를 해결했어요.", example_zh: "解决了问题。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
  { id: "topik_3_ex10", word: "참여하다", hangul: "참여하다", hanja_or_root: "参与", type: "동사 (动词)", meaning_zh: "参与", meaning_en: "Participate", example_kr: "행사에 참여해요.", example_zh: "参与活动。", category: "TOPIK 3-4 中级", level: "TOPIK 3-4", mastery: "new" },
];

let content = fs.readFileSync('src/data/vocabulary.ts', 'utf-8');
// Generate the text to insert
let appendText = '';
for(let w of moreWords) {
  appendText += `  {\n`;
  for(let key in w) {
    if (key === 'mastery' || key === 'level' || key === 'category') {
      appendText += `    ${key}: '${w[key]}',\n`;
    } else {
      appendText += `    ${key}: \`${w[key]}\`,\n`;
    }
  }
  appendText += `  },\n`;
}

content = content.replace(/];\s*$/, appendText + '];\n');
fs.writeFileSync('src/data/vocabulary.ts', content, 'utf-8');
console.log('Appended extra words');
