const fs = require('fs');

let code = fs.readFileSync('src/types.ts', 'utf-8');

// Replace all strict types with optional types
code = code.replace(/([a-zA-Z0-9_]+): ([^;]+);/g, '$1?: $2;');

fs.writeFileSync('src/types.ts', code, 'utf-8');

