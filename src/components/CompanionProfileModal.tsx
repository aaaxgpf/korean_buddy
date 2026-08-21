import React, { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { Companion } from '../types';
import { CompanionAvatar } from './CompanionAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companion: Companion | null;
  onSave: (comp: Companion) => void;
}

export const CompanionProfileModal: React.FC<Props> = ({ isOpen, onClose, companion, onSave }) => {
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (companion && isOpen) {
      setEditingCompanion({ ...companion });
    }
  }, [companion, isOpen]);

  if (!isOpen || !editingCompanion) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCompanion) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingCompanion({
          ...editingCompanion,
          customAvatarUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (editingCompanion) {
      onSave(editingCompanion);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-full shadow-2xl">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-stone-800">AI Buddy Settings</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-32 h-32 rounded-full overflow-hidden relative cursor-pointer group shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <CompanionAvatar
                companion={editingCompanion}
                sizeClassName="w-32 h-32"
                alt="Avatar"
                className="w-full h-full text-5xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white flex-col gap-1">
                <Camera size={24} />
                <span className="text-xs font-bold">Upload</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
          <div className="space-y-4">
            <div>
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
                value={editingCompanion.status_msg || ''}
                onChange={e => setEditingCompanion({...editingCompanion, status_msg: e.target.value})}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-400/10 outline-none transition-all"
                placeholder="Status message..."
              />
            </div>

            {(editingCompanion.group || editingCompanion.role || editingCompanion.mbti || editingCompanion.birth) && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs text-stone-600">
                <div className="flex flex-wrap gap-1.5 font-medium">
                  {editingCompanion.group && <span className="px-2 py-0.5 bg-stone-200/80 rounded-md text-stone-800 font-bold">{editingCompanion.group}</span>}
                  {editingCompanion.mbti && <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded-md text-indigo-700 font-bold">{editingCompanion.mbti}</span>}
                  {editingCompanion.birth && <span className="px-2 py-0.5 bg-stone-100 rounded-md text-stone-700">{editingCompanion.birth}</span>}
                  {editingCompanion.role && <span className="px-2 py-0.5 bg-stone-100 rounded-md text-stone-700">{editingCompanion.role}</span>}
                </div>
                {editingCompanion.personality_traits && editingCompanion.personality_traits.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-stone-200/60">
                    <span className="font-bold text-stone-800 block text-[11px] uppercase tracking-wider">人设与性格特质</span>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600 leading-relaxed">
                      {editingCompanion.personality_traits.map((trait, idx) => (
                        <li key={idx}>{trait}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {editingCompanion.tone_style && (
                  <div className="pt-1 border-t border-stone-200/60 text-stone-600">
                    <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block mb-0.5">说话习惯与语调</span>
                    <p className="leading-relaxed">{editingCompanion.tone_style}</p>
                  </div>
                )}
              </div>
            )}

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
                <span className="text-xs text-stone-500">{editingCompanion.tts_pitch?.toFixed(1) || '0.0'}</span>
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
            </div>
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
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-stone-100 shrink-0">
           <button onClick={handleSave} className="w-full py-3.5 bg-[#07C160] text-white font-bold rounded-xl shadow-sm hover:bg-[#06AD56] transition-colors">
             Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};
