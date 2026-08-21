const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove onOpenCompanionSelector from Navbar and CompanionChat if passed
text = text.replace(/onOpenCompanionSelector=\{\(\) => setIsCustomPersonaModalOpen\(true\)\}/g, "");

// Remove the inline button in the sidebar (line 473 roughly)
text = text.replace(/<button onClick=\{\(\) => setIsCustomPersonaModalOpen\(true\)\}.*?<\/button>/s, "");

fs.writeFileSync('src/App.tsx', text, 'utf-8');
