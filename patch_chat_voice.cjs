const fs = require('fs');
let code = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

code = code.replace(
  /speakKorean\(text, \{/g,
  `speakKorean(text, { gender: 'male', `
);

code = code.replace(
  /speakKorean\(companion\.intro_kr, \{ pitch: companion\.tts_pitch, rate: speechRate \}\);/g,
  `speakKorean(companion.intro_kr, { pitch: companion.tts_pitch, rate: speechRate, gender: 'male' });`
);

fs.writeFileSync('src/components/CompanionChat.tsx', code, 'utf-8');
