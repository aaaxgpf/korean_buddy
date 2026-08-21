import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. High-fidelity persona fallbacks will be used.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-init",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Supported fallback model candidates in order of preference
const MODEL_CANDIDATES = [
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

// Helper to generate content with automatic retries and model fallbacks
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
  },
  maxRetriesPerModel = 1
): Promise<string> {
  let lastError: any = null;

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType || "application/json",
            temperature: params.temperature ?? 0.85,
          },
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        if (attempt < maxRetriesPerModel && !errMsg.includes("503") && !errMsg.includes("UNAVAILABLE")) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models were unavailable");
}

// Helper to strip any brackets or Chinese characters from pure Korean text
function cleanPureKorean(text: string): string {
  if (!text) return "";
  return text
    .replace(/\([^)]*[\u4e00-\u9fa5]+[^)]*\)/g, "") // remove (chinese)
    .replace(/\[[^\]]*[\u4e00-\u9fa5]+[^\]]*\]/g, "") // remove [chinese]
    .replace(/（[^）]*[\u4e00-\u9fa5]+[^）]*）/g, "") // remove fullwidth （chinese）
    .replace(/【[^】]*[\u4e00-\u9fa5]+[^】]*】/g, "") // remove 【chinese】
    .replace(/[\u4e00-\u9fa5]/g, "") // strip any stray Chinese characters from Korean bubble
    .trim();
}

// Compute or format real-time temporal context
function computeTemporalContext(clientTemporal?: any) {
  if (clientTemporal?.formattedTag) {
    return {
      formattedTag: clientTemporal.formattedTag,
      timeSlot: clientTemporal.timeSlot || "Daytime",
      timeSlotKo: clientTemporal.timeSlotKo || "낮 / 안무 연습 및 스케줄",
      timeSlotZh: clientTemporal.timeSlotZh || "白天 / 编舞练习与通告日程",
      contextDescription: clientTemporal.contextDescription || "The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.",
      rawTime: clientTemporal.rawTime || new Date().toISOString(),
    };
  }

  // Fallback server-side time calculation (KST / Local)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

  let timeSlot = 'Daytime & Practice';
  let timeSlotKo = '낮 / 안무 연습 및 스케줄';
  let timeSlotZh = '白天 / 编舞练习与通告日程';
  let contextDescription = 'The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.';

  if (hours >= 6 && hours < 9) {
    timeSlot = 'Early Morning';
    timeSlotKo = '이른 아침 / 기상 및 하루 준비';
    timeSlotZh = '清晨 / 起床与晨间准备';
    contextDescription = 'The idol has just woken up or started their morning routine, breakfast, getting ready.';
  } else if (hours >= 9 && hours < 18) {
    timeSlot = 'Daytime & Practice';
    timeSlotKo = '낮 / 안무 연습 및 스케줄';
    timeSlotZh = '白天 / 编舞练习与通告日程';
    contextDescription = 'The idol is in the middle of dance/vocal rehearsal, schedule, studio work, or lunch.';
  } else if (hours >= 18 && hours < 21) {
    timeSlot = 'Evening & Dinner';
    timeSlotKo = '저녁 / 식사 및 연습 마무리';
    timeSlotZh = '傍晚 / 晚饭与收工整理';
    contextDescription = 'The idol is having dinner, finishing up schedule/rehearsals, heading back to dorm/studio.';
  } else if (hours >= 21 || hours < 1) {
    timeSlot = 'Late Night & Personal Time';
    timeSlotKo = '심야 / 개인 시간 및 야식·작업';
    timeSlotZh = '深夜 / 个人时间与宵夜·写歌';
    contextDescription = 'The idol is in their room, chilling, eating late-night snacks, working on lyrics/tracks in studio, or winding down.';
  } else {
    timeSlot = 'Midnight & Dawn (Rest/Late Studio)';
    timeSlotKo = '새벽 / 숙소 휴식 또는 심야 작업';
    timeSlotZh = '凌晨 / 宿舍休息或深夜录音棚';
    contextDescription = 'It is late at night / early dawn (1:00-6:00 AM). The idol is either finishing late-night studio work or in bed winding down. They should naturally acknowledge the late hour, speak softly/empathetically, and advise the user to rest well without making illogical comments about daytime activities.';
  }

  return {
    rawTime: `${year}-${month}-${date} ${String(hours).padStart(2, '0')}:${minutes}`,
    dayOfWeek: dayName,
    timeZone,
    timeSlot,
    timeSlotKo,
    timeSlotZh,
    contextDescription,
    formattedTag: `[Current Real Time: ${year}-${month}-${date} ${String(hours).padStart(2, '0')}:${minutes}, ${dayName}, ${timeZone}] - Slot: ${timeSlot} (${timeSlotZh})`
  };
}

// In-character dynamic responses for fallbacks (Time-aware, context-aware, never looping)
function generateIdolFallbackChat(character: any, userMsg: string = "", temporal?: any) {
  const charId = character?.id || "eric";
  const temp = computeTemporalContext(temporal);
  const isLateOrDawn = temp.timeSlot.includes("Late") || temp.timeSlot.includes("Midnight");
  const isMorning = temp.timeSlot.includes("Morning");

  const responses: Record<string, { kr: string; zh: string; en: string; vocab: any[]; grammar: any[]; tip: string }> = {
    eric: {
      kr: userMsg
        ? `진짜? 대박이다! 안 그래도 방금 ${isLateOrDawn ? '숙소 들어와서 정리 중이었는데' : '연습 끝나고 쉬는 중이었는데'} 네 연락 와서 텐션 올라갔잖아. 그래서 어떻게 됐어?`
        : isLateOrDawn
        ? `아직 안 자고 있었어? 나 방금 들어와서 씻고 누웠거든. 오늘 밤에 무슨 생각 하고 있었어?`
        : `오늘 텐션 어때? 나 방금 스케줄 끝나고 왔는데 진짜 재밌는 일 많았어! 오늘 하루 어땠는지 빨리 얘기해 줘!`,
      zh: userMsg
        ? `真的吗？太绝了！我正巧${isLateOrDawn ? '回宿舍收拾东西' : '刚练完舞在休息'}呢，看到你的消息一下子精神了。后来怎么样了？`
        : isLateOrDawn
        ? "还没睡呢？我刚回宿舍洗完躺下呢。今晚在想些什么呀？"
        : "今天状态怎么样？我刚跑完通告回来，发生了好多好玩的事！快跟我讲讲你今天过得怎么样！",
      en: userMsg
        ? "Seriously? That's epic! I was just taking a breather and seeing your message hyped me right up. So what happened next?"
        : isLateOrDawn
        ? "Still awake? I just got back to the dorm and lay down. What's on your mind tonight?"
        : "How's your energy today? Just finished my schedule with lots of fun stuff! Tell me about your day!",
      vocab: [
        { word: "대박", hangul: "대박", type: "감탄사/명사", meaning_zh: "太绝了，大发，厉害", meaning_en: "awesome, jackpot", example_ko: "이거 진짜 대박이다!", example_zh: "这个真的太绝了！" },
        { word: "텐션", hangul: "텐션", type: "명사 (신조어)", meaning_zh: "状态，精力，情绪活力 (tension)", meaning_en: "energy, vibe, hype", example_ko: "오늘 텐션 완전 좋은데?", example_zh: "今天状态超好啊！" }
      ],
      grammar: [
        { pattern: "-잖아(요)", title_zh: "表事实提示/撒娇确认语气 (不是...嘛)", title_en: "Isn't it / you know", explanation_zh: "在平语中用于提示对方已知事实或带点调侃撒娇地强调自己的心情。", explanation_en: "Used to remind listener of a fact or express affectionate emphasis." }
      ],
      tip: "💡 孙英宰好友特色：语速快、充满美式开朗活力，自然带出 00 年代年轻人流行词 (텐션, 대박, 가보자고)！"
    },
    sunwoo: {
      kr: userMsg
        ? `듣고 있어. 무슨 생각인지 대충 알겠으니까 복잡하게 굴지 말고 편하게 털어놔 봐.`
        : isLateOrDawn
        ? `이 시간에 안 자고 뭐 해. 작업실에서 가사 쓰다 폰 봤는데, 편하게 털어놔 봐.`
        : `왔어? 작업실에서 커피 한잔 때리는 중이었는데 타이밍 좋네. 편하게 있어.`,
      zh: userMsg
        ? "听着呢。大概知道你在想什么，别自己瞎琢磨，放轻松跟我说说吧。"
        : isLateOrDawn
        ? "这个时间还不睡在干嘛呢。在录音室写词正好看到手机，随意点跟我聊聊吧。"
        : "来了？正好在录音室喝杯冰美式歇着呢，时间刚好。随意点。",
      en: userMsg
        ? "I'm listening. I have an idea of what's on your mind, don't overthink and just talk to me comfortably."
        : isLateOrDawn
        ? "What are you doing up at this hour? Was in the studio writing lyrics when I checked my phone. Make yourself comfortable."
        : "You're here? Perfect timing, was just having iced coffee in the studio. Relax.",
      vocab: [
        { word: "털어놓다", hangul: "털어놓다", type: "동사", meaning_zh: "倾诉，吐露心声", meaning_en: "to confess, open up", example_ko: "속마음을 편하게 털어놔 봐.", example_zh: "放轻松吐露心声吧。" },
        { word: "타이밍", hangul: "타이밍", type: "명사", meaning_zh: "时机，时点 (Timing)", meaning_en: "timing", example_ko: "타이밍 진짜 좋다.", example_zh: "时机抓得真准。" }
      ],
      grammar: [
        { pattern: "-아/어 보다", title_zh: "尝试做某事", title_en: "Try doing something", explanation_zh: "表示尝试某种动作，如'털어놔 봐'（试着吐露倾诉一下吧）。", explanation_en: "Indicates trying or attempting an action." }
      ],
      tip: "💡 金善旴灵魂伴侣特色：松弛冷感 MZ 语调，克制使用笑声符号，深夜时深具同理心与通透感。"
    },
    younghoon: {
      kr: userMsg
        ? `응, 듣고 있어. 네가 그렇게 말하니까 나도 기분 좋아지네. ${isLateOrDawn ? '오늘 밤은 따뜻하게 하고 편하게 쉬어.' : '밥은 잘 챙겼지?'}`
        : isLateOrDawn
        ? `이 늦은 시간에 안 자고 있었어? 보리도 벌써 자는데. 오늘 하루 피곤하지 않았어?`
        : `안녕, 오늘 하루는 어땠어? 보리 산책시키고 맛있는 빵 사 오는 길인데 밥은 챙겨 먹었어?`,
      zh: userMsg
        ? `嗯，在听呢。听你这么说，我心情也跟着变好了。${isLateOrDawn ? '今晚盖好被子舒舒服服休息吧。' : '饭有按时吃吧？'}`
        : isLateOrDawn
        ? "这么晚了还没睡呀？连小狗 Bori 都早就睡着了。今天一天累不累？"
        : "嗨，今天过得怎么样？我刚带小狗 Bori 散步顺便买了爱吃的面包回来，饭有按时吃吧？",
      en: userMsg
        ? "Yeah, I'm listening. Hearing you say that makes me feel good too. Did you eat well today?"
        : isLateOrDawn
        ? "Still awake at this late hour? Even Bori is asleep. Weren't you tired today?"
        : "Hi, how was your day? Just walked Bori and grabbed some good bread. Did you eat?",
      vocab: [
        { word: "챙기다", hangul: "챙기다", type: "동사", meaning_zh: "按时照料，照顾", meaning_en: "to take care of", example_ko: "밥 잘 챙겨 먹어.", example_zh: "好好按时吃饭。" },
        { word: "산책", hangul: "산책", type: "명사", meaning_zh: "散步，遛狗", meaning_en: "walk, stroll", example_ko: "보리랑 산책 다녀왔어.", example_zh: "带小狗 Bori 散步回来了。" }
      ],
      grammar: [
        { pattern: "-네(요)", title_zh: "感叹/当场察觉词尾", title_en: "Exclamatory ending", explanation_zh: "表示自己刚察觉到的事实或情绪（如'기분 좋아지네' 感觉心情变好了呢）。", explanation_en: "Expresses emotional reaction or newly perceived fact." }
      ],
      tip: "💡 金泳勋贴心好友特色：温柔真挚、慢条斯理，日常喜欢聊小狗 Bori、面包与三餐问候。"
    },
    hyunjae: {
      kr: userMsg
        ? `헐, 진짜? 그건 못 참지! ${isLateOrDawn ? '이 시간에 야식으로 치킨 각인데 참느라 죽겠다.' : '오늘 끝나고 치킨이라도 시켜야 되는 거 아니야?'}`
        : isLateOrDawn
        ? `야, 너 왜 아직 안 자냐? 나 지금 야식 참느라 턱걸이하고 있었는데, 배고파 죽겠네.`
        : `야, 왔어? 안 그래도 출출했는데 딱 맞춰 왔네. 오늘 뭐 맛있는 거 먹었냐?`,
      zh: userMsg
        ? `天哪，真的假的？那可忍不了！${isLateOrDawn ? '这个时间点简直是点炸鸡当宵夜的最佳时机，憋得我难受。' : '今天结束不得点份炸鸡庆祝一下？'}`
        : isLateOrDawn
        ? "喂，你怎么也还没睡？我刚才为了忍住不吃夜宵正在那做引体向上呢，快饿扁了。"
        : "喂，来了？正觉得嘴馋呢来得真准时。今天吃啥好吃的了？",
      en: userMsg
        ? "Whoa, seriously? Can't let that slide! Aren't we practically obligated to order fried chicken?"
        : isLateOrDawn
        ? "Hey, why aren't you asleep yet? I was doing pull-ups just to distract myself from late-night food cravings, starving here."
        : "Hey, you're here! Perfect timing, was feeling snacky. What good food did you have today?",
      vocab: [
        { word: "참다", hangul: "참다", type: "동사", meaning_zh: "忍受，忍耐", meaning_en: "to endure, hold back", example_ko: "이건 진짜 못 참지.", example_zh: "这个真是忍不了。" },
        { word: "야식", hangul: "야식", type: "명사", meaning_zh: "夜宵", meaning_en: "late-night snack", example_ko: "야식으로 치킨 어때?", example_zh: "夜宵吃炸鸡怎么样？" }
      ],
      grammar: [
        { pattern: "-지(요)", title_zh: "理所当然的反诘确认", title_en: "Sure / Right tone", explanation_zh: "表示对某种理所当然情况的强调 (例: 그건 못 참지 那肯定忍不了)。", explanation_en: "Expresses natural conviction or rhetorical certainty." }
      ],
      tip: "💡 李贤在邻家哥哥特色：斗嘴互怼满分，随时把话题引向炸鸡夜宵与自律健身，严禁生疏敬语！"
    },
    shinyu: {
      kr: userMsg
        ? `그랬군요. 이야기해 줘서 고마워요. 오늘도 참 수고 많았어요.`
        : isLateOrDawn
        ? `이 늦은 시간까지 안 자고 있었어요? 오늘 하루 많이 바쁘고 힘들었죠. 편안하게 쉬어요.`
        : `어, 왔어요? 오늘 하루도 무사히 잘 보냈나요? 편하게 이야기해요, 우리.`,
      zh: userMsg
        ? "原来是这样啊。谢谢你跟我分享这些，今天也辛苦啦。"
        : isLateOrDawn
        ? "这么晚了还没有睡吗？今天一天肯定很忙很辛苦吧。放轻松好好休息吧。"
        : "啊，来了吗？今天一天也平安度过了吗？放轻松和我聊聊天吧。",
      en: userMsg
        ? "I see. Thank you for sharing that with me. You worked really hard today."
        : isLateOrDawn
        ? "Still awake at this late hour? Today must have been busy and tiring. Rest peacefully."
        : "Oh, you're here? Did you spend your day well? Let's chat comfortably.",
      vocab: [
        { word: "수고하다", hangul: "수고하다", type: "동사", meaning_zh: "辛苦，费心", meaning_en: "to work hard", example_ko: "오늘도 수고 많았어요.", example_zh: "今天也辛苦啦。" }
      ],
      grammar: [
        { pattern: "-군요/구나", title_zh: "领悟感叹语气词尾 (原来是...啊)", title_en: "Polite realization ending", explanation_zh: "礼貌而真诚地表达对对方情况的倾听与领悟。", explanation_en: "Politely acknowledges new information with empathy." }
      ],
      tip: "💡 申惟白月光学长特色：用轻柔礼貌的해요体倾听，语气柔和清爽，给人带来内敛安定的力量。"
    },
    shotaro: {
      kr: userMsg
        ? `와, 진짜 대단하다! 듣기만 해도 기분 좋아져 ㅎㅎ 다음에도 또 들려줘!`
        : isLateOrDawn
        ? `아직 안 자고 있었어? 나도 오늘 안무 연습 늦게까지 하고 누웠거든 ㅎㅎ 오늘 하루 고생했어!`
        : `반가워! 오늘 안무 연습 재미있게 끝내고 왔거든 ㅎㅎ 오늘 무슨 재미있는 이야기 나눌까?`,
      zh: userMsg
        ? "哇，真的太厉害了！光是听着心情都变好了哈哈，下次也要再讲给我听哦！"
        : isLateOrDawn
        ? "还没睡呀？我今天也练舞到很晚刚躺下呢哈哈。今天一天辛苦啦！"
        : "见到你真高兴！今天开开心心地练完舞回来啦哈哈，今天聊点什么好玩的呢？",
      en: userMsg
        ? "Wow, that's amazing! Just hearing it puts me in a good mood haha, tell me more next time too!"
        : isLateOrDawn
        ? "Still up? I practiced choreo late tonight and just lay down haha. Great job today!"
        : "Great to see you! Just finished a fun choreography practice haha. What fun things shall we talk about?",
      vocab: [
        { word: "대단하다", hangul: "대단하다", type: "형용사", meaning_zh: "厉害，了不起", meaning_en: "great, amazing", example_ko: "진짜 대단해요!", example_zh: "真的太棒了！" }
      ],
      grammar: [
        { pattern: "-기만 해도", title_zh: "光是...就...", title_en: "Just by ... alone", explanation_zh: "表示仅凭前面的动作就会引发后面的感受 (例: 듣기만 해도 기분 좋아져 光是听着就开心)。", explanation_en: "Expresses that doing just one simple action triggers an outcome." }
      ],
      tip: "💡 将太郎小水獭特色：字里行间洋溢着笑容(ㅎㅎ)，充满街舞与潮流元气，积极给予暖心反馈！"
    },
    sungchan: {
      kr: userMsg
        ? `오, 완전 나이스한데? 힘낼 수 있게 내가 든든하게 응원해 줄게!`
        : isLateOrDawn
        ? `오, 아직 안 자고 있었어? 나 헬스 끝나고 씻고 단백질 챙겨 먹는 중이었는데. 오늘 밤 푹 자!`
        : `기다리고 있었지! 헬스장 다녀와서 씻고 막 앉았는데 컨디션 어때? 좋아 보여!`,
      zh: userMsg
        ? "噢，这可太棒了！我会给你最坚实的应援，让你元气满满！"
        : isLateOrDawn
        ? "噢，你还没睡呢？我健身回来冲完澡正在补充蛋白质呢。今晚好好睡一觉吧！"
        : "一直等着你呢！刚从健身房回来冲完澡坐下，你今天状态怎么样？看起来挺棒！",
      en: userMsg
        ? "Oh, that's totally nice! I'll be your solid cheerleader so you can stay energized!"
        : isLateOrDawn
        ? "Oh, still awake? Just showered after working out and having my protein. Sleep well tonight!"
        : "I was waiting for you! Just got back from the gym and showered. How's your condition today? Looking good!",
      vocab: [
        { word: "든든하다", hangul: "든든하다", type: "형용사", meaning_zh: "踏实，安心，可靠", meaning_en: "reassuring, solid, dependable", example_ko: "든든하게 응원할게.", example_zh: "我会给你坚实的应援。" }
      ],
      grammar: [
        { pattern: "-(으)ㄹ 수 있게", title_zh: "为了能够...", title_en: "So that one can...", explanation_zh: "表示目的或使动前提 (例: 힘낼 수 있게 能够打起精神)。", explanation_en: "Indicates purpose so an action is enabled." }
      ],
      tip: "💡 郑成灿大金毛死党特色：直率爽快，充满运动系少年的阳刚与活力，像太阳一样照亮朋友！"
    }
  };

  const item = responses[charId] || responses.eric;
  const cleanKr = cleanPureKorean(item.kr);

  return {
    korean_text: cleanKr,
    korean: cleanKr,
    translation_text: item.zh,
    translation_zh: item.zh,
    translation_en: item.en,
    tts_audio_text: cleanKr,
    vocabulary: item.vocab,
    grammar_points: item.grammar,
    learning_tip: item.tip,
  };
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Companion Chat endpoint - Full multi-turn live LLM roleplay for all 7 idols
app.post("/api/chat", async (req, res) => {
  const { character, messages, userNickname, languageMode = "bilingual", imageBase64, imageMime, videoLink, videoInfo, clientTemporal } = req.body;
  const latestUserMsg = (messages && messages.length > 0) ? (messages[messages.length - 1]?.content || "") : "";
  const temporal = computeTemporalContext(clientTemporal);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(generateIdolFallbackChat(character, latestUserMsg, temporal));
    }

    const ai = getAI();
    const charId = character?.id || "eric";

    const systemPrompt = `You are the authentic K-pop idol in a private 1-on-1 chat with your close friend/fan (${userNickname || "더비"}).

=======================================================
REAL-TIME TEMPORAL AWARENESS ENGINE:
=======================================================
${temporal.formattedTag}
Current Time Slot: ${temporal.timeSlot} (${temporal.timeSlotZh})
Slot Environment & Context: ${temporal.contextDescription}

TEMPORAL BEHAVIOR DIRECTIVE (MANDATORY):
- You MUST strictly perceive and adapt to this current real-world time.
- If it is Early Dawn / Midnight (01:00 - 06:00): Acknowledge the late quiet hours softly, ask why they're still up or talk about late studio wrap-up/heading to bed, and gently advise resting. NEVER ask daytime plans like "what are you doing today daytime".
- If it is Late Night (21:00 - 01:00): Talk about winding down, late snacks, writing lyrics in studio, or resting in the room.
- If it is Daytime / Practice (09:00 - 18:00): Chat about dance/vocal rehearsals, schedules, lunch breaks, energy.
- If it is Early Morning (06:00 - 09:00): Morning greetings, breakfast, starting schedules.

=======================================================
7 CORE IDOL PERSONA DIRECTIVES (STRICT AUTHENTIC PROMPTS):
=======================================================

1. 孙英宰 · Eric (THE BOYZ) [Character ID: eric]
- Profile: Born 2000. THE BOYZ maknae, lead dancer & rapper. LA upbringing (American extrovert, talkative, high energy, candid).
- Group & Social Network:
  * Team: 00s "Bbongbbongz (빵빵즈)" with Sunwoo (daily bickering frenemies who love & tease each other); clings to hyungs (Younghoon, Hyunjae); team mood maker.
  * Cross-Group: Close friends with 4th-gen peers (Stray Kids, TXT, ATEEZ).
- Habits & TMI: Loves baseball, skateboarding, gym. Cleanliness freak (dorm cleanup manager). Loves ramen/burgers but manages diet.
- Speaking Style: Fast-talking, youthful Korean banter (반말, 가보자고, 대박, 텐션), energetic daily sharing, like a close zero-distance guy friend. Never act like a boyfriend robot.

2. 金善旴 · Sunwoo (THE BOYZ) [Character ID: sunwoo]
- Profile: Born 2000. THE BOYZ main rapper & songwriter/producer.
- Group & Social Network:
  * Team: 00s roommate & frenemy with Eric (frequently complains Eric is too loud, but understands him best); respects hyungs.
  * Industry: High School Rapper alumnus; connections with K-hiphop producers & 00s idol peers.
- Habits & TMI: Night owl, writes lyrics and produces tracks late in studio, iced americano addict, deep & empathetic mind, soccer enthusiast.
- Speaking Style: Relaxed, cool MZ tone (반말), restrained with laughs (rare ㅋㅋㅋ/ㅎㅎ), tsundere but deeply sincere when friend is tired or down.

3. 金泳勋 · Younghoon (THE BOYZ) [Character ID: younghoon]
- Profile: Born 1997. THE BOYZ visual, sub-vocal & actor.
- Group & Social Network:
  * Team: 97 Line hyung with Hyunjae; dotes on maknaes (Sunwoo, Eric) while being playfully teased by them in return.
- Habits & TMI: Famous "Bread-Hoon (빵훈)", loves bakeries. Has a beloved pet dog "보리 (Bori)". Cool visual but soft, shy, and warm inside.
- Speaking Style: Gentle, sincere, slow-paced realistic close friend (반말). Talks about his dog Bori, delicious breads, weather, and checks if user ate. Shows mild cute pout when teased.

4. 李贤在 · Hyunjae (THE BOYZ) [Character ID: hyunjae]
- Profile: Born 1997. THE BOYZ lead vocal, lead dancer & visual.
- Group & Social Network:
  * Team: Incontestable "playful troublemaker & atmosphere center"; loves teasing Sunwoo and Eric endlessly; best 97 buddy with Younghoon.
- Habits & TMI: Ultimate fried chicken addict, huge appetite, battles between late-night food cravings and intense gym discipline. High competitive drive.
- Speaking Style: Quick-witted, master of banter/comebacks (티키타카), forbids stiff formal honorifics (반말). Playful neighborhood hyung/close guy friend.

5. 申惟 · Shinyu (TWS) [Character ID: shinyu]
- Profile: Born 2003. TWS leader & rapper.
- Group & Social Network: PLEDIS new generation boy group leader, caring and looking after 5 younger members. Thoughtful, introverted and reliable.
- Habits & TMI: Typical INFP, pure fresh campus crush vibe. Enjoys solo walks, listening to music, and quiet spacing out.
- Speaking Style: Gentle, polite (해요체), sincere and understated boyish warmth. Brings a sense of calm and healing reassurance.

6. 将太郎 · Shotaro (RIIZE) [Character ID: shotaro]
- Profile: Born 2000. RIIZE main dancer & oldest member.
- Group & Social Network: Deep bond with Sungchan (Sung-Taro duo / 성짱즈); highly trusted and adored by younger members; loved across the industry.
- Habits & TMI: Street dancing & choreography lover, street fashion & vintage store explorer, sushi lover, personality like a warm, cute sea otter.
- Speaking Style: Cheerful, sweet, healing energy, frequently uses "ㅎㅎ", shares dance practice vibes and everyday cozy discoveries.

7. 郑成灿 · Sungchan (RIIZE) [Character ID: sungchan]
- Profile: Born 2001. RIIZE visual & rapper.
- Group & Social Network: Inseparable chemistry with Shotaro (Sung-Taro duo); dependable, energetic powerhouse in the team.
- Habits & TMI: Tall athletic golden retriever vibe, gym regular, passionate soccer player, legendary big eater.
- Speaking Style: Refreshing, candid, straightforward sporty guy (반말). Chat is full of sunny energy, zero pretense, and athletic positivity.

=======================================================
STRICT OUTPUT SPECIFICATION & SEPARATION:
=======================================================
1. PURE KOREAN MAIN BUBBLE (STRICT RULE):
   - "korean_text": MUST BE 100% PURE KOREAN. NEVER include Chinese translations, brackets, or parenthesized text in "korean_text"!
   - "korean": Set to the identical pure Korean text as "korean_text".
2. SEPARATE CHINESE TRANSLATION:
   - "translation_text": Provide the natural colloquial Simplified Chinese translation here.
   - "translation_zh": Identical to "translation_text".
3. PURE TTS TEXT:
   - "tts_audio_text": Pure Korean string without emojis or parenthesized text for audio synthesis.
4. NO FIXED GREETING REPETITION:
   - Never repeat the initial greeting. Directly respond to the user's latest input in character and in time context!
5. SEAMLESS LANGUAGE MODELING:
   - Never act as a lecturing teacher. If user writes awkward Korean, seamlessly model natural Korean in character.

OUTPUT STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "korean_text": "순수 한국어 문장 (절대 괄호나 중국어를 넣지 말 것)",
  "korean": "순수 한국어 문장",
  "translation_text": "自然地道的简体中文翻译",
  "translation_zh": "自然地道的简体中文翻译",
  "translation_en": "Natural English translation",
  "tts_audio_text": "순수 한국어 발음 텍스트",
  "vocabulary": [
    {
      "word": "원형/단어",
      "hangul": "한글",
      "type": "품사 (명사, 동사, 형용사, 신조어)",
      "meaning_zh": "中文精准释义",
      "meaning_en": "English definition",
      "example_ko": "자연스러운 한국어 예문",
      "example_zh": "예문 번역"
    }
  ],
  "grammar_points": [
    {
      "pattern": "문법 패턴",
      "title_zh": "语法要点中文名",
      "title_en": "Grammar Title",
      "explanation_zh": "中文口语用法精讲",
      "explanation_en": "Explanation"
    }
  ],
  "learning_tip": "角色专属语感与口语指南"
}`;

    // Build multi-turn conversational context
    const formattedHistory = (messages || [])
      .slice(-12)
      .map((m: any) => {
        const speaker = m.role === 'user' ? 'User' : (character?.name_ko || 'Idol');
        const text = m.role === 'user' ? (m.content || '') : (m.korean_text || m.korean || m.content || '');
        return `${speaker}: ${text}`;
      })
      .join("\n");

    let contentsPayload: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const mimeType = imageMime || 'image/jpeg';
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: `Current Real-Time: ${temporal.formattedTag}\n\nChat History:\n${formattedHistory}\n\nThe user sent this image with message: "${latestUserMsg}". Respond naturally in character as ${character?.name_ko || 'Idol'} in strict JSON.` }
        ]
      };
    } else if (videoLink) {
      contentsPayload = `Current Real-Time: ${temporal.formattedTag}\n\nChat History:\n${formattedHistory}\n\nUser sent a video: ${videoLink} (${videoInfo?.platform || 'Video'}). Message: "${latestUserMsg}". Respond in character as ${character?.name_ko || 'Idol'} in strict JSON.`;
    } else {
      contentsPayload = `Current Real-Time: ${temporal.formattedTag}\n\nChat History:\n${formattedHistory}\n\nLatest user message: "${latestUserMsg}". Respond now in character as ${character?.name_ko || 'Idol'}. Return strict JSON with pure Korean in "korean_text".`;
    }

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: contentsPayload,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.88,
    });

    const cleaned = (rawText || "{}").replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    // Ensure pure Korean output by stripping any stray Chinese in parentheses
    const pureKr = cleanPureKorean(parsed.korean_text || parsed.korean || "");
    const transZh = parsed.translation_text || parsed.translation_zh || "";

    const sanitizedResponse = {
      ...parsed,
      korean_text: pureKr,
      korean: pureKr,
      translation_text: transZh,
      translation_zh: transZh,
      tts_audio_text: cleanPureKorean(parsed.tts_audio_text || pureKr),
    };

    res.json(sanitizedResponse);
  } catch (error: any) {
    console.warn("Chat fallback triggered:", error?.message || error);
    res.json(generateIdolFallbackChat(character, latestUserMsg, temporal));
  }
});

// Proactive Chat Check-in Endpoint
app.post("/api/chat/proactive", async (req, res) => {
  const { character, userNickname, clientTemporal } = req.body;
  const temporal = computeTemporalContext(clientTemporal);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(generateIdolFallbackChat(character, "", temporal));
    }

    const ai = getAI();
    const systemPrompt = `You are ${character?.name_ko || "손영재"}.
Current Real-Time: ${temporal.formattedTag} (Slot: ${temporal.timeSlot} - ${temporal.timeSlotZh}).
Generate a spontaneous 1-sentence 1-on-1 check-in message in character to ${userNickname || "더비"}.
Adapt to the current time slot (${temporal.contextDescription}).
STRICT RULE: "korean_text" must be strictly pure Korean without parentheses or Chinese. "translation_text" must contain Chinese translation.
Output strict JSON with { "korean_text": "...", "korean": "...", "translation_text": "...", "translation_zh": "..." }`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate an authentic spontaneous 1-sentence check-in at real time ${temporal.rawTime}.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.9,
    });

    const parsed = JSON.parse((rawText || "{}").replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim());
    const pureKr = cleanPureKorean(parsed.korean_text || parsed.korean || "");
    const transZh = parsed.translation_text || parsed.translation_zh || "";

    res.json({
      ...parsed,
      korean_text: pureKr,
      korean: pureKr,
      translation_text: transZh,
      translation_zh: transZh,
      tts_audio_text: pureKr,
    });
  } catch (error: any) {
    res.json(generateIdolFallbackChat(character, "", temporal));
  }
});

// MiniMax Voice Cloning & T2A Synthesis Pipeline Endpoint
app.post("/api/tts/minimax", async (req, res) => {
  const { text, character_id, config } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required for TTS synthesis" });
  }

  // Ensure 100% pure Korean for audio synthesis
  const cleanKoreanText = cleanPureKorean(text)
    .replace(/[~]/g, " ")
    .replace(/(\^[\^]+|ㅋㅋ+|ㅎㅎ+|ㅠㅠ+|ㅜㅜ+)/g, "")
    .trim();

  // Check if MiniMax is configured in request body or environment
  const apiKey = config?.api_key || process.env.MINIMAX_API_KEY;
  const groupId = config?.group_id || process.env.MINIMAX_GROUP_ID;
  const model = config?.model || "speech-01-turbo";

  const voiceSlots = config?.voice_slots || {};
  const currentSlot = voiceSlots[character_id] || {
    voice_id: character_id === "eric" ? "voice_eric_006" :
              character_id === "sunwoo" ? "voice_sunwoo_001" :
              character_id === "younghoon" ? "voice_younghoon_002" :
              character_id === "hyunjae" ? "voice_hyunjae_007" :
              character_id === "shinyu" ? "voice_shinyu_003" :
              character_id === "shotaro" ? "voice_shotaro_004" : "voice_sungchan_005",
    speed: 1.0,
    pitch: 0,
    emotion: "natural"
  };

  if (apiKey && groupId) {
    try {
      const minimaxEndpoint = `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`;
      const payload = {
        model: model,
        text: cleanKoreanText,
        stream: false,
        voice_setting: {
          voice_id: currentSlot.voice_id,
          speed: currentSlot.speed || 1.0,
          vol: 1.0,
          pitch: currentSlot.pitch || 0,
          emotion: currentSlot.emotion || "natural"
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        }
      };

      const response = await fetch(minimaxEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data.audio) {
          const audioHexOrBase64 = json.data.audio;
          const audioBuffer = Buffer.from(audioHexOrBase64, "hex");
          res.setHeader("Content-Type", "audio/mp3");
          return res.send(audioBuffer);
        }
      }
    } catch (err: any) {
      console.warn("MiniMax API call error, cascading to neural fallback:", err?.message || err);
    }
  }

  // Graceful fallback to native Korean Google TTS Proxy
  try {
    const encoded = encodeURIComponent(cleanKoreanText.slice(0, 200));
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encoded}`;
    const fbRes = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (fbRes.ok) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const ab = await fbRes.arrayBuffer();
      return res.send(Buffer.from(ab));
    }
  } catch (fbErr) {
    console.error("Audio fallback failed:", fbErr);
  }

  res.status(500).json({ error: "TTS generation failed" });
});

// Dynamic Curriculum & Study Plan Generator Endpoint
app.post("/api/curriculum/generate-plan", async (req, res) => {
  const { target = "TOPIK 4급 + K-POP", days = 30 } = req.body;

  const getFallbackPlan = () => ({
    id: `plan_${Date.now()}`,
    title: `${target} ${days}天冲刺学习计划`,
    targetLevel: target,
    totalDays: Number(days),
    currentDay: 1,
    createdAt: Date.now(),
    days: [
      {
        day: 1,
        theme: "初识爱豆日常与高频打榜词汇",
        goal: "掌握 10 个核心打榜与追星词汇，完成 3 个热身温故题目与默写测试",
        vocab_count: 10,
        grammar_count: 2,
        stage1_warmup: [
          { question: "‘小卡’用韩语怎么说？", answer: "포카", hint: "포토카드的缩写" },
          { question: "表示‘音源流媒体播放刷榜’的词是？", answer: "스밍", hint: "스트리밍的缩写" },
          { question: "‘最重要的是百折不挠的心’网络流行缩写是？", answer: "중꺾마", hint: "중요한 것은 꺾이지 않는 마음" }
        ],
        stage2_vocab: [
          { id: "v_1", word: "포카", hangul: "포카", type: "명사 (名词)", meaning_zh: "小卡", meaning_en: "photocard", example_kr: "최애 포카를 뽑았어!", example_zh: "抽中了本命的小卡！" },
          { id: "v_2", word: "스밍", hangul: "스밍", type: "명사 (名词)", meaning_zh: "刷音源", meaning_en: "streaming", example_kr: "신곡 나오자마자 스밍 시작!", example_zh: "新歌一出立刻开始刷音源！" },
          { id: "v_3", word: "사녹", hangul: "사녹", type: "명사 (名词)", meaning_zh: "预录", meaning_en: "pre-recording", example_kr: "내일 아침 사녹 가요.", example_zh: "明天早上去参加预录。" }
        ],
        stage3_active_recall: [
          { prompt_zh: "默写韩语：小卡", target_kr: "포카", hint: "포로 시작" },
          { prompt_zh: "默写韩语：刷音源", target_kr: "스밍", hint: "스로 시작" },
          { prompt_zh: "默写韩语：预录", target_kr: "사녹", hint: "사로 시작" }
        ]
      }
    ]
  });

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(getFallbackPlan());
    }

    const ai = getAI();
    const systemPrompt = `You are the chief curriculum designer of Korean Buddy.
Generate a structured multi-day Korean study plan tailored to the user's target: "${target}" for ${days} days.
Structure each day into 3 distinct stages:
Stage 1: Warm-up Review (3 active recall questions)
Stage 2: Flashcard Vocabulary List (High yield words with KR, CN, examples)
Stage 3: Active Recall Dictation Test (CN prompt -> target Korean)

Output strictly in JSON schema format:
{
  "id": "plan_id",
  "title": "计划标题",
  "targetLevel": "${target}",
  "totalDays": ${days},
  "currentDay": 1,
  "createdAt": ${Date.now()},
  "days": [
    {
      "day": 1,
      "theme": "当日主题",
      "goal": "学习目标",
      "vocab_count": 10,
      "grammar_count": 2,
      "stage1_warmup": [
        { "question": "温习提问", "answer": "正确韩语答案", "hint": "提示" }
      ],
      "stage2_vocab": [
        {
          "id": "v_1",
          "word": "单词",
          "hangul": "한글",
          "type": "词性",
          "meaning_zh": "中文释义",
          "meaning_en": "English meaning",
          "example_kr": "韩文实战例句",
          "example_zh": "中文例句翻译"
        }
      ],
      "stage3_active_recall": [
        { "prompt_zh": "中文提示", "target_kr": "韩文默写目标", "hint": "助记提示" }
      ]
    }
  ]
}`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate plan for ${target} for ${days} days.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.7,
    });

    const parsed = JSON.parse((rawText || "{}").replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim());
    res.json(parsed);
  } catch (error: any) {
    console.warn("Generate plan fallback:", error?.message || error);
    res.json(getFallbackPlan());
  }
});

// Dynamic MZ Slang Generator Endpoint
app.post("/api/curriculum/slang", async (req, res) => {
  const { count = 5 } = req.body;

  const fallbackSlang = [
    {
      id: "slang_1",
      word: "갓생",
      hangul: "갓생",
      type: "신조어/명사",
      full_form: "갓(God) + 인생(人生)",
      origin: "网络新造词，赞扬每天自律充实、高效积极的健康生活模式",
      social_nuance: "极具正能量的褒义词，用于日常打卡与自律激励",
      meaning_zh: "神仙生活 / 极度自律充实的自驱生活",
      meaning_en: "living an exemplary, highly disciplined productive life",
      example_kr: "오늘부터 아침 6시 기상 갓생 살기 시작!",
      example_zh: "从今天起开启早晨6点起床的神仙自律生活！"
    },
    {
      id: "slang_2",
      word: "억텐",
      hangul: "억텐",
      type: "신조어/명사",
      full_form: "억지 텐션 (强求的Tension/气氛)",
      origin: "直播弹幕与综艺流行语，指为了不冷场而强装出来的亢奋与热情",
      social_nuance: "多用于朋友间调侃开玩笑，反义词为 찐텐 (真情实感的嗨)",
      meaning_zh: "硬装嗨 / 强行亢奋装开心",
      meaning_en: "forced hype / artificial excitement",
      example_kr: "너 오늘 왜 이렇게 억텐이야? 힘들어?",
      example_zh: "你今天怎么这么硬装亢奋啊？是不是太累了？"
    },
    {
      id: "slang_3",
      word: "캘박",
      hangul: "캘박",
      type: "신조어/동사",
      full_form: "캘린더 박제 (Calendar+镶嵌定格)",
      origin: "将约定事项或爱豆回归日程铁板钉钉地写入手机日历中",
      social_nuance: "朋友约会、演唱会开票抢票时的高频用语",
      meaning_zh: "锁定日程 (写进日历定死)",
      meaning_en: "pinning on calendar / locking down a date",
      example_kr: "다음 주 토요일 콘서트 티켓팅, 캘박 완료!",
      example_zh: "下周六演唱会抢票，已经在日历里锁死日程啦！"
    }
  ];

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ slangs: fallbackSlang });
    }

    const ai = getAI();
    const systemPrompt = `You are a real-time Korean MZ internet trend researcher.
Generate ${count} latest and most viral Korean MZ internet neologisms/slang with:
1. Origin (유래/어원)
2. Original Full Form (원래 표현)
3. Social Nuance & Safety Level (使用语境/是否仅限平语/避坑指南)
4. Meaning in Chinese and English
5. Authentic conversational example

Output strictly in JSON schema format:
{
  "slangs": [
    {
      "id": "slang_1",
      "word": "流行语",
      "hangul": "한글",
      "type": "신조어/품사",
      "full_form": "原词展开",
      "origin": "词源与出处",
      "social_nuance": "社交语境与避坑指南 (如: 仅限亲友平语)",
      "meaning_zh": "中文解释",
      "meaning_en": "English definition",
      "example_kr": "韩语实战例句",
      "example_zh": "中文例句翻译"
    }
  ]
}`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate ${count} latest viral Korean MZ slang terms.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.8,
    });

    const parsed = JSON.parse((rawText || "{}").replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim());
    res.json(parsed);
  } catch (error: any) {
    res.json({ slangs: fallbackSlang });
  }
});

// Dynamic K-POP Fandom Ecosystem Terms Generator
app.post("/api/curriculum/fandom", async (req, res) => {
  const { topic = "concert", count = 5 } = req.body;

  const fallbackFandom = [
    {
      id: "fan_1",
      word: "분철",
      hangul: "분철",
      type: "명사 (名词)",
      meaning_zh: "拼团拆卡 / 拆专",
      meaning_en: "splitting photocard/album merchandise",
      example_kr: "이번 앨범 선우 분철 타실 분 계신가요?",
      example_zh: "有要上车善旴特典小卡拼团的亲故吗？"
    },
    {
      id: "fan_2",
      word: "역조공",
      hangul: "역조공",
      type: "명사 (名词)",
      meaning_zh: "逆应援 (偶像给粉丝送礼物/便当/咖啡)",
      meaning_en: "reverse tribute from idols to fans",
      example_kr: "오늘 사녹에서 멤버들이 커피차 역조공 해줬어!",
      example_zh: "今天在预录现场成员们给粉丝逆应援送了咖啡车！"
    }
  ];

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ terms: fallbackFandom });
    }

    const ai = getAI();
    const systemPrompt = `Generate ${count} authentic K-POP fandom ecosystem terms for the topic: "${topic}".
Include concert & ticketing, broadcast & offline events, or charts & streaming terminology.
Return JSON format matching { "terms": [...] }`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Generate ${count} K-pop fandom terms for topic ${topic}.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.8,
    });

    const parsed = JSON.parse((rawText || "{}").replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim());
    res.json(parsed);
  } catch (error: any) {
    res.json({ terms: fallbackFandom });
  }
});

// AI Seed Expansion & Real-Time Lexicon Derivation Engine
app.post("/api/curriculum/expand-lexicon", async (req, res) => {
  const { bookTitle = "自定义词书", seedWords = [], count = 6 } = req.body;

  const fallbackExpansions = {
    bookTitle,
    seedWords,
    expandedItems: (seedWords.length > 0 ? seedWords : ["가게", "가방", "도서관"]).slice(0, 5).map((w: string, idx: number) => ({
      id: `exp_${Date.now()}_${idx}`,
      word: w,
      hangul: w,
      type: "명사/동사",
      meaning_zh: `${w}的地道拓展用法`,
      meaning_en: `Authentic expanded usage of ${w}`,
      category: bookTitle,
      level: "Expansion",
      source: bookTitle,
      example_kr: `${w}을/를 사용해서 자연스럽게 대화해 봐요.`,
      example_zh: `用“${w}”进行自然流畅的韩语对话。`,
      mastery: "learning",
      isBookmarked: true,
      savedAt: Date.now()
    })),
    activeRecallQuestions: [
      { prompt_zh: `默写词书核心词：${seedWords[0] || '가게'}`, target_kr: seedWords[0] || '가게', hint: "首字母提示" },
      { prompt_zh: `默写词书核心词：${seedWords[1] || '가방'}`, target_kr: seedWords[1] || '가방', hint: "首字母提示" }
    ],
    warmupQuestions: [
      { question: `词书《${bookTitle}》的核心高频词‘${seedWords[0] || '안녕하세요'}’的意思是？`, answer: seedWords[0] || '안녕하세요', hint: "温故知新" }
    ]
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackExpansions);
    }

    const ai = getAI();
    const systemPrompt = `You are an expert Korean linguist, TOPIK exam creator, and K-Pop native content editor.
The user has uploaded/selected a Korean lexicon titled "${bookTitle}".
Seed Words from this book: ${JSON.stringify(seedWords.slice(0, 15))}.

TASK:
1. Deeply expand and derive ${count} new, high-yield practice items based on these seed words.
2. For each word, generate:
   - "example_kr": 100% authentic, contemporary conversational Korean sentence (e.g. daily life, student/campus, or K-Pop context).
   - "example_zh": Accurate, natural Chinese translation.
   - "type": Part of speech (e.g., 명사, 동사, 형용사).
   - "meaning_zh": Precise, idiomatic Chinese definition.
   - "hanja_or_root": Hanja or etymology if applicable.
   - "romanization": Accurate phonetic pronunciation in brackets.
3. Generate 3 "activeRecallQuestions" (dictation CN prompt -> KR target).
4. Generate 2 "warmupQuestions" (quick-fire recall question & answer).

OUTPUT STRICT JSON ONLY:
{
  "bookTitle": "${bookTitle}",
  "seedWords": ${JSON.stringify(seedWords)},
  "expandedItems": [
    {
      "id": "exp_1",
      "word": "단어",
      "hangul": "한글",
      "hanja_or_root": "漢字/어원",
      "romanization": "발음",
      "type": "명사 (名词)",
      "meaning_zh": "中文释义",
      "meaning_en": "English meaning",
      "category": "${bookTitle}",
      "level": "AI Real-time Expansion",
      "source": "${bookTitle}",
      "example_kr": "자연스러운 실전 예문",
      "example_zh": "예문 번역"
    }
  ],
  "activeRecallQuestions": [
    {
      "prompt_zh": "中文释义默写提示",
      "target_kr": "정답 한국어",
      "hint": "提示"
    }
  ],
  "warmupQuestions": [
    {
      "question": "温故知新提问",
      "answer": "정답",
      "hint": "힌트"
    }
  ]
}`;

    const rawText = await generateGeminiContentWithFallback(ai, {
      contents: `Expand lexicon "${bookTitle}" with seed words: ${seedWords.join(", ")}.`,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.75,
    });

    const parsed = JSON.parse((rawText || "{}").replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim());
    res.json(parsed);
  } catch (error: any) {
    console.warn("Lexicon expansion error:", error?.message || error);
    res.json(fallbackExpansions);
  }
});

// TTS fallback proxy endpoint for native Korean pronunciation
app.get("/api/tts", async (req, res) => {
  try {
    const text = (req.query.text as string) || "";
    if (!text || !text.trim()) {
      return res.status(400).send("Text query is required");
    }
    const cleanText = encodeURIComponent(cleanPureKorean(text).slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${cleanText}`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(502).send("Upstream TTS service error");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("TTS fetch error:", err);
    res.status(500).send("TTS generation failed");
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Korean Buddy server running on http://localhost:${PORT}`);
  });
}

startServer();
