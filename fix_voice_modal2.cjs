const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

const startIdx = text.indexOf('{/* Voice Tuning Guide Modal */}');
if (startIdx !== -1) {
    const endIdx = text.lastIndexOf('</div>\n    </div>\n  );\n};');
    if (endIdx !== -1) {
        text = text.substring(0, startIdx) + '</div>\n  );\n};';
        fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
        console.log('Removed modal correctly');
    }
}
