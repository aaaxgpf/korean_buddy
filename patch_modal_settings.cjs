const fs = require('fs');
let text = fs.readFileSync('src/components/CustomPersonaModal.tsx', 'utf-8');

const replacement = `              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Name (Remark)</label>
                <input 
                  type="text" 
                  value={editingCompanion.remark || editingCompanion.name_ko}
                  onChange={e => setEditingCompanion({...editingCompanion, remark: e.target.value})}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-400/10 outline-none transition-all"
                  placeholder="e.g. My Bestie"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Status Message</label>
                <input 
                  type="text" 
                  value={editingCompanion.status_msg}
                  onChange={e => setEditingCompanion({...editingCompanion, status_msg: e.target.value})}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-400/10 outline-none transition-all"
                  placeholder="Status message..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">AI Persona (Custom Prompt)</label>
                <textarea 
                  value={editingCompanion.system_prompt_appendix || ''}
                  onChange={e => setEditingCompanion({...editingCompanion, system_prompt_appendix: e.target.value})}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-400/10 outline-none transition-all resize-none h-24"
                  placeholder="Add custom instructions for this AI buddy..."
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-stone-700">Voice Pitch</label>
                  <span className="text-xs font-medium text-stone-500">{editingCompanion.tts_pitch?.toFixed(1) || '0.0'}</span>
                </div>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  step="0.5"
                  value={editingCompanion.tts_pitch || 0}
                  onChange={e => setEditingCompanion({...editingCompanion, tts_pitch: parseFloat(e.target.value)})}
                  className="w-full accent-stone-900"
                />
              </div>`;

// Replace the single 'Name (Remark)' block with the new block.
const nameRegex = /<div>\s*<label className="block text-sm font-bold text-stone-700 mb-1">Name \(Remark\)<\/label>.*?<\/div>/s;
text = text.replace(nameRegex, replacement);

fs.writeFileSync('src/components/CustomPersonaModal.tsx', text, 'utf-8');
