/**
 * Korean Audio & Speech Utilities (TTS, Speech Recognition, Voice Tone Fine-tuning & Hangul comparison)
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize and cache voices safely across browsers
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch {
      cachedVoices = [];
    }
  };

  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }

  activeUtterance = null;
}

/**
 * Intelligent Korean Voice Finder
 * Prioritizes Neural, Natural, Apple Premium Yuna, and Google Neural Korean voices
 * to avoid flat/robotic default system synthesizer voices.
 */
function findBestKoreanVoice(gender?: 'male' | 'female'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  
  if (cachedVoices.length === 0) {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch {
      cachedVoices = [];
    }
  }

  const koreanVoices = cachedVoices.filter(
    (v) => v.lang === 'ko-KR' || v.lang.startsWith('ko') || v.name.toLowerCase().includes('korean')
  );

  if (koreanVoices.length === 0) return null;

  let preferredVoices = koreanVoices;
  if (gender === 'male') {
    preferredVoices = koreanVoices.filter(v => 
      !v.name.toLowerCase().includes('yuna') && 
      !v.name.toLowerCase().includes('sora') &&
      !v.name.toLowerCase().includes('sunhi') &&
      !v.name.toLowerCase().includes('female')
    );
    if (preferredVoices.length === 0) preferredVoices = koreanVoices; // fallback
  } else if (gender === 'female') {
    preferredVoices = koreanVoices.filter(v => 
      !v.name.toLowerCase().includes('injoon') && 
      !v.name.toLowerCase().includes('male')
    );
    if (preferredVoices.length === 0) preferredVoices = koreanVoices; // fallback
  }

  // Tier 1: Microsoft Natural Neural voices
  const msNatural = preferredVoices.find(
    (v) => v.name.toLowerCase().includes('natural')
  );
  if (msNatural) return msNatural;

  // Tier 2: Apple Premium / Enhanced
  const applePremium = preferredVoices.find(
    (v) => v.name.toLowerCase().includes('premium') || v.name.toLowerCase().includes('enhanced')
  );
  if (applePremium) return applePremium;

  return preferredVoices[0] || koreanVoices[0];
}

export interface SpeakOptions {
  gender?: 'male' | 'female';
  pitch?: number;
  rate?: number;
  characterId?: string;
  minimaxConfig?: any;
  emotion?: 'natural' | 'energetic' | 'gentle' | 'calm' | 'clear' | string;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function speakKorean(
  text: string,
  optionsOrPitch?: number | SpeakOptions,
  rateArg?: number,
  onEndArg?: () => void,
  onErrorArg?: (err: any) => void
) {
  if (!text || !text.trim()) {
    if (typeof optionsOrPitch === 'object' && optionsOrPitch?.onEnd) {
      optionsOrPitch.onEnd();
    } else if (onEndArg) {
      onEndArg();
    }
    return;
  }

  // Pre-process text to make Korean rhythm more natural and strip Chinese translations in parentheses
  const cleanText = text
    .replace(/\([^)]*\)/g, ' ') // Strip Chinese translations in parentheses
    .replace(/[~]/g, ' ') // Replace ~ with pause
    .replace(/(\^[\^]+|ㅋㅋ+|ㅎㅎ+|ㅠㅠ+|ㅜㅜ+)/g, '') // Strip ascii emoticons for smoother TTS
    .trim();

  let pitch = 0.95;
  let rate = 0.95;
  let characterId: string | undefined;
  let minimaxConfig: any;
  let onEnd: (() => void) | undefined;
  let onError: ((err: any) => void) | undefined;

  if (typeof optionsOrPitch === 'number') {
    pitch = optionsOrPitch;
    rate = rateArg ?? 0.95;
    onEnd = onEndArg;
    onError = onErrorArg;
  } else if (typeof optionsOrPitch === 'object' && optionsOrPitch !== null) {
    pitch = optionsOrPitch.pitch ?? 0.95;
    rate = optionsOrPitch.rate ?? 0.95;
    characterId = optionsOrPitch.characterId;
    minimaxConfig = optionsOrPitch.minimaxConfig;
    onEnd = optionsOrPitch.onEnd;
    onError = optionsOrPitch.onError;

    // Apply emotion-specific adjustments
    if (optionsOrPitch.emotion === 'energetic' || optionsOrPitch.emotion === 'energetic_happy') {
      pitch = Math.min(1.2, pitch * 1.08);
      rate = Math.min(1.2, rate * 1.05);
    } else if (optionsOrPitch.emotion === 'gentle' || optionsOrPitch.emotion === 'gentle_warm' || optionsOrPitch.emotion === 'soft_calm') {
      pitch = Math.max(0.85, pitch * 0.95);
      rate = Math.max(0.8, rate * 0.92);
    } else if (optionsOrPitch.emotion === 'calm' || optionsOrPitch.emotion === 'cool_empathetic') {
      pitch = Math.max(0.8, pitch * 0.92);
      rate = Math.max(0.8, rate * 0.95);
    }
  }

  // Play MiniMax / Backend TTS Stream
  const playServerAudio = async () => {
    try {
      stopSpeaking();

      let audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
      let postBody: any = null;

      // If MiniMax credentials or characterId is specified, attempt MiniMax proxy
      if (minimaxConfig?.api_key || characterId) {
        try {
          const res = await fetch('/api/tts/minimax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: cleanText,
              character_id: characterId || 'sunwoo',
              config: minimaxConfig
            })
          });
          if (res.ok) {
            const blob = await res.blob();
            audioUrl = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.warn('MiniMax endpoint request error, falling back to Google TTS proxy:', e);
        }
      }

      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      currentAudio = audio;
      audio.playbackRate = rate;

      // Web Audio API Enhancement
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioCtx = new AudioContext({ sampleRate: 48000 });
          const source = audioCtx.createMediaElementSource(audio);
          
          const lowpass = audioCtx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 7500;
          lowpass.Q.value = 0.5;

          const warmup = audioCtx.createBiquadFilter();
          warmup.type = 'peaking';
          warmup.frequency.value = 350;
          warmup.Q.value = 1.0;
          warmup.gain.value = 2.0;

          source.connect(warmup);
          warmup.connect(lowpass);
          lowpass.connect(audioCtx.destination);
        }
      } catch (audioCtxErr) {
        // Safe bypass
      }

      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        onEnd?.();
      };

      audio.onerror = (e) => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        onError?.(e);
      };

      await audio.play();
    } catch (fallbackErr) {
      console.warn('Audio playback exception:', fallbackErr);
      onError?.(fallbackErr);
    }
  };

  // If MiniMax is explicitly configured, prioritize server audio pipeline
  if (minimaxConfig?.api_key && minimaxConfig?.group_id) {
    playServerAudio();
    return;
  }

  // Check browser SpeechSynthesis
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playServerAudio();
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    utterance.pitch = pitch;
    utterance.rate = rate;

    const bestVoice = findBestKoreanVoice(typeof optionsOrPitch === 'object' ? optionsOrPitch.gender : undefined);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    let hasEnded = false;
    utterance.onend = () => {
      if (!hasEnded) {
        hasEnded = true;
        activeUtterance = null;
        onEnd?.();
      }
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return;
      }
      activeUtterance = null;
      playServerAudio();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (synthErr) {
    playServerAudio();
  }
}


// Clean and normalize Hangul string for comparison
export function normalizeHangul(text: string): string {
  return text
    .replace(/[.,!?'"~`\s]/g, '')
    .trim()
    .toLowerCase();
}

// Hangul character/syllable diff comparison
export interface CharDiff {
  expected: string;
  actual: string;
  isMatch: boolean;
}

export function compareHangulStrings(expected: string, actual: string): {
  similarity: number;
  diffs: CharDiff[];
  isExact: boolean;
} {
  const cleanExp = expected.trim();
  const cleanAct = actual.trim();

  if (!cleanAct) {
    return {
      similarity: 0,
      diffs: cleanExp.split('').map((c) => ({ expected: c, actual: '', isMatch: false })),
      isExact: false,
    };
  }

  const expChars = cleanExp.split('');
  const actChars = cleanAct.split('');
  const maxLen = Math.max(expChars.length, actChars.length);
  let matches = 0;
  const diffs: CharDiff[] = [];

  for (let i = 0; i < maxLen; i++) {
    const exp = expChars[i] || '';
    const act = actChars[i] || '';
    const isMatch = exp === act && exp !== '';
    if (isMatch) matches++;
    diffs.push({
      expected: exp,
      actual: act,
      isMatch,
    });
  }

  const similarity = Math.round((matches / maxLen) * 100);
  const isExact = normalizeHangul(expected) === normalizeHangul(actual);

  return {
    similarity,
    diffs,
    isExact,
  };
}
