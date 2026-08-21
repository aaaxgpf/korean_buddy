const fs = require('fs');

// Fix src/data/companions.ts (name_kr -> name_ko)
let comp = fs.readFileSync('src/data/companions.ts', 'utf-8');
comp = comp.replace(/name_kr:/g, 'name_ko:');
fs.writeFileSync('src/data/companions.ts', comp, 'utf-8');

// Fix src/data/dictation.ts (remove romanization)
let dict = fs.readFileSync('src/data/dictation.ts', 'utf-8');
dict = dict.replace(/\s*romanization:.*?,\n/g, '\n');
fs.writeFileSync('src/data/dictation.ts', dict, 'utf-8');

// Fix src/data/grammar.ts (kr -> ko in examples)
let gram = fs.readFileSync('src/data/grammar.ts', 'utf-8');
gram = gram.replace(/kr:/g, 'ko:');
fs.writeFileSync('src/data/grammar.ts', gram, 'utf-8');

// Fix src/data/speaking.ts (remove title_zh)
let speak = fs.readFileSync('src/data/speaking.ts', 'utf-8');
speak = speak.replace(/\s*title_zh:.*?,\n/g, '\n');
fs.writeFileSync('src/data/speaking.ts', speak, 'utf-8');

// Fix src/utils/sparks.ts (revert the type definition changes we made, or just add them back to types.ts)
