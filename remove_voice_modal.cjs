const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Remove showVoiceGuideModal state
text = text.replace(
    /const \[showVoiceGuideModal, setShowVoiceGuideModal\] = useState\(false\);\n/g,
    ''
);

// Remove speechRate state
text = text.replace(
    /const \[speechRate, setSpeechRate\] = useState<number>\(companion\.tts_rate \|\| 0\.95\);\n/g,
    ''
);

// Replace speechRate with (companion.tts_rate || 0.95)
text = text.replace(/rate: speechRate,/g, 'rate: companion.tts_rate || 0.95,');

// Remove the voice guide modal JSX
text = text.replace(
    /\{\/\* Voice Tuning Guide Modal \*\/\}\n\s*\{showVoiceGuideModal && \(\n[\s\S]*?\}\n\s*\)\}\n\s*<\/div>/,
    '</div>'
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
