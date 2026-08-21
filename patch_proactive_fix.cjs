const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Find all occurrences of "Handle Proactive Messages"
const startIndex1 = code.indexOf('// Handle Proactive Messages');
const startIndex2 = code.lastIndexOf('// Handle Proactive Messages');

console.log('Index1:', startIndex1);
console.log('Index2:', startIndex2);

