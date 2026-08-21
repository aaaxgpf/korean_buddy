const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/import \{ GrammarView \} from '\.\/components\/GrammarView';\nimport \{ FlashcardsView \} from '\.\/components\/FlashcardsView';\nimport \{ DictationView \} from '\.\/components\/DictationView';\nimport \{ SpeakingView \} from '\.\/components\/SpeakingView';\nimport \{ NotebookView \} from '\.\/components\/NotebookView';/,
  `import { StudyView } from './components/StudyView';\nimport { SettingsView } from './components/SettingsView';\nimport { AppSettings } from './types';`
);

// Add initial settings state
const settingsState = `
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('korean_app_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { theme: 'default', dailyVocabGoal: 20, languageMode: 'bilingual' };
  });

  useEffect(() => {
    localStorage.setItem('korean_app_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle Proactive Messages
  useEffect(() => {
    const activeChat = companionChatMap[currentCompanion.id];
    if (!activeChat || activeChat.length === 0) return;
    
    const lastMsg = activeChat[activeChat.length - 1];
    if (lastMsg.role === 'assistant') {
      // Simulate proactive message if user doesn't reply for a bit
      const timer = setTimeout(() => {
        const proactiveMsg = {
           id: \`proactive_\${Date.now()}\`,
           role: 'assistant',
           content: '무슨 일 있어요? 왜 대답이 없어요~ 👀',
           timestamp: Date.now(),
           korean: '무슨 일 있어요? 왜 대답이 없어요~ 👀',
           translation_zh: '有什么事吗？怎么不回答我~ 👀',
        };
        handleUpdateCompanionMessages(currentCompanion.id, prev => [...prev, proactiveMsg as any]);
      }, 15000); // 15 seconds for demo
      return () => clearTimeout(timer);
    }
  }, [companionChatMap, currentCompanion.id]);
`;

app = app.replace(/const \[activeTab, setActiveTab\] = useState<.*?>\('chat'\);/, `const [activeTab, setActiveTab] = useState<'chat' | 'study' | 'settings'>('chat');\n${settingsState}`);

// Replace main content view rendering
const mainContentRegex = /\{activeTab === 'chat' && \([\s\S]*?<\/div>\n        \)\}\n        \{activeTab === 'grammar'[\s\S]*?<\/main>/;

const newMainContent = `{activeTab === 'chat' && (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white">
            {/* Left pane: Friends list */}
            <div className={\`shrink-0 w-full md:w-80 lg:w-96 flex-col border-r border-stone-200 bg-white overflow-y-auto \${chatView === 'chat' ? 'hidden md:flex' : 'flex'}\`}>
              <div className="px-4 py-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-bold text-[#3E2723]">친구 (Friends)</h2>
                   <button onClick={() => setIsCustomPersonaModalOpen(true)} className="p-2 text-[#3E2723] hover:bg-stone-100 rounded-full transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                   </button>
                 </div>
                 
                 <div className="space-y-1">
                   <div className="text-xs font-semibold text-stone-500 mb-3 ml-2 border-b border-stone-200 pb-1">내 프로필</div>
                   <div onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent group">
                     <div className="w-14 h-14 rounded-[20px] bg-[#3E2723] text-[#FFEB3B] flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden shrink-0">
                       {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : userProfile.avatar}
                     </div>
                     <div className="flex flex-col flex-1 min-w-0">
                       <span className="font-bold text-[16px] text-stone-800 truncate">{userProfile.name}</span>
                       <span className="text-sm text-stone-500 truncate">{userProfile.status}</span>
                     </div>
                   </div>
                   
                   <div className="text-xs font-semibold text-stone-500 mt-6 mb-3 ml-2 border-b border-stone-200 pb-1">친구 {companions.length}</div>
                   {companions.map(comp => (
                     <div 
                       key={comp.id}
                       onClick={() => {
                          handleSelectCompanion(comp);
                          setChatView('chat');
                       }}
                       className={\`flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer group \${currentCompanion.id === comp.id && chatView === 'chat' ? 'bg-stone-100' : ''}\`}
                     >
                       <div className="w-12 h-12 rounded-[18px] bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shadow-sm overflow-hidden shrink-0">
                         {comp.customAvatarUrl ? (
                           <img src={comp.customAvatarUrl} alt={comp.name_zh} className="w-full h-full object-cover" />
                         ) : (
                           <span>{comp.avatar}</span>
                         )}
                       </div>
                       <div className="flex flex-col flex-1 min-w-0 border-b border-stone-100 pb-2 group-last:border-0">
                         <span className="font-bold text-[15px] text-stone-800 truncate">{comp.remark || comp.name_ko}</span>
                         <span className="text-[13px] text-stone-500 truncate mt-0.5">{comp.status_msg}</span>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>

            {/* Right pane: Chat view */}
            <div className={\`flex-1 flex-col relative \${chatView === 'list' ? 'hidden md:flex' : 'flex'}\`}>
               <CompanionChat
                 theme={settings.theme}
                 onBack={() => setChatView('list')}
                 companion={currentCompanion}
                 companions={companions}
                 onSelectCompanion={(comp) => { handleSelectCompanion(comp); setChatView('chat'); }}
                 companionMessages={companionChatMap[currentCompanion.id]}
                 onUpdateMessages={(updater) => handleUpdateCompanionMessages(currentCompanion.id, updater)}
                 onOpenCompanionSelector={() => setIsCustomPersonaModalOpen(true)}
                 onOpenSparksModal={() => setIsSparksModalOpen(true)}
                 currentSpark={sparksMap[currentCompanion.id]}
                 onIgniteSpark={() => handleIgniteSpark(currentCompanion.id)}
                 languageMode={settings.languageMode}
                 onSaveVocab={handleSaveVocab}
                 savedVocabIds={savedVocabIds}
                 onSaveDialogue={handleSaveDialogue}
                 savedDialogueIds={savedDialogueIds}
               />
            </div>
          </div>
        )}
        
        {activeTab === 'study' && (
          <StudyView
            flashcardsProps={{
              vocabulary,
              onToggleBookmarkVocab: handleToggleBookmarkVocab,
              savedVocabIds,
              onUpdateMastery: handleUpdateMastery,
              onAddCustomVocab: handleAddCustomVocab,
              languageMode: settings.languageMode,
              dailyGoal: settings.dailyVocabGoal
            }}
            grammarProps={{
              grammarCards: INITIAL_GRAMMAR_CARDS,
              onToggleBookmarkGrammar: handleToggleBookmarkGrammar,
              savedGrammarIds,
              languageMode: settings.languageMode
            }}
            dictationProps={{
              dictationItems: INITIAL_DICTATION_ITEMS,
              languageMode: settings.languageMode,
              onSaveToNotebook: (item: any) => handleSaveVocab({ id: \`dict_\${item.id}\`, word: item.korean, hangul: item.korean, type: '문장 (句子)', meaning_zh: item.translation_zh, meaning_en: item.translation_en, isBookmarked: true })
            }}
            speakingProps={{
              speakingTasks: INITIAL_SPEAKING_TASKS,
              companion: currentCompanion,
              languageMode: settings.languageMode,
              onIncreaseStreak: handleIncreaseStreak,
              studyStreak
            }}
            notebookProps={{
              savedDialogues,
              onRemoveDialogue: handleRemoveDialogue,
              savedVocab: vocabulary.filter(v => v.isBookmarked || savedVocabIds.has(v.id)),
              onRemoveVocab: handleRemoveVocabFromNotebook,
              savedGrammar: INITIAL_GRAMMAR_CARDS.filter(g => savedGrammarIds.has(g.id)),
              onRemoveGrammar: handleRemoveGrammarFromNotebook,
              companions,
              languageMode: settings.languageMode,
              studyStreak
            }}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            userProfile={userProfile}
          />
        )}
      </main>`;

app = app.replace(mainContentRegex, newMainContent);

// Remove the standalone language mode logic
app = app.replace(/const \[languageMode, setLanguageMode\] = useState<'bilingual' \| 'zh' \| 'en'>\(\(\) => \{[\s\S]*?\}\);/, '');
app = app.replace(/useEffect\(\(\) => \{\n    localStorage.setItem\('korean_lang_mode', languageMode\);\n  \}, \[languageMode\]\);/, '');

fs.writeFileSync('src/App.tsx', app, 'utf-8');
