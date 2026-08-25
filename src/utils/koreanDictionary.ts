/**
 * High-Accuracy Standard Korean-Chinese Comprehensive Dictionary & Sanitizer
 * Corrects OCR errors, corrupted Hanja table dumps, separates Chinese and English definitions,
 * removes noise/trailing count numbers, and generates authentic native Korean examples.
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
  // Common single-character & high-frequency core words
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
  '품': {
    word: '품',
    pos: '명사 (名词)',
    definition_zh: '怀抱、怀里；胸口；做工、工时',
    definition_en: 'bosom, chest; labor, work',
    example_kr: '따뜻한 어머니의 품에 편안하게 안겼어요.',
    example_zh: '安稳地依偎在母亲温暖的怀抱中。'
  },
  '금': {
    word: '금',
    pos: '명사 (名词)',
    hanja: '金',
    definition_zh: '黄金、金子；裂痕、缝隙',
    definition_en: 'gold; crack, line',
    example_kr: '값비싼 순금 반지를 생일 선물로 받았어요.',
    example_zh: '收到了贵重的纯金戒指作为生日礼物。'
  },
  '실': {
    word: '실',
    pos: '명사 (名词)',
    hanja: '絲 / 室',
    definition_zh: '线、缝纫线；房间、室',
    definition_en: 'thread, yarn; room, chamber',
    example_kr: '바늘에 실을 꿰어 떨어진 단추를 달았어요.',
    example_zh: '针穿上线把掉落的纽扣缝上了。'
  },
  '방': {
    word: '방',
    pos: '명사 (名词)',
    hanja: '房',
    definition_zh: '房间、屋子',
    definition_en: 'room, chamber',
    example_kr: '주말에 내 방을 깔끔하고 아늑하게 정리했어요.',
    example_zh: '周末把我的房间整理得干净又温馨。'
  },
  '가전제품': {
    word: '가전제품',
    pos: '명사 (名词)',
    hanja: '家電製品',
    definition_zh: '家用电器、家电',
    definition_en: 'home appliances, household electric appliances',
    example_kr: '이사하면서 새로운 가전제품을 여러 개 장만했어요.',
    example_zh: '搬家时购置了好几样新的家用电器。'
  },
  '음악회': {
    word: '음악회',
    pos: '명사 (名词)',
    hanja: '音樂會',
    definition_zh: '音乐会、演奏会',
    definition_en: 'concert, music concert',
    example_kr: '주말 저녁에 감동적인 클래식 음악회를 관람했어요.',
    example_zh: '周末晚上去观看了感人的古典音乐会。'
  },
  '욕실': {
    word: '욕실',
    pos: '명사 (名词)',
    hanja: '浴室',
    definition_zh: '浴室、盥洗室',
    definition_en: 'bathroom, shower room',
    example_kr: '외출에서 돌아와 욕실에서 깨끗이 씻었어요.',
    example_zh: '外出归来在浴室清洗得干干净净。'
  },
  '집안일': {
    word: '집안일',
    pos: '명사 (名词)',
    definition_zh: '家务、家务活、家事',
    definition_en: 'housework, household chores',
    example_kr: '주말에는 온 가족이 함께 집안일을 나누어 해요.',
    example_zh: '周末全家人一起分工做家务。'
  },
  '거실': {
    word: '거실',
    pos: '명사 (名词)',
    hanja: '居室',
    definition_zh: '客厅',
    definition_en: 'living room',
    example_kr: '저녁 식사 후 거실에 모여 TV를 보았어요.',
    example_zh: '吃完晚饭后聚集在客厅看电视。'
  },
  '부엌': {
    word: '부엌',
    pos: '명사 (名词)',
    definition_zh: '厨房',
    definition_en: 'kitchen',
    example_kr: '부엌에서 맛있는 된장찌개 냄새가 솔솔 풍겨요.',
    example_zh: '厨房里飘出阵阵美味的大酱汤香味。'
  },
  '침실': {
    word: '침실',
    pos: '명사 (名词)',
    hanja: '寢室',
    definition_zh: '卧室、寝室',
    definition_en: 'bedroom',
    example_kr: '아늑한 침실에서 푹 자고 일어났어요.',
    example_zh: '在温馨的卧室里美美地睡了一觉起来。'
  },
  '화장실': {
    word: '화장실',
    pos: '명사 (名词)',
    hanja: '化粧室',
    definition_zh: '洗手间、卫生间',
    definition_en: 'restroom, bathroom, toilet',
    example_kr: '식사 전에 화장실에서 손을 깨끗이 씻으세요.',
    example_zh: '吃饭前请在洗手间把手洗干净。'
  },
  '청소': {
    word: '청소',
    pos: '명사 (名词)',
    hanja: '淸掃',
    definition_zh: '打扫、清扫、清洁',
    definition_en: 'cleaning',
    example_kr: '주말 아침에 방 구석구석을 깨끗하게 청소했어요.',
    example_zh: '周末早晨把房间各个角落打扫得干干净净。'
  },
  '빨래': {
    word: '빨래',
    pos: '명사 (名词)',
    definition_zh: '洗衣服、待洗衣物',
    definition_en: 'laundry, washing',
    example_kr: '날씨가 맑아서 빨래가 아주 잘 말라요.',
    example_zh: '天气晴朗，衣服晒得很快。'
  },
  '설거지': {
    word: '설거지',
    pos: '명사 (名词)',
    definition_zh: '洗碗、洗餐具',
    definition_en: 'dishwashing',
    example_kr: '식사가 끝난 후 바로 설거지를 마쳤어요.',
    example_zh: '吃完饭后立刻洗好了碗筷。'
  },
  '요리': {
    word: '요리',
    pos: '명사 (名词)',
    hanja: '料理',
    definition_zh: '料理、做菜、烹饪',
    definition_en: 'cooking, cuisine, dish',
    example_kr: '친구들을 초대해서 맛있는 한국 요리를 대접했어요.',
    example_zh: '邀请朋友们做了一桌美味的韩国料理招待他们。'
  },
  '냉장고': {
    word: '냉장고',
    pos: '명사 (名词)',
    hanja: '冰箱 / 冷藏庫',
    definition_zh: '冰箱、冷藏柜',
    definition_en: 'refrigerator, fridge',
    example_kr: '신선한 과일과 채소를 냉장고에 보관했어요.',
    example_zh: '把新鲜的水果和蔬菜存放在冰箱里。'
  },
  '세탁기': {
    word: '세탁기',
    pos: '명사 (名词)',
    hanja: '洗濯機',
    definition_zh: '洗衣机',
    definition_en: 'washing machine',
    example_kr: '세탁기에 빨랫감을 넣고 전원을 켰어요.',
    example_zh: '把衣服放进洗衣机并按下了电源。'
  },
  '에어컨': {
    word: '에어컨',
    pos: '명사 (名词)',
    definition_zh: '空调',
    definition_en: 'air conditioner',
    example_kr: '무더운 여름에는 시원한 에어컨 바람이 최고예요.',
    example_zh: '在酷热的夏天吹凉爽的空调最舒服了。'
  },
  '청소기': {
    word: '청소기',
    pos: '명사 (名词)',
    hanja: '淸掃機',
    definition_zh: '吸尘器',
    definition_en: 'vacuum cleaner',
    example_kr: '무선 청소기로 거실 바닥을 간편하게 밀었어요.',
    example_zh: '用无线吸尘器轻便地吸了客厅地面。'
  },
  '전자레인지': {
    word: '전자레인지',
    pos: '명사 (名词)',
    definition_zh: '微波炉',
    definition_en: 'microwave oven',
    example_kr: '식은 음식을 전자레인지에 넣고 2분간 데웠어요.',
    example_zh: '把凉掉的食物放进微波炉加热了2分钟。'
  },
  '텔레비전': {
    word: '텔레비전',
    pos: '명사 (名词)',
    definition_zh: '电视、电视机',
    definition_en: 'television, TV',
    example_kr: '가족들과 거실에서 재미있는 텔레비전 프로그램을 봤어요.',
    example_zh: '和家人们在客厅看了有趣的电视节目。'
  },
  '컴퓨터': {
    word: '컴퓨터',
    pos: '명사 (名词)',
    definition_zh: '电脑、计算机',
    definition_en: 'computer',
    example_kr: '컴퓨터로 과제를 작성하고 자료를 검색했어요.',
    example_zh: '用电脑写作业并搜索了资料。'
  },
  '경영학': {
    word: '경영학',
    pos: '명사 (名词)',
    hanja: '經營學',
    definition_zh: '管理学、企业管理学、商科',
    definition_en: 'business administration, management',
    example_kr: '대학교에서 경영학을 전공하고 있어요.',
    example_zh: '正在大学主修企业管理学。'
  },
  '의학': {
    word: '의학',
    pos: '명사 (名词)',
    hanja: '醫學',
    definition_zh: '医学',
    definition_en: 'medical science, medicine',
    example_kr: '현대 의학의 발전으로 많은 질병이 치료되고 있어요.',
    example_zh: '随着现代医学的发展，很多疾病都得到了治愈。'
  },
  '내과': {
    word: '내과',
    pos: '명사 (名词)',
    hanja: '內科',
    definition_zh: '内科',
    definition_en: 'internal medicine',
    example_kr: '감기 기운이 있어서 근처 내과 병원에 다녀왔어요.',
    example_zh: '有点感冒症状，去了一趟附近的内科诊所。'
  },
  '외과': {
    word: '외과',
    pos: '명사 (名词)',
    hanja: '外科',
    definition_zh: '外科',
    definition_en: 'surgery, surgical department',
    example_kr: '발목을 삐어서 정형외과에서 진료를 받았어요.',
    example_zh: '扭伤了脚踝在骨外科接受了诊疗。'
  },
  '주차장': {
    word: '주차장',
    pos: '명사 (名词)',
    hanja: '駐車場',
    definition_zh: '停车场',
    definition_en: 'parking lot, parking garage',
    example_kr: '지하 주차장에 차를 안전하게 세웠어요.',
    example_zh: '把车安全地停在了地下停车场。'
  },
  '하차': {
    word: '하차',
    pos: '명사 (名词)',
    hanja: '下車',
    definition_zh: '下车；退出（节目等）',
    definition_en: 'getting off, disembarkation; departure',
    example_kr: '다음 정류장에서 하차할 준비를 하세요.',
    example_zh: '请做好在下一站下车的准备。'
  },
  '국적': {
    word: '국적',
    pos: '명사 (名词)',
    hanja: '國籍',
    definition_zh: '国籍',
    definition_en: 'nationality, citizenship',
    example_kr: '출입국 관리소에서 국적과 신분을 확인했어요.',
    example_zh: '在出入境管理局核实了国籍和身份。'
  },
  '입국': {
    word: '입국',
    pos: '명사 (名词)',
    hanja: '入國',
    definition_zh: '入境、入国',
    definition_en: 'entry into a country',
    example_kr: '인천공항을 통해 한국에 무사히 입국했어요.',
    example_zh: '通过仁川机场顺利入境韩国。'
  },
  '서재': {
    word: '서재',
    pos: '명사 (名词)',
    hanja: '書齋',
    definition_zh: '书房',
    definition_en: 'study, study room, library',
    example_kr: '조용한 서재에서 책을 읽으며 여유를 즐겼어요.',
    example_zh: '在安静的书房里看书享受悠闲时光。'
  },
  '보고서': {
    word: '보고서',
    pos: '명사 (名词)',
    hanja: '報告書',
    definition_zh: '报告、报告书',
    definition_en: 'report, paper',
    example_kr: '프로젝트 결과 보고서를 작성하여 팀장님께 제출했어요.',
    example_zh: '编写了项目结果报告书提交给了组长。'
  },
  '식탁': {
    word: '식탁',
    pos: '명사 (名词)',
    hanja: '食卓',
    definition_zh: '餐桌、饭桌',
    definition_en: 'dining table',
    example_kr: '식탁 위에 따뜻한 국과 밥을 차려 놓았어요.',
    example_zh: '在餐桌上摆好了热气腾腾的汤和米饭。'
  },
  '식당가': {
    word: '식당가',
    pos: '명사 (名词)',
    hanja: '食堂街',
    definition_zh: '美食街、餐厅区',
    definition_en: 'food court, restaurant street',
    example_kr: '백화점 지하 식당가에서 다양한 음식을 맛보았어요.',
    example_zh: '在百货商场地下的美食街品尝了各种各样的美食。'
  },
  '해저': {
    word: '해저',
    pos: '명사 (名词)',
    hanja: '海底',
    definition_zh: '海底',
    definition_en: 'seabed, sea floor, underwater',
    example_kr: '해저 탐사를 통해 신비로운 해양 생태계를 발견했어요.',
    example_zh: '通过海底探险发现了神秘的海洋生态系统。'
  },
  '해물': {
    word: '해물',
    pos: '명사 (名词)',
    hanja: '海物',
    definition_zh: '海鲜、海味',
    definition_en: 'seafood',
    example_kr: '신선한 해물이 듬뿍 들어간 해물파전을 먹었어요.',
    example_zh: '吃了放入大量新鲜海鲜的海鲜葱饼。'
  },
  '진동': {
    word: '진동',
    pos: '명사 (名词)',
    hanja: '振動',
    definition_zh: '震动、振动；（手机）震动模式',
    definition_en: 'vibration, shaking',
    example_kr: '수업 중에는 휴대전화를 진동 모드로 바꿔 주세요.',
    example_zh: '上课期间请将手机切换为震动模式。'
  },
  '부동산': {
    word: '부동산',
    pos: '명사 (名词)',
    hanja: '不動産',
    definition_zh: '不动产、房地产、中介所',
    definition_en: 'real estate, property agency',
    example_kr: '자취방을 구하기 위해 근처 부동산에 방문했어요.',
    example_zh: '为了租独居房去拜访了附近的房产中介。'
  },
  '고모': {
    word: '고모',
    pos: '명사 (名词)',
    hanja: '姑母',
    definition_zh: '姑姑、姑母',
    definition_en: 'paternal aunt',
    example_kr: '명절에 고모 댁을 찾아뵙고 인사를 드렸어요.',
    example_zh: '过节时拜访了姑姑家并向长辈问好。'
  },
  '고모부': {
    word: '고모부',
    pos: '명사 (名词)',
    hanja: '姑母夫',
    definition_zh: '姑父、姑丈',
    definition_en: "paternal aunt's husband, uncle",
    example_kr: '고모부께서 친절하게 맛있는 과일을 깎아 주셨어요.',
    example_zh: '姑父热情地为我削了美味的水果。'
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

export interface CleanedDefinitionResult {
  meaning_zh: string;
  meaning_en: string;
}

/**
 * Intelligent definition cleaner:
 * 1. Strips out trailing index/count numbers (e.g. "100", "01", "#5", "(100)")
 * 2. Cleanly separates Chinese definitions from English definitions
 * 3. Filters out corrupted Hangul-only column dumps (e.g. "경영학, 의학 내과...")
 */
export function cleanAndSeparateDefinitions(rawText: string, hangulWord?: string): CleanedDefinitionResult {
  const wordKey = (hangulWord || '').trim();
  const dict = KOREAN_STANDARD_DICTIONARY[wordKey];

  if (!rawText || rawText.trim().length === 0) {
    if (dict) {
      return { meaning_zh: dict.definition_zh, meaning_en: dict.definition_en || '' };
    }
    return { meaning_zh: `${wordKey || '常用词汇'}`, meaning_en: '' };
  }

  let text = rawText.trim();

  // 1. Remove trailing numbers, rank counters, or page markers (e.g. "100", "Housework 100", "#100", "(50)")
  text = text.replace(/(?:\s+|[,\-_/|]\s*)(?:\(\d+\)|\[\d+\]|#\d+|No\.\s*\d+|\d+)\s*$/i, '');
  text = text.replace(/^(\d+[\.、\)\s]+|[①②③④⑤⑥⑦⑧⑨⑩\(\[\{]\d+[\)\]\}]\s*)/, '');
  text = text.replace(/\b(hobbies|housework|daily|topic|chapter|unit|lesson|section)\s*\d+/gi, '');

  // 2. Check if string is corrupted:
  // (a) Contains ONLY Hangul and commas/spaces without any Chinese character
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const hasHangul = /[\uac00-\ud7a3]/.test(text);
  const hasEnglish = /[a-zA-Z]{2,}/.test(text);

  // If definition has ONLY Hangul and NO Chinese or English, it is an OCR column misalignment
  if (hasHangul && !hasChinese && !hasEnglish) {
    if (dict) {
      return {
        meaning_zh: dict.definition_zh,
        meaning_en: dict.definition_en || ''
      };
    }
    return {
      meaning_zh: `${wordKey || '常用词汇'}`,
      meaning_en: ''
    };
  }

  // (b) Corrupted Hanja list check (e.g. "人 인 者 자 會 회")
  if (isCorruptedHanjaList(text)) {
    if (dict) {
      return {
        meaning_zh: dict.definition_zh,
        meaning_en: dict.definition_en || ''
      };
    }
    return {
      meaning_zh: `${wordKey || '常用词汇'}`,
      meaning_en: ''
    };
  }

  // 3. Separate Chinese and English definitions
  let zhPart = '';
  let enPart = '';

  if (hasChinese && hasEnglish) {
    // Check if English is at the end: e.g. "家务 Housework" or "家用电器 / Home appliances"
    const englishMatch = text.match(/[a-zA-Z\s,;'/()\-]+$/);
    if (englishMatch && englishMatch[0].trim().length >= 2 && englishMatch.index && englishMatch.index > 0) {
      enPart = englishMatch[0].replace(/^[\s,/|(\-]+|[\s,/|)\-]+$/g, '').trim();
      zhPart = text.substring(0, englishMatch.index).replace(/[\s,/|(\-]+$/, '').trim();
    } else {
      // Split by common delimiters (tabs, slashes, pipes)
      const parts = text.split(/[\t|/]/);
      const zhArr: string[] = [];
      const enArr: string[] = [];
      for (const p of parts) {
        const trimmedP = p.trim();
        if (/[\u4e00-\u9fa5]/.test(trimmedP)) {
          zhArr.push(trimmedP);
        } else if (/[a-zA-Z]{2,}/.test(trimmedP)) {
          enArr.push(trimmedP);
        }
      }
      zhPart = zhArr.join('； ') || text;
      enPart = enArr.join('; ');
    }
  } else if (hasChinese) {
    zhPart = text;
    enPart = '';
  } else if (hasEnglish) {
    zhPart = '';
    enPart = text;
  } else {
    zhPart = text;
    enPart = '';
  }

  // Clean trailing punctuation and numbers
  zhPart = zhPart.replace(/[\d\s]+$/, '').replace(/^[:：\s]+/, '').trim();
  enPart = enPart.replace(/[\d\s]+$/, '').replace(/^[:：\s]+/, '').trim();

  // If zhPart is empty or just template, fallback to dict
  if ((!zhPart || zhPart.length < 1 || zhPart.includes('常用词汇')) && dict) {
    zhPart = dict.definition_zh;
    enPart = enPart || dict.definition_en || '';
  }

  return {
    meaning_zh: zhPart || (dict ? dict.definition_zh : rawText.replace(/\d+$/, '').trim()),
    meaning_en: enPart || (dict ? dict.definition_en || '' : '')
  };
}

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

  // 1. Clean and separate Chinese and English definitions
  const rawMeaningCombined = item.meaning_zh || item.meaning_en || '';
  const { meaning_zh: cleanMeaningZh, meaning_en: cleanMeaningEn } = cleanAndSeparateDefinitions(
    rawMeaningCombined,
    wordKey
  );

  let cleanType = item.type || '명사 (名词)';
  let cleanExampleKr = item.example_kr || '';
  let cleanExampleZh = item.example_zh || '';
  let cleanHanja = item.hanja_or_root || '';

  if (dict) {
    if (!cleanHanja && dict.hanja) {
      cleanHanja = dict.hanja;
    }
    if (!cleanType || cleanType.includes('어휘')) {
      cleanType = dict.pos;
    }
    // Replace robotic templates: e.g. "식을/를 사용한 실전 표현이에요."
    if (!cleanExampleKr || cleanExampleKr.includes('사용한 실전 표현') || cleanExampleKr.includes('을/를 사용한') || cleanExampleKr.includes('일상에서')) {
      cleanExampleKr = dict.example_kr;
      cleanExampleZh = dict.example_zh;
    }
  } else {
    if (!cleanExampleKr || cleanExampleKr.includes('사용한 실전 표현') || cleanExampleKr.includes('을/를 사용한')) {
      cleanExampleKr = `일상에서 '${wordKey}' 단어를 자연스럽게 활용해 보세요.`;
      cleanExampleZh = `在日常韩语中自然运用“${cleanMeaningZh || wordKey}”。`;
    }
  }

  return {
    ...item,
    meaning_zh: cleanMeaningZh,
    meaning_en: cleanMeaningEn || (item.meaning_en && item.meaning_en !== cleanMeaningZh ? item.meaning_en : ''),
    type: cleanType,
    example_kr: cleanExampleKr,
    example_zh: cleanExampleZh,
    hanja_or_root: cleanHanja || undefined,
  };
}
