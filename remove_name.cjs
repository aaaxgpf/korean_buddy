const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
    '<span>{companion.name_zh}</span>',
    ''
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
