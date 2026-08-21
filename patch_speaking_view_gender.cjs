const fs = require('fs');
let code = fs.readFileSync('src/components/SpeakingView.tsx', 'utf-8');

code = code.replace(
  /speakKorean\(currentTask\.target_korean, \{ pitch: companion\.tts_pitch, rate: 0\.95 \}\);/g,
  `speakKorean(currentTask.target_korean, { pitch: companion.tts_pitch, rate: 0.95, gender: 'male' });`
);

fs.writeFileSync('src/components/SpeakingView.tsx', code, 'utf-8');
