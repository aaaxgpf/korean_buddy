const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

// Add the state and useEffect
const firstTimeCode = `
  const [hasSelectedInitialCompanion, setHasSelectedInitialCompanion] = useState(() => {
    return localStorage.getItem('initial_companion_selected') === 'true';
  });

  useEffect(() => {
    if (!hasSelectedInitialCompanion) {
      setIsCustomPersonaModalOpen(true);
    }
  }, [hasSelectedInitialCompanion]);
`;

app = app.replace(/const \[isCustomPersonaModalOpen, setIsCustomPersonaModalOpen\] = useState\(false\);/, 
  `const [isCustomPersonaModalOpen, setIsCustomPersonaModalOpen] = useState(false);\n${firstTimeCode}`);

// Patch the CustomPersonaModal onClose
app = app.replace(/<CustomPersonaModal\n\s*isOpen=\{isCustomPersonaModalOpen\}\n\s*onClose=\{\(\) => setIsCustomPersonaModalOpen\(false\)\}/,
  `<CustomPersonaModal
        isOpen={isCustomPersonaModalOpen}
        onClose={() => {
          setIsCustomPersonaModalOpen(false);
          if (!hasSelectedInitialCompanion) {
            localStorage.setItem('initial_companion_selected', 'true');
            setHasSelectedInitialCompanion(true);
          }
        }}`
);

fs.writeFileSync('src/App.tsx', app, 'utf-8');
