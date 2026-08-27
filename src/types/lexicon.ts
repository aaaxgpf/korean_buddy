export type LexiconCategory = 
  | 'KPOP_FANDOM' 
  | 'DAILY_CONVERSATION'
  | 'MZ_SLANG'
  | 'TOPIK_1_2' 
  | 'TOPIK_3_4' 
  | 'TOPIK_5_6' 
  | 'YONSEI_SEOUL';

export interface WordItem {
  id: string;
  category: LexiconCategory;
  word: string; // 单词/词组/缩写
  hanja_or_origin?: string; // 汉字对应 或 缩写/梗的原句展开
  pos: string; // 词性 (명사, 동사, 형용사, 신조어 等)
  pronunciation?: string; // 连音/变音规则注音
  definition_zh: string; // 精准中文释义
  example_kr: string; // 地道韩语例句 (K-Pop/生活真实语境)
  example_zh: string; // 例句中文翻译
  safety_level?: 'CASUAL_FRIENDS' | 'INTERNET_ONLY' | 'ALL_SAFE'; // 语境安全分级
  mastered: boolean; // 掌握状态
  mistake_count: number; // 错题次数
  next_review_date?: string; // 艾宾浩斯复习时间戳
}
