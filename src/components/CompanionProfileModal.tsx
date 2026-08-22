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
          <h2 className="text-lg font-semibold text-stone-900">Buddy Profile</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div 
              className="w-24 h-24 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <CompanionAvatar
                companion={editingCompanion}
                sizeClassName="w-24 h-24"
                alt="Avatar"
                className="w-full h-full text-4xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white flex-col gap-1">
                <Camera size={20} />
                <span className="text-[10px] font-medium">Upload</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Remark Name (备注名称)</label>
              <input 
                type="text" 
                value={editingCompanion.remark || editingCompanion.name_ko}
                onChange={e => setEditingCompanion({...editingCompanion, remark: e.target.value})}
                className="w-full p-2.5 px-3 text-sm rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                placeholder="e.g. My Bestie"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Status Signature (个性签名)</label>
              <input 
                type="text" 
                value={editingCompanion.status_msg || ''}
                onChange={e => setEditingCompanion({...editingCompanion, status_msg: e.target.value})}
                className="w-full p-2.5 px-3 text-sm rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                placeholder="Status message..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Persona & Custom Notes (专属人设与个性化提示)</label>
              <textarea 
                value={editingCompanion.system_prompt_appendix || ''}
                onChange={e => setEditingCompanion({...editingCompanion, system_prompt_appendix: e.target.value})}
                className="w-full p-2.5 px-3 text-xs rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all resize-none h-20 leading-relaxed"
                placeholder="Custom context instructions for your buddy..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-stone-700">Voice Pitch</label>
                  <span className="text-[11px] text-stone-500">{editingCompanion.tts_pitch?.toFixed(1) || '0.0'}</span>
                </div>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  step="0.5"
                  value={editingCompanion.tts_pitch || 0}
                  onChange={e => setEditingCompanion({...editingCompanion, tts_pitch: parseFloat(e.target.value)})}
                  className="w-full accent-stone-900 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-stone-700">Speech Rate</label>
                  <span className="text-[11px] text-stone-500">{editingCompanion.tts_rate?.toFixed(2) || '1.00'}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.05"
                  value={editingCompanion.tts_rate || 1.0}
                  onChange={e => setEditingCompanion({...editingCompanion, tts_rate: parseFloat(e.target.value)})}
                  className="w-full accent-stone-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-stone-100 shrink-0">
           <button onClick={handleSave} className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-medium rounded-xl shadow-xs transition-all cursor-pointer">
             Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};
