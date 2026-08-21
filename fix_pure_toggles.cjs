const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Restore the toggle bar to always flex
text = text.replace(
    /className=\{\`flex items-center gap-1\.5 pt-1 flex-wrap \$\{showLearningUI \? 'block' : 'hidden'\}\`\}/g,
    'className="flex items-center gap-1.5 pt-1 flex-wrap"'
);

// Wrap vocab, grammar, tip toggles with showLearningUI
text = text.replace(
    /\{\/\* Independent Toggle: Vocab \*\/\}\n\s*\{hasVocab && \(/g,
    `{/* Independent Toggle: Vocab */}
                          {showLearningUI && hasVocab && (`
);

text = text.replace(
    /\{\/\* Independent Toggle: Grammar \*\/\}\n\s*\{hasGrammar && \(/g,
    `{/* Independent Toggle: Grammar */}
                          {showLearningUI && hasGrammar && (`
);

text = text.replace(
    /\{\/\* Independent Toggle: Tip \*\/\}\n\s*\{hasTip && \(/g,
    `{/* Independent Toggle: Tip */}
                          {showLearningUI && hasTip && (`
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
