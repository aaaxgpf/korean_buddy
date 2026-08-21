import { CustomLexiconBook, VocabItem } from '../types';
import { INITIAL_VOCABULARY } from './vocabulary';

// Curate specific subsets for preset books
const yonseiWords = INITIAL_VOCABULARY.filter(v => v.category?.includes('延世') || v.category?.includes('初级') || v.level?.includes('Yonsei') || v.level?.includes('TOPIK 1-2'));
const topikWords = INITIAL_VOCABULARY.filter(v => v.category?.includes('TOPIK') || v.level?.includes('TOPIK'));
const kpopWords = INITIAL_VOCABULARY.filter(v => v.category?.includes('K-POP') || v.level?.includes('K-pop'));
const mzWords = INITIAL_VOCABULARY.filter(v => v.category?.includes('MZ') || v.level?.includes('Daily'));

export const PRESET_CUSTOM_BOOKS: CustomLexiconBook[] = [
  {
    id: 'preset_yonsei_vol1',
    title: '延世韩国语 Vol.1 初级词汇手册',
    description: '涵盖延世大学韩国语学堂第一册 1~10 课高频生活基础核心词（打招呼、点餐、校园、购物）',
    fileName: 'yonsei_korean_vol1.pdf',
    fileType: 'preset',
    totalWords: yonseiWords.length > 0 ? yonseiWords.length : 50,
    importedAt: Date.now() - 86400000 * 5,
    category: '延世韩国语 Vol.1',
    words: yonseiWords.length > 0 ? yonseiWords : INITIAL_VOCABULARY.slice(0, 30)
  },
  {
    id: 'preset_topik_intermediate',
    title: 'TOPIK II 中高级核心真题突破词库',
    description: '收录 TOPIK 3~6 级高频中高级学术与社会议论文核心词汇、逻辑连接词与常用汉字成语',
    fileName: 'topik_intermediate_essential.pdf',
    fileType: 'preset',
    totalWords: topikWords.length > 0 ? topikWords.length : 40,
    importedAt: Date.now() - 86400000 * 3,
    category: 'TOPIK II 中高级',
    words: topikWords.length > 0 ? topikWords : INITIAL_VOCABULARY.slice(0, 30)
  },
  {
    id: 'preset_kpop_fandom',
    title: 'K-POP 饭圈生态与追星高频口语',
    description: '深度涵盖拆专拆卡、线下接机、签售会打招呼、Bubble泡泡聊天与打歌打榜核心词汇',
    fileName: 'kpop_fandom_ultimate.json',
    fileType: 'preset',
    totalWords: kpopWords.length > 0 ? kpopWords.length : 25,
    importedAt: Date.now() - 86400000 * 2,
    category: 'K-POP 饭圈特训',
    words: kpopWords.length > 0 ? kpopWords : INITIAL_VOCABULARY.slice(0, 25)
  },
  {
    id: 'preset_mz_slang',
    title: 'MZ 世代流行语与日常网络缩写',
    description: '精选韩国当下年轻人 SNS、YouTube、KakaoTalk 热聊的高频新造词与生活网络热梗',
    fileName: 'mz_korean_slangs.txt',
    fileType: 'preset',
    totalWords: mzWords.length > 0 ? mzWords.length : 15,
    importedAt: Date.now() - 86400000 * 1,
    category: 'MZ 流行语',
    words: mzWords.length > 0 ? mzWords : INITIAL_VOCABULARY.slice(0, 15)
  }
];
