const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
    /\{showVocab && msg\.vocabulary && \(/g,
    '{showLearningUI && showVocab && msg.vocabulary && ('
);

text = text.replace(
    /\{showGrammar && msg\.grammar_points && \(/g,
    '{showLearningUI && showGrammar && msg.grammar_points && ('
);

text = text.replace(
    /\{showTip && msg\.learning_tip && \(/g,
    '{showLearningUI && showTip && msg.learning_tip && ('
);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
