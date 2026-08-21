const fs = require('fs');

let content = fs.readFileSync('src/data/companions.ts', 'utf-8');
// Basically we don't need to change `src/data/companions.ts` if we don't render the tags anyway.
// But to be thorough, let's remove any `tags: [...]` if they exist.
content = content.replace(/tags:\s*\[.*?\],/g, '');
fs.writeFileSync('src/data/companions.ts', content, 'utf-8');
