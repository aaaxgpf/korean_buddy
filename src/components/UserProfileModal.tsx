import React, { useState, useRef } from 'react';
import { X, Camera, Trash2, Crop } from 'lucide-react';
import { UserProfile } from '../types';
import { AvatarCropModal } from './AvatarCropModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, profile, onSave }) => {
  const [name, setName] = useState(profile.userName || profile.name || 'User');
  const [userCallSign, setUserCallSign] = useState(profile.userCallSign || '너');
  const [status, setStatus] = useState(profile.status || '한국어 공부 중!');
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl || localStorage.getItem('user_profile_avatar') || ''
  );
  
  // Crop modal state
  const [rawUploadSrc, setRawUploadSrc] = useState<string>('');
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setRawUploadSrc(base64);
      setIsCropOpen(true);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    setAvatarUrl(croppedBase64);
    localStorage.setItem('user_profile_avatar', croppedBase64);
  };

  const handleSave = () => {
    const updated: UserProfile = {
      name: name.trim() || 'User',
      userName: name.trim() || 'User',
      userCallSign: userCallSign.trim() || '너',
      status: status.trim() || '한국어 공부 중!',
      avatar: (name.trim() || 'ME').slice(0, 2).toUpperCase(),
      avatarUrl: avatarUrl.trim() || undefined,
    };
    if (avatarUrl.trim()) {
      localStorage.setItem('user_profile_avatar', avatarUrl.trim());
    } else {
      localStorage.removeItem('user_profile_avatar');
    }
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200/80 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-base text-stone-900">
            个人资料设置 (Profile)
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
              title="点击更换头像"
            >
              <div className="w-20 h-20 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center font-medium text-xl shadow-xs overflow-hidden border border-stone-200/80 group-hover:opacity-95 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span>{(name || 'ME').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/35 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera size={18} />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                更换头像 (Change Photo)
              </button>
              {avatarUrl && (
                <>
                  <span className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawUploadSrc(avatarUrl);
                      setIsCropOpen(true);
                    }}
                    className="text-xs text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <Crop size={11} />
                    <span>重新裁剪</span>
                  </button>
                  <span className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      localStorage.removeItem('user_profile_avatar');
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>删除</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Form Group (iOS Style) */}
          <div className="space-y-3.5 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/60">
            {/* 1. Display Name */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">
                我的昵称 (User Name)
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 transition text-sm text-stone-900"
                placeholder="例如: 敏智 / 你的名字"
              />
            </div>

            {/* 2. Idol Call Sign */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">
                角色的1对1专属称呼 (1-on-1 Call Sign)
              </label>
              <input 
                type="text" 
                value={userCallSign} 
                onChange={e => setUserCallSign(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 transition text-sm text-stone-900"
                placeholder="例如: 너, 누나, 친구, 敏智呀..."
              />
            </div>

            {/* 3. Status Signature */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">
                状态签名 (Status / Bio)
              </label>
              <input 
                type="text" 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 transition text-sm text-stone-900"
                placeholder="한국어 공부 중!"
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-stone-100 shrink-0">
          <button 
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-stone-900 hover:bg-black text-white font-medium rounded-xl transition shadow-xs text-sm cursor-pointer"
          >
            保存更改 (Save Changes)
          </button>
        </div>
      </div>

      {/* Avatar Crop & Zoom Modal */}
      <AvatarCropModal
        isOpen={isCropOpen}
        imageSrc={rawUploadSrc}
        onClose={() => setIsCropOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </div>
  );
};
