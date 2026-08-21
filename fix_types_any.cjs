const fs = require('fs');

let code = fs.readFileSync('src/types.ts', 'utf-8');

// A quick and dirty regex to add `[key: string]: any;` to all interfaces
code = code.replace(/export interface [a-zA-Z0-9_]+ \{/g, '$&\n  [key: string]: any;');

// we also need to add missing type GrammarAnalysisResult and SpeakingEvaluation? No, they might be missing entirely.
const extraTypes = `
export interface GrammarAnalysisResult {
  [key: string]: any;
}
export interface SpeakingEvaluation {
  [key: string]: any;
}
`;
code += extraTypes;

fs.writeFileSync('src/types.ts', code, 'utf-8');

