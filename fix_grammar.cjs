const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/onSaveGrammar=\{handleSaveGrammar\}/g, '');
fs.writeFileSync('src/App.tsx', code, 'utf-8');
