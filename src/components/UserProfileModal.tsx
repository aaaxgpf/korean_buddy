import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';

interface UserProfile {
  name: string;
  status: string;
  avatar: string;
  avatarUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, profile, onSave }) => {
  const [name, setName] = useState(profile.name);
  const [status, setStatus] = useState(profile.status);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h2 className="font-bold text-lg text-stone-800">프로필 설정 (Edit Profile)</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-[32px] bg-[#3E2723] text-[#FFEB3B] flex items-center justify-center font-bold text-4xl shadow-md overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : avatar}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-sm border border-stone-100 text-stone-500 pointer-events-none">
                <Camera size={16} />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">이름 (Name)</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">상태메시지 (Status)</label>
              <input 
                type="text" 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800"
                placeholder="상태메시지를 입력하세요"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">프로필 텍스트 (Avatar Text)</label>
              <input 
                type="text" 
                maxLength={2}
                value={avatar} 
                onChange={e => setAvatar(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800"
                placeholder="나"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">프로필 이미지 URL (Optional)</label>
              <input 
                type="text" 
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800"
                placeholder="https://..."
              />
            </div>
          </div>
          
          <button 
            onClick={() => {
              onSave({ name, status, avatar, avatarUrl });
              onClose();
            }}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all"
          >
            저장 (Save)
          </button>
        </div>
      </div>
    </div>
  );
};
