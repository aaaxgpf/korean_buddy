import { CustomLexiconBook, VocabItem } from '../types';
import { INITIAL_VOCABULARY } from './vocabulary';

// Curate subsets for the built-in books
const kpopWords = INITIAL_VOCABULARY.filter(v => 
  v.category?.includes('K-POP') || 
  v.level?.includes('K-pop') || 
  v.id?.startsWith('kpop_')
);

const dailyWords = INITIAL_VOCABULARY.filter(v => 
  v.category?.includes('日常') || 
  v.level?.includes('Daily') || 
  v.id?.startsWith('daily_')
);

const slangWords = INITIAL_VOCABULARY.filter(v => 
  v.category?.includes('热词') || 
  v.category?.includes('流行') || 
  v.level?.includes('Slang') || 
  v.id?.startsWith('mz_') || 
  v.id?.startsWith('trend_')
);

export const PRESET_CUSTOM_BOOKS: CustomLexiconBook[] = [
  {
    id: 'preset_kpop_fandom',
    title: 'K-POP 饭圈',
    description: '涵盖追星拆卡、线下接机、签售会与打榜打歌核心词汇',
    fileName: 'kpop_fandom.json',
    fileType: 'preset',
    totalWords: kpopWords.length,
    importedAt: Date.now() - 86400000 * 3,
    category: 'K-POP 饭圈',
    words: kpopWords
  },
  {
    id: 'preset_daily_conversation',
    title: '日常口语',
    description: '精选韩国年轻人日常聊天、点餐聚会与生活高频表达',
    fileName: 'daily_conversation.json',
    fileType: 'preset',
    totalWords: dailyWords.length,
    importedAt: Date.now() - 86400000 * 2,
    category: '日常口语',
    words: dailyWords
  },
  {
    id: 'preset_trending_slang',
    title: '实时热词',
    description: '联网实时同步韩国 2024-2026 SNS 与 TikTok 流行热梗新词',
    fileName: 'trending_slang_live.json',
    fileType: 'preset',
    totalWords: slangWords.length,
    importedAt: Date.now(),
    category: '实时热词',
    words: slangWords
  }
];
