const fs = require('fs');

// We'll generate a sizable sample of words from the Yonsei OCR snippets provided in the prompt context.
const words = [
  // Vol 1
  { word: '안녕하십니까', hangul: '안녕하십니까', type: '表达', meaning_zh: '你好', meaning_en: 'hello; how do you do?' },
  { word: '이름', hangul: '이름', type: '名', meaning_zh: '姓名', meaning_en: 'name; full name' },
  { word: '선생님', hangul: '선생님', type: '名', meaning_zh: '老师', meaning_en: 'teacher' },
  { word: '친구', hangul: '친구', type: '名', meaning_zh: '朋友', meaning_en: 'friend' },
  { word: '어느', hangul: '어느', type: '冠', meaning_zh: '哪(个)', meaning_en: 'any' },
  { word: '나라', hangul: '나라', type: '名', meaning_zh: '国家', meaning_en: 'country; nation' },
  { word: '사람', hangul: '사람', type: '名', meaning_zh: '人', meaning_en: 'human; man' },
  { word: '한국', hangul: '한국', type: '名', meaning_zh: '韩国', meaning_en: 'Korea' },
  { word: '중국', hangul: '중국', type: '名', meaning_zh: '中国', meaning_en: 'China' },
  { word: '회사원', hangul: '회사원', type: '名', meaning_zh: '公司职员', meaning_en: 'employee; office worker' },
  { word: '학생', hangul: '학생', type: '名', meaning_zh: '学生', meaning_en: 'student' },
  { word: '만나다', hangul: '만나다', type: '动', meaning_zh: '见面', meaning_en: 'meet' },
  { word: '인사하다', hangul: '인사하다', type: '动', meaning_zh: '打招呼', meaning_en: 'greet' },
  { word: '학교', hangul: '학교', type: '名', meaning_zh: '学校', meaning_en: 'school' },
  { word: '집', hangul: '집', type: '名', meaning_zh: '家', meaning_en: 'house' },
  { word: '교과서', hangul: '교과서', type: '名', meaning_zh: '课本', meaning_en: 'textbook' },
  { word: '사전', hangul: '사전', type: '名', meaning_zh: '词典', meaning_en: 'dictionary' },
  // Vol 2
  { word: '부탁하다', hangul: '부탁하다', type: '动', meaning_zh: '拜托', meaning_en: 'request' },
  { word: '도움', hangul: '도움', type: '名', meaning_zh: '帮助', meaning_en: 'help' },
  { word: '필요하다', hangul: '필요하다', type: '形', meaning_zh: '需要', meaning_en: 'necessary' },
  { word: '졸업하다', hangul: '졸업하다', type: '动', meaning_zh: '毕业', meaning_en: 'graduate' },
  { word: '전공', hangul: '전공', type: '名', meaning_zh: '专业', meaning_en: 'major; specialty' },
  { word: '경영학', hangul: '경영학', type: '名', meaning_zh: '经营学', meaning_en: 'business administration' },
  { word: '설렁탕', hangul: '설렁탕', type: '名', meaning_zh: '牛杂碎汤', meaning_en: 'ox bone soup' },
  { word: '반찬', hangul: '반찬', type: '名', meaning_zh: '菜', meaning_en: 'side dish' },
  { word: '접시', hangul: '접시', type: '名', meaning_zh: '碟子', meaning_en: 'plate' },
  { word: '계란프라이', hangul: '계란프라이', type: '表达', meaning_zh: '煎鸡蛋', meaning_en: 'fried egg' },
  { word: '고추장', hangul: '고추장', type: '名', meaning_zh: '辣椒酱', meaning_en: 'red chili paste' },
  // Vol 3
  { word: '시간을 내다', hangul: '시간을 내다', type: '表达', meaning_zh: '腾出时间', meaning_en: 'make time' },
  { word: '마음을 먹다', hangul: '마음을 먹다', type: '表达', meaning_zh: '下决心', meaning_en: 'make up one\'s mind' },
  { word: '가능하다', hangul: '가능하다', type: '形', meaning_zh: '可能', meaning_en: 'possible; able' },
  { word: '모으다', hangul: '모으다', type: '动', meaning_zh: '收集', meaning_en: 'collect' },
  { word: '세계', hangul: '세계', type: '名', meaning_zh: '世界', meaning_en: 'world' },
  { word: '거의', hangul: '거의', type: '副', meaning_zh: '几乎', meaning_en: 'nearly' },
  { word: '수집하다', hangul: '수집하다', type: '动', meaning_zh: '收集', meaning_en: 'collect' },
  { word: '감상하다', hangul: '감상하다', type: '动', meaning_zh: '欣赏', meaning_en: 'appreciate' },
  { word: '다양하다', hangul: '다양하다', type: '形', meaning_zh: '各种各样', meaning_en: 'various' },
  // Vol 4
  { word: '겁', hangul: '겁', type: '名', meaning_zh: '害怕', meaning_en: 'fear; fright' },
  { word: '적응', hangul: '적응', type: '名', meaning_zh: '适应', meaning_en: 'adaptation' },
  { word: '다행이다', hangul: '다행이다', type: '表达', meaning_zh: '万幸', meaning_en: 'be fortunate' },
  { word: '시설', hangul: '시설', type: '名', meaning_zh: '设施', meaning_en: 'facility' },
  { word: '도심', hangul: '도심', type: '名', meaning_zh: '城市中心', meaning_en: 'downtown' },
  { word: '번화하다', hangul: '번화하다', type: '形', meaning_zh: '繁华', meaning_en: 'bustling' },
  { word: '쾌적하다', hangul: '쾌적하다', type: '形', meaning_zh: '舒适', meaning_en: 'pleasant' },
  { word: '인생', hangul: '인생', type: '名', meaning_zh: '人生', meaning_en: 'life' },
  { word: '영향', hangul: '영향', type: '名', meaning_zh: '影响', meaning_en: 'influence' },
  // Vol 5
  { word: '통계청', hangul: '통계청', type: '名', meaning_zh: '统计厅', meaning_en: 'Statistics Korea' },
  { word: '경쟁', hangul: '경쟁', type: '名', meaning_zh: '竞争', meaning_en: 'competition' },
  { word: '뚫다', hangul: '뚫다', type: '动', meaning_zh: '穿', meaning_en: 'dig; pierce' },
  { word: '고려하다', hangul: '고려하다', type: '动', meaning_zh: '考虑', meaning_en: 'consider' },
  { word: '가치관', hangul: '가치관', type: '名', meaning_zh: '价值观', meaning_en: 'values' },
  { word: '소신', hangul: '소신', type: '名', meaning_zh: '信念', meaning_en: 'belief' },
  { word: '보람', hangul: '보람', type: '名', meaning_zh: '意义', meaning_en: 'worth' },
  { word: '유형', hangul: '유형', type: '名', meaning_zh: '类型', meaning_en: 'type' },
  { word: '언어 능력', hangul: '언어 능력', type: '表达', meaning_zh: '语言能力', meaning_en: 'language proficiency' },
  // Vol 6
  { word: '수장', hangul: '수장', type: '名', meaning_zh: '首长', meaning_en: 'head; chief' },
  { word: '소감', hangul: '소감', type: '名', meaning_zh: '感想', meaning_en: 'thoughts' },
  { word: '한결같다', hangul: '한결같다', type: '形', meaning_zh: '始终如一', meaning_en: 'constant; steadfast' },
  { word: '지지', hangul: '지지', type: '名', meaning_zh: '支持', meaning_en: 'support' },
  { word: '성원', hangul: '성원', type: '名', meaning_zh: '成员', meaning_en: 'member' },
  { word: '귀감', hangul: '귀감', type: '名', meaning_zh: '榜样', meaning_en: 'role model' },
  { word: '막연히', hangul: '막연히', type: '副', meaning_zh: '茫然', meaning_en: 'vaguely' },
  { word: '누비다', hangul: '누비다', type: '动', meaning_zh: '穿行', meaning_en: 'move around' },
  { word: '구체화되다', hangul: '구체화되다', type: '动', meaning_zh: '具体化', meaning_en: 'be concretized' },
  { word: '시련', hangul: '시련', type: '名', meaning_zh: '考验', meaning_en: 'trial' },
];

let out = `import { VocabItem } from '../types';\n\nexport const INITIAL_VOCABULARY: VocabItem[] = [\n`;

words.forEach((w, i) => {
  out += `  {
    id: 'vocab_yonsei_${i}',
    word: '${w.word}',
    hangul: '${w.hangul}',
    type: '${w.type}',
    meaning_zh: '${w.meaning_zh}',
    meaning_en: '${w.meaning_en}',
    source: 'Yonsei Korean'
  },\n`;
});
out += `];\n`;

fs.writeFileSync('src/data/vocabulary.ts', out, 'utf-8');
console.log('Vocabulary generated.');
