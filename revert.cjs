const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
    /\{showLearningUI && \(\n\s*<div className="flex items-center gap-1\.5 pt-1 flex-wrap">/g,
    `{/* Discrete Toggle Chips Bar */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">`
);

text = text.replace(
    /<\/div>\n\s*\)\}\n\s*\{\/\* Inline Vocabulary Tags \*\/\}/g,
    `{/* Inline Vocabulary Tags */}`
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
