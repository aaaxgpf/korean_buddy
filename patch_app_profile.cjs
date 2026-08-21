const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf-8');

text = text.replace(
  "import { CustomPersonaModal } from './components/CustomPersonaModal';",
  "import { CustomPersonaModal } from './components/CustomPersonaModal';\nimport { CompanionProfileModal } from './components/CompanionProfileModal';"
);

// Add the state
text = text.replace(
  'const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);',
  'const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);\n  const [isCompanionProfileOpen, setIsCompanionProfileOpen] = useState(false);'
);

// Add the modal component at the end
text = text.replace(
  '<UserProfileModal ',
  `<CompanionProfileModal 
        isOpen={isCompanionProfileOpen} 
        onClose={() => setIsCompanionProfileOpen(false)} 
        companion={activeCompanion} 
        onSave={(updatedComp) => {
          setCompanions(prev => prev.map(c => c.id === updatedComp.id ? updatedComp : c));
          if (activeCompanion?.id === updatedComp.id) {
            setSelectedCompanionId(updatedComp.id);
          }
        }} 
      />\n      <UserProfileModal `
);

// Pass onOpenProfile to CompanionChat
text = text.replace(
  'onStartVoiceCall={() => setIsVoiceCallActive(true)}',
  'onStartVoiceCall={() => setIsVoiceCallActive(true)}\n            onOpenProfile={() => setIsCompanionProfileOpen(true)}'
);

fs.writeFileSync('src/App.tsx', text, 'utf-8');
