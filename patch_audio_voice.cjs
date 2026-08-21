const fs = require('fs');
let code = fs.readFileSync('src/utils/audio.ts', 'utf-8');

// Add gender parameter
code = code.replace(
  /export interface SpeakOptions \{/g,
  `export interface SpeakOptions {\n  gender?: 'male' | 'female';`
);

code = code.replace(
  /function findBestKoreanVoice\(\): SpeechSynthesisVoice \| null \{/g,
  `function findBestKoreanVoice(gender?: 'male' | 'female'): SpeechSynthesisVoice | null {`
);

// Modify voice selection logic to respect gender
const newVoiceLogic = `  const koreanVoices = cachedVoices.filter(
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

  return preferredVoices[0] || koreanVoices[0];`;

code = code.replace(
  /  const koreanVoices = cachedVoices\.filter\([\s\S]*?return koreanVoices\[0\];/m,
  newVoiceLogic
);

// Pass gender from options to findBestKoreanVoice
code = code.replace(
  /const bestVoice = findBestKoreanVoice\(\);/g,
  `const bestVoice = findBestKoreanVoice((typeof optionsOrPitch === 'object' ? optionsOrPitch.gender : undefined));`
);

fs.writeFileSync('src/utils/audio.ts', code, 'utf-8');
