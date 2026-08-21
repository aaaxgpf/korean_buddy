const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

text = text.replace(
    '          return (\n            <div\n              key={msg.id}',
    `          const isPureMode = chatMode === 'pure';
          const isRevealed = longPressedMsgId === msg.id;
          const showLearningUI = !isPureMode || isRevealed;

          return (
            <div
              key={msg.id}`
);

text = text.replace(
    '              className={`flex ${isUser ? \'justify-end\' : \'justify-start\'} items-end gap-1.5 sm:gap-2 max-w-full group`}',
    `              className={\`flex \${isUser ? 'justify-end' : 'justify-start'} items-end gap-1.5 sm:gap-2 max-w-full group\`}
              onPointerDown={() => handleTouchStart(msg.id)}
              onPointerUp={handleTouchEnd}
              onPointerLeave={handleTouchEnd}`
);

text = text.replace(
    /\{\/\* Discrete Toggle Chips Bar \*\/\}\n\s*<div className="flex items-center gap-1\.5 pt-1 flex-wrap">/g,
    `{/* Discrete Toggle Chips Bar */}
                        <div className={\`flex items-center gap-1.5 pt-1 flex-wrap \${showLearningUI ? 'block' : 'hidden'}\`}>`
);

text = text.replace(
    /\{\/\* Inline Vocabulary Tags \*\/\}\n\s*\{showVocab && \(/g,
    `{/* Inline Vocabulary Tags */}
                        {showLearningUI && showVocab && (`
);

text = text.replace(
    /\{\/\* Grammar Details \*\/\}\n\s*\{showGrammar && \(/g,
    `{/* Grammar Details */}
                        {showLearningUI && showGrammar && (`
);

text = text.replace(
    /\{\/\* Learning Tip \*\/\}\n\s*\{showTip && \(/g,
    `{/* Learning Tip */}
                        {showLearningUI && showTip && (`
);


fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
