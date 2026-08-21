import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Trash2, Sparkles, User, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, profile, onSave }) => {
  const [name, setName] = useState(profile.userName || profile.name || 'Student');
  const [userCallSign, setUserCallSign] = useState(profile.userCallSign || '너');
  const [status, setStatus] = useState(profile.status || '한국어 공부 중! ✨');
  const [avatar, setAvatar] = useState(profile.avatar || 'ME');
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl || localStorage.getItem('user_profile_avatar') || ''
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      localStorage.setItem('user_profile_avatar', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated: UserProfile = {
      name: name.trim() || 'Student',
      userName: name.trim() || 'Student',
      userCallSign: userCallSign.trim() || '너',
      status: status.trim() || '한국어 공부 중!',
      avatar: avatar.trim() || 'ME',
      avatarUrl: avatarUrl.trim() || undefined,
    };
    if (avatarUrl.trim()) {
      localStorage.setItem('user_profile_avatar', avatarUrl.trim());
    }
    onSave(updated);
    onClose();
  };

  const quickCallSigns = ['너', '이름', '누나', '친구', '더비', '브리즈', '42', '자기야'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-stone-900 flex items-center gap-2">
              <User size={18} className="text-amber-500" />
              <span>개인 프로필 설정 (Profile & Persona)</span>
            </h2>
            <p className="text-xs text-stone-500">自定义你的专属身份、头像与爱豆对你的称呼</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center gap-3">
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
              title="点击上传本地头像图片"
            >
              <div className="w-24 h-24 rounded-full bg-stone-900 text-[#FFEB3B] flex items-center justify-center font-bold text-3xl shadow-md overflow-hidden border-2 border-stone-200 group-hover:opacity-90 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <span>{avatar.slice(0, 2)}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                <Camera size={18} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-2 rounded-full shadow-md border-2 border-white">
                <Upload size={14} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Camera size={13} />
                <span>选择本地图片 (Upload Photo)</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl('');
                    localStorage.removeItem('user_profile_avatar');
                  }}
                  className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  title="清除头像图片"
                >
                  <Trash2 size={13} />
                  <span>清除</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="space-y-4">
            {/* 1. User Real/Display Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <span>我的名字 / 用户昵称 (My Name)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm text-stone-900 font-medium"
                placeholder="例如: 莉莉 / 서연 / 민지"
              />
            </div>

            {/* 2. Character Call Sign to User */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MessageCircle size={13} className="text-amber-600" />
                  <span>角色对我的称呼 / 专属称谓 (Call Sign)</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-stone-400 font-normal">爱豆聊天时如何叫你</span>
              </label>
              <input 
                type="text" 
                value={userCallSign} 
                onChange={e => setUserCallSign(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm text-stone-900 font-medium"
                placeholder="例如: 너, 누나, 친구, 더비, 브리즈..."
              />
              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-stone-400">快速选择:</span>
                {quickCallSigns.map((sign) => (
                  <button
                    key={sign}
                    type="button"
                    onClick={() => setUserCallSign(sign === '이름' ? name : sign)}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                      userCallSign === (sign === '이름' ? name : sign)
                        ? 'bg-amber-500 text-white border-amber-500 font-bold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {sign === '이름' ? `名字 (${name || 'OO'})` : sign}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Status Message */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">상태메시지 (Status / Signature)</label>
              <input 
                type="text" 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm text-stone-900"
                placeholder="한국어 공부 중! ✨"
              />
            </div>

            {/* 4. Text Avatar fallback */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">默认字母缩写 (Initials)</label>
                <input 
                  type="text" 
                  maxLength={3}
                  value={avatar} 
                  onChange={e => setAvatar(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm text-stone-900 uppercase"
                  placeholder="ME"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">或外部图片 URL (Optional)</label>
                <input 
                  type="text" 
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl} 
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm text-stone-900"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 flex gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all text-sm"
          >
            취소 (Cancel)
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles size={15} className="text-amber-400" />
            <span>저장 및 적용 (Save)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
