const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionProfileModal.tsx', 'utf-8');

text = text.replace(
    '<h2 className="text-xl font-bold text-stone-800">Edit Buddy Profile</h2>',
    '<h2 className="text-xl font-bold text-stone-800">AI Buddy Settings</h2>'
);

const pitchBlock = `            <div>
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

const newRateBlock = `
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-stone-700">Speech Rate</label>
                <span className="text-xs text-stone-500">{editingCompanion.tts_rate?.toFixed(2) || '1.00'}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.05"
                value={editingCompanion.tts_rate || 1.0}
                onChange={e => setEditingCompanion({...editingCompanion, tts_rate: parseFloat(e.target.value)})}
                className="w-full accent-stone-900"
              />
            </div>`;

text = text.replace(pitchBlock, pitchBlock + newRateBlock);

// Remove font-bold from the range value labels if they have it
text = text.replace('font-medium text-stone-500', 'text-stone-500');

fs.writeFileSync('src/components/CompanionProfileModal.tsx', text, 'utf-8');
