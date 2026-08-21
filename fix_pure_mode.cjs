const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Inside message mapping:
text = text.replace(
    'return (\n            <div\n              key={msg.id}',
    `const isPureMode = chatMode === 'pure';
          const isRevealed = longPressedMsgId === msg.id;
          const showLearningUI = !isPureMode || isRevealed;

          return (
            <div
              key={msg.id}`
);

// Add onTouchStart, onTouchEnd, onMouseDown, onMouseUp to the speech bubble
text = text.replace(
    `className={\`relative p-3 sm:p-3.5 transition-all \${`,
    `onPointerDown={() => handleTouchStart(msg.id)}
                  onPointerUp={handleTouchEnd}
                  onPointerLeave={handleTouchEnd}
                  className={\`relative p-3 sm:p-3.5 transition-all \${`
);

// Hide grammar/vocab in pure mode
text = text.replace(
    /\{\/\* Discrete Toggle Chips Bar \*\/\}/g,
    `{showLearningUI && (
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">`
);

text = text.replace(
    /\{\/\* Inline Vocabulary Tags \*\/\}/g,
    `</div>
                        )}
                        
                        {/* Inline Vocabulary Tags */}`
);

// We need to wrap the learning UI elements in `{showLearningUI && (...)}`
// Let's replace the whole section between Korean Dialogue and Inline Vocabulary Tags.
// Actually, it might be easier to use CSS for hiding, e.g. `className={\`... \${showLearningUI ? 'block' : 'hidden'}\`}`
