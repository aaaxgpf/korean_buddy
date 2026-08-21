import { SpeakingTask } from '../types';

export const INITIAL_SPEAKING_TASKS: SpeakingTask[] = [
  // ==========================================
  // 1. 李贤在 (THE BOYZ) 专属场景
  // ==========================================
  {
    id: 's_1',
    title_en: 'Heartfelt Compliment & Meal Talk to Hyunjae at Fansign',
    scenario_zh: '面对李贤在（Hyunjae），夸赞他的舞台美貌并幽默关怀他有没有按时吃炸鸡。',
    scenario_en: 'Facing Hyunjae, compliment his visuals and playfully ask if he ate his favorite chicken.',
    target_korean: '현재 오빠 무대 보려고 오늘 하루 종일 기다렸어요! 오늘 저녁은 치킨 먹었나요?',
    romanization: 'hyeon-jae o-ppa mu-dae bo-ryeo-go o-neul ha-ru jong-il gi-da-ryeo-sseo-yo! o-neul jeo-nyeog-eun chi-kin meo-geon-na-yo?',
    translation_zh: '为了看贤在欧巴的舞台，我今天等了整整一天！今天晚饭吃炸鸡了吗？',
    translation_en: 'I waited all day just to watch your stage, Hyunjae oppa! Did you eat fried chicken for dinner?',
    key_grammar: 'V + -(으)려고 (为了...) / 하루 종일 (整整一天) / -았/었나요? (礼貌疑问句尾)',
    cultural_note: '贤在是著名的炸鸡狂热者与幽默担当，提炸鸡能瞬间拉近彼此的聊天距离。',
    difficulty: 'beginner',
    category: 'Fandom & Idol',
  },

  // ==========================================
  // 2. 孙英宰 Eric (THE BOYZ) 专属场景
  // ==========================================
  {
    id: 's_2',
    title_en: 'High Energy Bilingual Motivation with Eric',
    scenario_zh: '遇到学习困难或健身疲倦时，和阳光活力忙内孙英宰一起大喊口号鼓励彼此。',
    scenario_en: 'When facing study challenges, shout energetic catchphrases with Eric to hype each other up.',
    target_korean: '오늘도 지치지 말고 우리 끝까지 파이팅 하자! 에릭 에너지 받아서 할 수 있어!',
    romanization: 'o-neul-do ji-chi-ji mal-go u-ri kkeut-kka-ji pa-i-ting ha-ja! e-rik e-neo-ji ba-da-seo hal su i-sseo!',
    translation_zh: '今天也不要疲倦，我们一起奋斗到底加油吧！吸收到英宰的能量一定能做到！',
    translation_en: 'Let’s not get tired today and fight until the end! With Eric’s energy, I can do it!',
    key_grammar: 'V + -지 말다 (禁止/不要) / -자 (平语共动词尾 "一起做吧") / -(으)ㄹ 수 있다 (能够)',
    cultural_note: '英宰充满洛杉矶阳光能量，平语 "파이팅 하자! 할 수 있어!" 是非常典型的好友间热血打气表达。',
    difficulty: 'intermediate',
    category: 'Compliment & Emotion',
  },

  // ==========================================
  // 3. 金泳勋 (THE BOYZ) 专属场景
  // ==========================================
  {
    id: 's_3',
    title_en: 'Healing Bakery Cafe Greeting with Younghoon',
    scenario_zh: '在安静的面包房角落，向金泳勋递上刚出炉的牛角包，道声暖心问候。',
    scenario_en: 'In a quiet bakery corner, hand Younghoon a freshly baked croissant with a warm greeting.',
    target_korean: '영훈아, 갓 구운 크루아상이랑 따뜻한 커피 가져왔어. 천천히 먹으면서 쉬어...',
    romanization: 'yeong-hu-na, gat gu-un keu-ru-a-sang-i-rang tta-tteut-han keo-pi ga-jyeo-wa-sseo. cheon-cheon-hi meo-geu-myeon-seo swi-eo...',
    translation_zh: '泳勋呀，我拿来了刚烤好的牛角包和热咖啡。慢慢吃着休息一下吧...',
    translation_en: 'Younghoon, I brought freshly baked croissants and warm coffee. Eat slowly and rest a bit...',
    key_grammar: '갓 + 过去分词 (刚做好的) / N + (이)랑 (和) / -(으)면서 (一边...一边...) / 쉬다 (休息)',
    cultural_note: '泳勋被粉丝亲切称为“面包勋 (빵훈)”，对烘焙面包情有独钟，说话温柔细腻。',
    difficulty: 'intermediate',
    category: 'Daily Life',
  },

  // ==========================================
  // 4. 大崎将太郎 Shotaro (RIIZE) 专属场景
  // ==========================================
  {
    id: 's_4',
    title_en: 'Asking Shotaro for Dance Killing Part Tips in Practice Room',
    scenario_zh: '在练习室请教舞王将太郎如何卡准节拍动作，并感谢他的耐心示范。',
    scenario_en: 'In the practice room, ask dance prodigy Shotaro how to catch the killing part beat.',
    target_korean: '타로 쌤! 이 킬링 파트 비트 어떻게 쪼개서 타는지 한 번만 다시 보여줄 수 있어요?',
    romanization: 'ta-ro ssaem! i kil-ling pa-teu bi-teu eo-tteo-ke jjo-gae-seo ta-neun-ji han beon-man da-si bo-yeo-jul su i-sseo-yo?',
    translation_zh: '将太郎老师！这个Killing Part的节拍怎么细分卡点的，可以再给我示范一次吗？',
    translation_en: 'Taro teacher! Could you show me once more how you break down the beat in this killing part?',
    key_grammar: '비트를 타다 (踩点/跟节拍) / -(으)ㄴ/는지 (如何做...) / -아/어 주다 (帮我做)',
    cultural_note: '将太郎舞蹈实力公认顶级且性格如小水獭般谦逊温柔，称呼 "쌤 (老师简写)" 既尊重又亲切。',
    difficulty: 'intermediate',
    category: 'Fandom & Idol',
  },

  // ==========================================
  // 5. 郑成灿 Sungchan (RIIZE) 专属场景
  // ==========================================
  {
    id: 's_5',
    title_en: 'Gym Workout Check-in & Hanwoo Beef Promise with Sungchan',
    scenario_zh: '在健身房做完深蹲拉伸后，和185cm元气小鹿郑成灿约好练完去大吃韩牛补充蛋白质。',
    scenario_en: 'After gym squats, agree with Sungchan to go eat Hanwoo beef to fuel up on protein.',
    target_korean: '성찬아, 오늘 득근 제대로 했다! 운동 끝났으니까 단백질 보충하러 한우 먹으러 갈까?',
    romanization: 'seong-chan-a, o-neul deuk-geun je-dae-ro haet-da! un-dong kkeun-na-sseu-ni-kka dan-baek-jil bo-chung-ha-reo han-u meo-geu-reo gal-kka?',
    translation_zh: '成灿啊，今天增肌练得超到位！运动结束了，我们要不要去吃韩牛补充蛋白质？',
    translation_en: 'Sungchan, crushed our workout today! Now that we are done, shall we go eat Hanwoo beef for protein?',
    key_grammar: '득근하다 (增肌长肌肉) / -(으)니까 (因为...所以) / -(으)러 가다 (去做某事)',
    cultural_note: '成灿身材高大酷爱健身与牛肉，常用词 "득근 (增肌)" 是韩国健身圈的国民热词。',
    difficulty: 'intermediate',
    category: 'Daily Life',
  },

  // ==========================================
  // 6. 申惟 Shinyu (TWS) 专属场景
  // ==========================================
  {
    id: 's_6',
    title_en: 'Soft-spoken Campus Greeting with Shinyu',
    scenario_zh: '戴着有线耳机的申惟在图书馆门口走来，你走上前轻声向他送上一句温暖的问候。',
    scenario_en: 'Shinyu walks by wearing wired earphones; you step up and greet him softly.',
    target_korean: '신유 씨, 오늘 날씨가 참 맑네요... 오늘도 많이 바쁠 텐데 무리하지 말고 힘내요.',
    romanization: 'sin-yu ssi, o-neul nal-ssi-ga cham mang-ne-yo... o-neul-do ma-ni ba-ppeul ten-de mu-ri-ha-ji mal-go him-nae-yo.',
    translation_zh: '申惟，今天天气真晴朗呢... 今天应该也很忙吧，别勉强自己，加油哦。',
    translation_en: 'Shinyu, the weather is so clear today... You must be busy today too, please take care and fighting.',
    key_grammar: '-(으)ㄹ 텐데 (推测背景: 应该会...) / 무리하지 말다 (不要逞强/别太累) / 힘내다 (加油)',
    cultural_note: '申惟性格羞涩内敛，说话轻声细语极有教养，用 "-네요 / -텐데" 的柔和句尾最为契合。',
    difficulty: 'intermediate',
    category: 'Compliment & Emotion',
  },

  // ==========================================
  // 7. 经典生活与首尔旅行场景
  // ==========================================
  {
    id: 's_7',
    title_en: 'Ordering Iced Americano & Croissant in Seongsu Cafe',
    scenario_zh: '在首尔圣水洞的时尚咖啡厅前台，向店员点一杯低咖啡因冰美式和一个可颂面包。',
    scenario_en: 'At the counter of a trendy cafe in Seongsu-dong, order a decaf iced americano and a croissant.',
    target_korean: '디카페인 아이스 아메리카노 한 잔이랑 크루아상 하나 주세요.',
    romanization: 'di-ka-pe-in a-i-seu a-me-ri-ka-no han jan-i-rang keu-ru-a-sang ha-na ju-se-yo.',
    translation_zh: '请给我一杯低因冰美式咖啡和一个牛角包。',
    translation_en: 'Please give me one decaf iced americano and one croissant.',
    key_grammar: 'N + (이)랑 (并列助词 "和") / N + 주세요 (请求 "请给我...")',
    cultural_note: '韩国年轻人非常注重咖啡选择，“얼죽아”(冻死也要喝冰美式) 是国民习惯，点单时用 ~주세요 最为自然。',
    difficulty: 'beginner',
    category: 'Cafe',
  },
  {
    id: 's_8',
    title_en: 'Asking for Subway Directions to Hongdae at Myeongdong',
    scenario_zh: '在首尔地铁站向工作人员询问如何换乘前往弘益大学入口站。',
    scenario_en: 'Ask a subway station staff how to transfer to Hongik Univ. Station.',
    target_korean: '실례지만 홍대입구역으로 가려면 몇 호선을 타야 하나요?',
    romanization: 'sil-lye-ji-man hong-dae-ip-gu-yeog-eu-ro ga-ryeo-myeon myeot ho-seon-eul ta-ya ha-na-yo?',
    translation_zh: '打扰一下，请问如果想去弘大入口站的话，应该坐几号线呢？',
    translation_en: 'Excuse me, if I want to go to Hongik Univ. Station, which line should I take?',
    key_grammar: '실례지만 (不好意思/劳驾) / V + -(으)려면 (如果想要打算做...) / V + -아야 하나요? (应该/必须做吗?)',
    cultural_note: '问路前先说 "실례지만 (不好意思失礼了)" 会让你的韩语瞬间显得非常地道有礼貌。',
    difficulty: 'advanced',
    category: 'Travel',
  },
];
