const fs = require('fs');
let text = fs.readFileSync('src/components/CustomPersonaModal.tsx', 'utf-8');

// Change card click
text = text.replace(
  /onClick=\{\(\) => !isActive && setActiveIndex\(idx\)\}/g,
  `onClick={() => { onSelectCompanion(comp); onClose(); }}`
);

// Remove the Controls section
const controlsStart = text.indexOf('{/* Controls */}');
const controlsEnd = text.indexOf('</div>', text.indexOf('</button>', text.indexOf('<RotateCcw size={16} /> Reset Defaults'))) + 6;

if (controlsStart !== -1 && controlsEnd !== -1) {
  text = text.substring(0, controlsStart) + text.substring(controlsEnd);
}

fs.writeFileSync('src/components/CustomPersonaModal.tsx', text, 'utf-8');
