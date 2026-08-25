/**
 * High-Accuracy Standard Korean-Chinese Comprehensive Dictionary & Sanitizer
 * Corrects OCR errors, corrupted Hanja table dumps, and generates authentic native Korean examples.
 */

export interface DictionaryEntry {
  word: string;
  pos: string;
  hanja?: string;
  definition_zh: string;
  definition_en?: string;
  example_kr: string;
  example_zh: string;
}

export const KOREAN_STANDARD_DICTIONARY: Record<string, DictionaryEntry> = {
  '식': {
    word: '식',
    pos: '명사 (名词)',
    hanja: '式',
    definition_zh: '仪式、典礼；方式、形式',
    definition_en: 'ceremony; method, form',
    example_kr: '내일은 학교 졸업식이 있는 날이에요.',
    example_zh: '明天是学校举行毕业典礼的日子。'
  },
  '인': {
    word: '인',
    pos: '명사/의존명사 (名词/依存名词)',
    hanja: '人',
    definition_zh: '人、人数（用于人数计数，如 2인분/三人）',
    definition_en: 'person, people',
    example_kr: '식당에서 삼겹살 2인분을 주문했어요.',
    example_zh: '在餐厅点了两人份的五花肉。'
  },
  '자': {
    word: '자',
    pos: '명사 (名词)',
    hanja: '字 / 者',
    definition_zh: '字、文字；人、者（在组合词中指代某人）',
    definition_en: 'letter, character; person',
    example_kr: '종이에 글자를 또박또박 바르게 썼어요.',
    example_zh: '在纸上工整清晰地写下了字。'
  },
  '회': {
    word: '회',
    pos: '명사/의존명사 (名词/依存名词)',
    hanja: '會 / 回',
    definition_zh: '生鱼片；次、回（次数计数）；聚会',
    definition_en: 'sashimi; round, times; meeting',
    example_kr: '바닷가 근처 횟집에서 신선한 회를 먹었어요.',
    example_zh: '在海边附近的生鱼片店吃了新鲜的刺身。'
  },
  '가게': {
    word: '가게',
    pos: '명사 (名词)',
    definition_zh: '店铺，小店，商店',
    definition_en: 'store, shop',
    example_kr: '집 앞 가게에서 시원한 아이스크림을 샀어요.',
    example_zh: '在家门口的店里买了清凉的冰淇淋。'
  },
  '가족': {
    word: '가족',
    pos: '명사 (名词)',
    hanja: '家族',
    definition_zh: '家人，家庭',
    definition_en: 'family',
    example_kr: '주말에는 가족과 함께 맛있는 저녁을 먹어요.',
    example_zh: '周末和家人一起吃美味的晚饭。'
  },
  '친구': {
    word: '친구',
    pos: '명사 (名词)',
    hanja: '親舊',
    definition_zh: '朋友，同岁好友',
    definition_en: 'friend',
    example_kr: '오랜만에 만난 친구와 카페에서 수다를 떨었어요.',
    example_zh: '和好久不见的朋友在咖啡厅开心地聊天。'
  },
  '사랑': {
    word: '사랑',
    pos: '명사 (名词)',
    definition_zh: '爱，爱情，关爱',
    definition_en: 'love',
    example_kr: '팬들의 따뜻한 사랑 덕분에 힘이 나요.',
    example_zh: '多亏粉丝们温暖的爱，我充满了力量。'
  },
  '시간': {
    word: '시간',
    pos: '명사 (名词)',
    hanja: '時間',
    definition_zh: '时间，时候，小时',
    definition_en: 'time, hour',
    example_kr: '내일 오후에 잠깐 시간 괜찮아요?',
    example_zh: '明天下午有空闲的时间吗？'
  },
  '마음': {
    word: '마음',
    pos: '명사 (名词)',
    definition_zh: '心，心思，心情，心意',
    definition_en: 'mind, heart',
    example_kr: '따뜻한 위로의 말 한마디가 마음에 와닿았어요.',
    example_zh: '一句温暖安慰的话深深触动了我的内心。'
  },
  '약속': {
    word: '약속',
    pos: '명사 (名词)',
    hanja: '約束',
    definition_zh: '约定，约会，承诺',
    definition_en: 'promise, appointment',
    example_kr: '친구와 주말에 영화를 보러 가기로 약속했어요.',
    example_zh: '和朋友约定好周末一起去看电影。'
  },
  '연습': {
    word: '연습',
    pos: '명사 (名词)',
    hanja: '練習',
    definition_zh: '练习，排练，训练',
    definition_en: 'practice',
    example_kr: '완벽한 무대를 보여주기 위해 밤늦게까지 연습했어요.',
    example_zh: '为了展现完美的舞台排练到了深夜。'
  },
  '무대': {
    word: '무대',
    pos: '명사 (名词)',
    hanja: '舞臺',
    definition_zh: '舞台',
    definition_en: 'stage',
    example_kr: '오늘 콘서트 무대 정말 감동적이고 멋졌어요.',
    example_zh: '今天演唱会的舞台真的非常感人且帅气。'
  },
  '노래': {
    word: '노래',
    pos: '명사 (名词)',
    definition_zh: '歌曲，唱歌',
    definition_en: 'song',
    example_kr: '퇴근길에 감미로운 어쿠스틱 노래를 들었어요.',
    example_zh: '下班路上听了一首动听的原声木吉他歌曲。'
  },
  '음악': {
    word: '음악',
    pos: '명사 (名词)',
    hanja: '音樂',
    definition_zh: '音乐',
    definition_en: 'music',
    example_kr: '하루 일과를 마치고 조용히 음악을 감상해요.',
    example_zh: '结束一天的日程后静静地欣赏音乐。'
  },
  '행복': {
    word: '행복',
    pos: '명사 (名词)',
    hanja: '幸福',
    definition_zh: '幸福，开心情感',
    definition_en: 'happiness',
    example_kr: '너와 함께하는 매 순간이 큰 행복이야.',
    example_zh: '和你在一起的每个瞬间都是巨大的幸福。'
  },
  '기억': {
    word: '기억',
    pos: '명사 (名词)',
    hanja: '記憶',
    definition_zh: '记忆，回忆，记念',
    definition_en: 'memory',
    example_kr: '우리가 함께 보낸 시간은 영원히 좋은 기억으로 남을 거야.',
    example_zh: '我们一起度过的时光会永远留下美好的回忆。'
  },
  '공부': {
    word: '공부',
    pos: '명사 (名词)',
    hanja: '工夫',
    definition_zh: '学习，攻读功课',
    definition_en: 'study',
    example_kr: '매일 꾸준히 한국어를 공부하면 실력이 쑥쑥 늘어요.',
    example_zh: '每天坚持学习韩语的话，实力就会飞速增长。'
  },
  '학교': {
    word: '학교',
    pos: '명사 (名词)',
    hanja: '學校',
    definition_zh: '学校',
    definition_en: 'school',
    example_kr: '학교 수업이 끝나고 도서관에서 과제를 했어요.',
    example_zh: '学校下课后在图书馆写了作业。'
  },
  '선생님': {
    word: '선생님',
    pos: '명사 (名词)',
    hanja: '先生님',
    definition_zh: '老师，先生（敬称）',
    definition_en: 'teacher',
    example_kr: '선생님께서 친절하게 문법을 설명해 주셨어요.',
    example_zh: '老师和蔼可亲地为我讲解了语法。'
  },
  '학생': {
    word: '학생',
    pos: '명사 (名词)',
    hanja: '學生',
    definition_zh: '学生',
    definition_en: 'student',
    example_kr: '열심히 꿈을 향해 달려가는 학생들을 응원해요.',
    example_zh: '为努力追逐梦想的学生们加油打气。'
  },
  '한국어': {
    word: '한국어',
    pos: '명사 (名词)',
    hanja: '韓國語',
    definition_zh: '韩国语，韩文',
    definition_en: 'Korean language',
    example_kr: '한국어 일기를 쓰면서 자연스러운 표현을 익혀요.',
    example_zh: '通过写韩语日记掌握自然的口语表达。'
  },
  '편지': {
    word: '편지',
    pos: '명사 (名词)',
    hanja: '便紙',
    definition_zh: '信，信件，书信',
    definition_en: 'letter',
    example_kr: '생일을 맞은 친구에게 진심을 담은 손편지를 썼어요.',
    example_zh: '给过生日的朋友写了充满真心的手写信。'
  },
  '선물': {
    word: '선물',
    pos: '명사 (名词)',
    hanja: '膳物',
    definition_zh: '礼物，馈赠',
    definition_en: 'gift, present',
    example_kr: '정성이 가득 담긴 깜짝 선물을 받고 감동받았어요.',
    example_zh: '收到心意满满的惊喜礼物非常感动。'
  },
  '사진': {
    word: '사진',
    pos: '명사 (名词)',
    hanja: '寫眞',
    definition_zh: '照片，相片',
    definition_en: 'photo, picture',
    example_kr: '여행지에서 아름다운 풍경 사진을 많이 찍었어요.',
    example_zh: '在旅游地拍了很多美丽的风景照。'
  },
  '커피': {
    word: '커피',
    pos: '명사 (名词)',
    definition_zh: '咖啡',
    definition_en: 'coffee',
    example_kr: '아침에 향긋하고 따뜻한 아메리카노 커피를 마셔요.',
    example_zh: '早晨喝一杯香气浓郁的热美式咖啡。'
  },
  '밥': {
    word: '밥',
    pos: '명사 (名词)',
    definition_zh: '饭，米饭，正餐',
    definition_en: 'meal, cooked rice',
    example_kr: '바쁘더라도 끼니 거르지 말고 밥 꼭 챙겨 먹어.',
    example_zh: '即使再忙也别空腹，一定要按时好好吃饭。'
  },
  '물': {
    word: '물',
    pos: '명사 (名词)',
    definition_zh: '水',
    definition_en: 'water',
    example_kr: '목이 마를 때는 시원한 물을 자주 마시는 게 좋아요.',
    example_zh: '口渴的时候多喝清凉的水对身体好。'
  },
  '길': {
    word: '길',
    pos: '명사 (名词)',
    definition_zh: '路，道路，途径',
    definition_en: 'road, way',
    example_kr: '퇴근하는 길에 예쁜 노을을 보았어요.',
    example_zh: '在下班回家的路上看到了漂亮的晚霞。'
  },
  '꿈': {
    word: '꿈',
    pos: '명사 (名词)',
    definition_zh: '梦，梦想，愿望',
    definition_en: 'dream',
    example_kr: '꿈을 포기하지 않고 끝까지 노력하면 언젠가 이루어져요.',
    example_zh: '不放弃梦想坚持到底的话，终有一天会实现的。'
  },
  '이야기': {
    word: '이야기',
    pos: '명사 (名词)',
    definition_zh: '话，故事，交谈',
    definition_en: 'story, talk',
    example_kr: '너와 나누는 사소한 이야기들이 나에겐 가장 소중해.',
    example_zh: '和你分享的每一件琐碎琐事对我来说都是最珍贵的。'
  }
};

/**
 * Checks if a string contains corrupted Hanja lists like "人 인 者 자 會 회" or OCR junk
 */
export function isCorruptedHanjaList(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  // Pattern where Chinese character is followed directly by Korean pronunciation repeatedly: e.g. "人 인 者 자"
  const hanjaKrPairs = trimmed.match(/[\u4e00-\u9fa5]\s*[\uac00-\ud7a3]/g);
  if (hanjaKrPairs && hanjaKrPairs.length >= 2) return true;

  // Pattern with just Hanja words or noise
  if (/^[人者會式文日月木水金火土一二三四五六七八九十\s]+$/.test(trimmed)) return true;

  // Pure template placeholder
  if (trimmed.includes('词汇标准释义') || trimmed.includes('关于“”的实战表达')) return true;

  return false;
}

/**
 * Sanitize and enhance a VocabItem with dictionary precision
 */
export function sanitizeVocabItem<T extends {
  word: string;
  hangul?: string;
  type?: string;
  meaning_zh?: string;
  meaning_en?: string;
  example_kr?: string;
  example_zh?: string;
  hanja_or_root?: string;
}>(item: T): T {
  const wordKey = (item.hangul || item.word || '').trim();
  const dict = KOREAN_STANDARD_DICTIONARY[wordKey];

  let cleanMeaning = item.meaning_zh || '';
  let cleanType = item.type || '명사 (名词)';
  let cleanExampleKr = item.example_kr || '';
  let cleanExampleZh = item.example_zh || '';
  let cleanHanja = item.hanja_or_root || '';

  // 1. Check if meaning is corrupted Hanja list or template noise
  const corrupted = isCorruptedHanjaList(cleanMeaning);

  if (dict) {
    if (corrupted || cleanMeaning.length < 2) {
      cleanMeaning = dict.definition_zh;
    }
    if (!cleanHanja && dict.hanja) {
      cleanHanja = dict.hanja;
    }
    if (!cleanType || cleanType.includes('어휘') || corrupted) {
      cleanType = dict.pos;
    }
    // Replace robotic templates: e.g. "식을/를 사용한 실전 표현이에요."
    if (!cleanExampleKr || cleanExampleKr.includes('사용한 실전 표현') || cleanExampleKr.includes('을/를 사용한')) {
      cleanExampleKr = dict.example_kr;
      cleanExampleZh = dict.example_zh;
    }
  } else {
    // If not in dict, but has corrupted definition: clean it intelligently
    if (corrupted) {
      cleanMeaning = `${wordKey}（韩语常用词汇）`;
    }
    if (!cleanExampleKr || cleanExampleKr.includes('사용한 실전 표현') || cleanExampleKr.includes('을/를 사용한')) {
      cleanExampleKr = `일상에서 '${wordKey}' 단어를 자연스럽게 활용해 보세요.`;
      cleanExampleZh = `在日常韩语中自然运用“${cleanMeaning || wordKey}”。`;
    }
  }

  return {
    ...item,
    meaning_zh: cleanMeaning,
    type: cleanType,
    example_kr: cleanExampleKr,
    example_zh: cleanExampleZh,
    hanja_or_root: cleanHanja || undefined,
  };
}
