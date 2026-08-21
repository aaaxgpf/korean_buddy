
import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Volume2, 
  Edit3, 
  Trash2, 
  RotateCcw,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { Companion } from '../types';
import { speakKorean } from '../utils/audio';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  companions: Companion[];
  selectedCompanionId: string;
  onSelectCompanion: (companion: Companion) => void;
  onSaveCompanion: (companion: Companion) => void;
  onDeleteCompanion: (companionId: string) => void;
  onResetDefaults: () => void;
}

export const CustomPersonaModal: React.FC<CustomPersonaModalProps> = ({
  isOpen,
  onClose,
  companions,
  selectedCompanionId,
  onSelectCompanion,
  onSaveCompanion,
  onDeleteCompanion,
  onResetDefaults
}) => {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, companions.findIndex(c => c.id === selectedCompanionId)));
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleEdit = (comp: Companion) => {
    setEditingCompanion({ ...comp });
  };

  const handleSaveEdit = () => {
    if (editingCompanion) {
      onSaveCompanion(editingCompanion);
      setEditingCompanion(null);
    }
  };

  const handleCreateNew = () => {
    const newComp: Companion = {
      id: `custom_${Date.now()}`,
      name_ko: '새 친구',
      name_zh: 'New Buddy',
      name_en: 'New Buddy',
      avatar: '😊',
      avatar_bg: 'bg-stone-100',
      color: 'text-stone-800',
      badge: 'NEW',
      mbti: 'ENFP',
      status_msg: 'Hello!',
      voice_desc: 'Friendly',
      base_idol_profile: '',
      persona_prompt: 'You are a friendly Korean buddy.',
      greeting_zh: '你好！',
      greeting_ko: '안녕하세요!',
      system_prompt_appendix: '',
      tts_voice: 'ko-KR-Standard-A',
      tts_rate: 1.0,
      tts_pitch: 0
    };
    setEditingCompanion(newComp);
  };

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

  if (editingCompanion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-full shadow-2xl">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <h2 className="text-xl font-bold text-stone-800">Edit Buddy</h2>
            <button onClick={() => setEditingCompanion(null)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-32 h-32 rounded-3xl overflow-hidden relative cursor-pointer group shadow-md"
                onClick={() => fileInputRef.current?.click()}
              >
                {editingCompanion.customAvatarUrl ? (
                  <img src={editingCompanion.customAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-5xl ${editingCompanion.avatar_bg}`}>
                    {editingCompanion.avatar}
                  </div>
                )}
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
              </div>
              
              
            </div>
          </div>
          <div className="p-4 border-t border-stone-100 shrink-0">
             <button onClick={handleSaveEdit} className="w-full py-3.5 bg-stone-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-colors">
               Save Changes
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4 bg-stone-900/90 backdrop-blur-md sm:p-6 animate-in fade-in duration-300">
       <div className="flex justify-between items-center w-full max-w-4xl mx-auto mt-4">
         <h1 className="text-2xl font-bold text-white">Select Buddy</h1>
         <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
           <X size={24} />
         </button>
       </div>

       <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center relative perspective-[1200px]">
          {/* Card Stack */}
          <div className="relative w-64 h-[420px] md:w-72 md:h-[480px] flex items-center justify-center">
             {companions.map((comp, idx) => {
                const offset = idx - activeIndex;
                const isVisible = Math.abs(offset) <= 2;
                if (!isVisible) return null;

                const scale = 1 - Math.abs(offset) * 0.12;
                const translateY = Math.abs(offset) * 15;
                const translateX = offset * 50;
                const zIndex = 30 - Math.abs(offset);
                const opacity = 1 - Math.abs(offset) * 0.4;
                const isActive = offset === 0;

                return (
                   <div 
                     key={comp.id}
                     className="absolute w-full h-full transition-all duration-300 ease-out cursor-pointer"
                     style={{ 
                        transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                        zIndex,
                        opacity,
                        pointerEvents: isActive ? 'auto' : 'auto'
                     }}
                     onClick={() => { onSelectCompanion(comp); onClose(); }}
                   >
                      <div className={`w-full h-full bg-white rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${isActive ? 'border-stone-900 ring-4 ring-stone-900/10' : 'border-stone-200'}`}>
                         <div className="flex-1 bg-stone-100 relative">
                            {comp.customAvatarUrl ? (
                              <img src={comp.customAvatarUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-stone-100 to-stone-200">
                                {comp.avatar}
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                               <div className="flex items-center gap-2 mb-1">
                                 <h3 className="font-bold text-2xl truncate">{comp.remark || comp.name_ko}</h3>
                               </div>
                               
                            </div>
                            {selectedCompanionId === comp.id && (
                               <div className="absolute top-4 right-4 bg-stone-900 text-white p-2 rounded-full shadow-lg">
                                 <Check size={20} strokeWidth={3} />
                               </div>
                            )}
                         </div>
                         {isActive && (
                           <div className="h-16 bg-white flex items-center justify-between px-2 shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(comp); }} className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors">
                                <Edit3 size={18} /> Edit
                              </button>
                              <div className="w-[1px] h-8 bg-stone-200" />
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  if(window.confirm('Delete this buddy?')) onDeleteCompanion(comp.id) 
                                }} 
                                disabled={companions.length <= 1}
                                className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600 disabled:opacity-30 transition-colors"
                              >
                                <Trash2 size={18} /> Delete
                              </button>
                           </div>
                         )}
                      </div>
                   </div>
                );
             })}
          </div>

          
       </div>
    </div>
  )
}
