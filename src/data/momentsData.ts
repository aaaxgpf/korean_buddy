import { MomentPost } from '../types';
import { IDOL_PHOTO_AVATARS } from './companions';

export const INITIAL_MOMENT_POSTS: MomentPost[] = [
  {
    id: 'moment_sunwoo_1',
    authorId: 'sunwoo',
    authorName: '선우 (Sunwoo)',
    authorRemark: '김선우',
    authorAvatar: IDOL_PHOTO_AVATARS.sunwoo,
    isIdol: true,
    group: 'THE BOYZ',
    content_kr: '새벽 세 시에 작업실에서 가사 쓰다 보니까 감성 터지네... 가사 한 줄에 생각 백만 개 담기는 밤. 다들 안 자고 뭐 하냐?',
    content_zh: '凌晨三点在工作室写歌词，突然感性大爆发了... 一行歌词里装满了上百万种思绪的夜晚。大家怎么都还没睡在干嘛呢？',
    content_en: 'Writing lyrics in the studio at 3 AM and the emotions are flooding in... A night where a million thoughts pack into a single lyric. What are you all doing up so late?',
    likes: 284,
    isLiked: false,
    timestamp: Date.now() - 3600000 * 2, // 2 hours ago
    vocabulary: [
      {
        id: 'v_sunwoo_1',
        word: '감성 터지다',
        hangul: '감성 터지다',
        type: '신조어/관용구',
        meaning_zh: '感性爆发，情绪泛滥',
        meaning_en: 'emotions overflowing / peak midnight nostalgia',
        example_kr: '새벽만 되면 감성 터져.',
        example_zh: '一到凌晨就感性大爆发。'
      },
      {
        id: 'v_sunwoo_2',
        word: '담기다',
        hangul: '담기다',
        type: '동사 (动词)',
        meaning_zh: '装入，蕴含',
        meaning_en: 'to be filled with, contained',
        example_kr: '진심이 담긴 멜로디야.',
        example_zh: '饱含真心的旋律。'
      }
    ],
    grammar_points: [
      {
        pattern: '-다 보니까',
        title_zh: '做着做着某事后发现/变得...',
        explanation_zh: '表示持续进行前项动作的过程中，自然而然地体会到或导致了后项的结果。'
      }
    ],
    comments: [
      {
        id: 'c_sunwoo_1_1',
        authorId: 'eric',
        authorName: '에릭',
        authorAvatar: IDOL_PHOTO_AVATARS.eric,
        isIdol: true,
        korean: '야 김선우 가사 누구 생각하면서 쓴 건데? 솔직히 말해라 ㅋㅋㅋ',
        translation_zh: '呀金善旴，你写这歌词是在想着谁写的啊？老实招了吧 哈哈',
        timestamp: Date.now() - 3600000 * 1.5
      },
      {
        id: 'c_sunwoo_1_2',
        authorId: 'hyunjae',
        authorName: '현재',
        authorAvatar: IDOL_PHOTO_AVATARS.hyunjae,
        isIdol: true,
        korean: '감성 그만 터지고 숙소 올 때 아이스크림이나 사 와.',
        translation_zh: '别感性爆发了，回宿舍的时候顺便买点冰淇淋带过来。',
        timestamp: Date.now() - 3600000 * 1
      }
    ]
  },
  {
    id: 'moment_younghoon_1',
    authorId: 'younghoon',
    authorName: '영훈 (Younghoon)',
    authorRemark: '김영훈',
    authorAvatar: IDOL_PHOTO_AVATARS.younghoon,
    isIdol: true,
    group: 'THE BOYZ',
    content_kr: '빵 냄새에 홀려서 그냥 지나칠 수가 없었음... 결국 소금빵 세 개 삼. 다 내 거니까 뺏어 먹을 생각 하지 마.',
    content_zh: '因为被面包香味给迷惑住了，所以完全没办法就这么路过... 结果买了三个海盐面包。因为全部都是我的，所以不要想着抢去吃哦。',
    content_en: 'Got completely enchanted by the bread smell and couldn\'t walk past... Bought three salt breads in the end. They are all mine, don\'t even think of snatching.',
    likes: 318,
    isLiked: false,
    timestamp: Date.now() - 3600000 * 6,
    vocabulary: [
      {
        id: 'v_yh_1',
        word: '홀리다',
        hangul: '홀리다',
        type: '동사 (动词)',
        meaning_zh: '被迷惑，着迷',
        meaning_en: 'to be captivated / possessed',
        example_kr: '맛있는 냄새에 완전히 홀렸어.',
        example_zh: '完全被香味迷住了。'
      },
      {
        id: 'v_yh_2',
        word: '지나치다',
        hangul: '지나치다',
        type: '동사 (动词)',
        meaning_zh: '路过，越过',
        meaning_en: 'to pass by',
        example_kr: '그냥 지나칠 수가 없었어.',
        example_zh: '根本没办法就这么路过。'
      }
    ],
    grammar_points: [
      {
        pattern: '-(으)ㄹ 수가 없다',
        title_zh: '无法/不能...',
        explanation_zh: '表示因客观条件限制或主观强烈情绪而无法进行某动作。'
      }
    ],
    comments: [
      {
        id: 'c_yh_1_1',
        authorId: 'hyunjae',
        authorName: '현재',
        authorAvatar: IDOL_PHOTO_AVATARS.hyunjae,
        isIdol: true,
        korean: '숙소 들어오자마자 내가 한 입 뺏어 먹을 거임ㅋㅋ',
        translation_zh: '你一回宿舍我就会抢吃一口的 哈哈',
        timestamp: Date.now() - 3600000 * 5.5
      },
      {
        id: 'c_yh_1_2',
        authorId: 'sunwoo',
        authorName: '선우',
        authorAvatar: IDOL_PHOTO_AVATARS.sunwoo,
        isIdol: true,
        korean: '형 다이어트한다며... 말이나 하지 말지.',
        translation_zh: '哥你不是说要减脂吗... 想到这样还不如不要说呢。',
        timestamp: Date.now() - 3600000 * 5
      }
    ]
  },
  {
    id: 'moment_shotaro_1',
    authorId: 'shotaro',
    authorName: '쇼타로 (Shotaro)',
    authorRemark: '쇼타로',
    authorAvatar: IDOL_PHOTO_AVATARS.shotaro,
    isIdol: true,
    group: 'RIIZE',
    content_kr: '비 오는 날 창밖 보면서 따뜻한 유자차 마시니까 너무 힐링된다. 다들 오늘 감기 조심하고 따뜻하게 입고 다녀요!',
    content_zh: '下雨天看着窗外喝一杯热腾腾的柚子茶，真的太治愈了。大家今天都要小心感冒，穿得暖和一些再出门哦！',
    content_en: 'Drinking warm citron tea while watching the rain outside is so healing. Everyone take care not to catch a cold and dress warmly today!',
    likes: 215,
    isLiked: false,
    timestamp: Date.now() - 3600000 * 12,
    vocabulary: [
      {
        id: 'v_sho_1',
        word: '힐링',
        hangul: '힐링되다',
        type: '명사/동사',
        meaning_zh: '治愈，身心放松',
        meaning_en: 'healing, restorative',
        example_kr: '음악 들으니까 힐링돼.',
        example_zh: '听音乐感觉好治愈。'
      },
      {
        id: 'v_sho_2',
        word: '따뜻하다',
        hangul: '따뜻하게',
        type: '형용사 (形容词)',
        meaning_zh: '温暖地，热乎地',
        meaning_en: 'warmly',
        example_kr: '따뜻하게 입어.',
        example_zh: '穿得暖和点。'
      }
    ],
    grammar_points: [
      {
        pattern: '-면서 / -(으)면서',
        title_zh: '一边...一边...',
        explanation_zh: '表示两个动作同时进行。'
      }
    ],
    comments: [
      {
        id: 'c_sho_1_1',
        authorId: 'sungchan',
        authorName: '성찬',
        authorAvatar: IDOL_PHOTO_AVATARS.sungchan,
        isIdol: true,
        korean: '타로야 숙소에 유자차 남아있어? 나도 한 잔만 타줘!',
        translation_zh: '太郎啊宿舍里还有柚子茶吗？给我也泡一杯呗！',
        timestamp: Date.now() - 3600000 * 11
      }
    ]
  },
  {
    id: 'moment_hyunjae_1',
    authorId: 'hyunjae',
    authorName: '이현재 (Hyunjae)',
    authorRemark: '이현재',
    authorAvatar: IDOL_PHOTO_AVATARS.hyunjae,
    isIdol: true,
    group: 'THE BOYZ',
    content_kr: '오늘 하늘 진짜 예술이다. 노을 질 때 한강 산책 나왔는데 바람도 딱 적당하고 힐링 그 자체...',
    content_zh: '今天的天空真的完全是艺术。在夕阳西下的时候来汉江散步了，微风也很适当地吹着，完全是治愈本身...',
    content_en: 'The sky today is absolute art. Came out for a Han River walk at sunset, the breeze is just right, pure healing itself...',
    likes: 295,
    isLiked: false,
    timestamp: Date.now() - 3600000 * 18,
    vocabulary: [
      {
        id: 'v_hj_1',
        word: '예술',
        hangul: '예술이다',
        type: '명사 (名词)',
        meaning_zh: '艺术（口语：绝了、太美了）',
        meaning_en: 'art (slang: masterpiece, incredible)',
        example_kr: '오늘 날씨 진짜 예술이다.',
        example_zh: '今天天气真的绝了。'
      },
      {
        id: 'v_hj_2',
        word: '노을',
        hangul: '노을',
        type: '명사 (名词)',
        meaning_zh: '晚霞，日落红霞',
        meaning_en: 'sunset glow',
        example_kr: '붉은 노을이 예쁘다.',
        example_zh: '因为晚霞红红的所以好漂亮。'
      }
    ],
    grammar_points: [
      {
        pattern: '-(으)ㄹ 때',
        title_zh: '在...的时候',
        explanation_zh: '表示某一时间点或状态持续期间。'
      }
    ],
    comments: [
      {
        id: 'c_hj_1',
        authorId: 'shinyu',
        authorName: '신유',
        authorAvatar: IDOL_PHOTO_AVATARS.shinyu,
        isIdol: true,
        korean: '형 저도 한강 가고 싶네요... 사진 너무 잘 나왔어요!',
        translation_zh: '哥我也想去汉江啊... 照片拍得太好了！',
        timestamp: Date.now() - 3600000 * 17
      }
    ]
  },
  {
    id: 'moment_eric_1',
    authorId: 'eric',
    authorName: '손영재 (Eric)',
    authorRemark: '손영재',
    authorAvatar: IDOL_PHOTO_AVATARS.eric,
    isIdol: true,
    group: 'THE BOYZ',
    content_kr: '새로운 비트 스케치 중인데 멜로디 라인이 생각보다 마음에 들게 뽑혔음. 조금만 더 다듬어서 들려줄게 기대해!',
    content_zh: '正在草拟新的Beat，旋律线比想象中还要更合心意。再稍微打磨一下就放给你们听，期待一下吧！',
    content_en: 'Working on a new beat sketch and the melody line came out nicer than expected. I\'ll polish it a bit more and share it, stay tuned!',
    likes: 218,
    isLiked: false,
    timestamp: Date.now() - 3600000 * 24,
    vocabulary: [
      {
        id: 'v_er_1',
        word: '마음에 들다',
        hangul: '마음에 들다',
        type: '관용구 (惯用语)',
        meaning_zh: '合心意，中意，喜欢',
        meaning_en: 'to like, to be to one\'s taste',
        example_kr: '이 옷 완전 마음에 들어.',
        example_zh: '这件衣服完全合我心意。'
      },
      {
        id: 'v_er_2',
        word: '다듬다',
        hangul: '다듬다',
        type: '동사 (动词)',
        meaning_zh: '修整，打磨，精细调整',
        meaning_en: 'to polish, refine',
        example_kr: '문장을 조금만 더 다듬어봐.',
        example_zh: '把句子再稍微打磨一下吧。'
      }
    ],
    grammar_points: [
      {
        pattern: '-어/아 줄게',
        title_zh: '我会给（你）做...',
        explanation_zh: '表达说话人主动为听话人做某事的亲昵承诺。'
      }
    ],
    comments: [
      {
        id: 'c_er_1',
        authorId: 'sunwoo',
        authorName: '선우',
        authorAvatar: IDOL_PHOTO_AVATARS.sunwoo,
        isIdol: true,
        korean: '야 영재야 비트 좋더라. 탑라인 내가 한번 얹어볼까?',
        translation_zh: '呀英宰啊，Beat挺不错的。要不我来搭一段Top line试试？',
        timestamp: Date.now() - 3600000 * 23.5
      }
    ]
  }
];
