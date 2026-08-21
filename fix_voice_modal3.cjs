const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const startStr = "{/* Voice Tuning Guide Modal */}";
const startIdx = text.indexOf(startStr);
if (startIdx !== -1) {
    const newText = text.substring(0, startIdx) + "  );\n};\n";
    fs.writeFileSync('src/components/CompanionChat.tsx', newText, 'utf-8');
    console.log('Successfully trimmed');
}
