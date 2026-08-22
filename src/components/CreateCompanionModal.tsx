import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Mic, 
  Sliders, 
  Play, 
  Sparkles, 
  UserPlus, 
  Volume2, 
  Check, 
  AlertCircle,
  HelpCircle,
  FileText,
  Crop
} from 'lucide-react';
import { Companion, VoiceSlotConfig, MiniMaxConfig } from '../types';
import { speakKorean, stopSpeaking } from '../utils/audio';
import { AvatarCropModal } from './AvatarCropModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newCompanion: Companion, voiceSlot: VoiceSlotConfig) => void;
  minimaxConfig?: MiniMaxConfig;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&h=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&h=600&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&h=600&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&h=600&q=80',
];

export const CreateCompanionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
  minimaxConfig
}) => {
  const [nameKr, setNameKr] = useState('');
  const [statusMsg, setStatusMsg] = useState('온라인');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0]);
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Avatar Crop state
  const [rawUploadSrc, setRawUploadSrc] = useState<string>('');
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);
  
  // Voice Clone Parameters
  const [voiceId, setVoiceId] = useState(`voice_custom_${Math.floor(100 + Math.random() * 900)}`);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [emotion, setEmotion] = useState<string>('natural');
  
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorText('图片大小不能超过 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawUploadSrc(reader.result as string);
        setIsCropOpen(true);
        setErrorText('');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    setAvatarUrl(croppedBase64);
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setErrorText('');
    try {
      const testText = "안녕하세요! 오늘 하루 어때요? 편하게 이야기해요.";
      const tempConfig: MiniMaxConfig = {
        group_id: minimaxConfig?.group_id || '',
        api_key: minimaxConfig?.api_key || '',
        model: minimaxConfig?.model || 'speech-01-turbo',
        voice_slots: {
          temp_custom: {
            voice_id: voiceId || 'voice_custom_001',
            speed: Number(speed) || 1.0,
            pitch: Number(pitch) || 0,
            emotion: emotion || 'natural'
          }
        }
      };

      speakKorean(testText, {
        characterId: 'temp_custom',
        pitch: 1.0,
        rate: speed,
        emotion: emotion,
        minimaxConfig: tempConfig,
        onEnd: () => setIsTestingVoice(false),
        onError: () => setIsTestingVoice(false)
      });
    } catch (err) {
      console.warn('Voice test error:', err);
      setIsTestingVoice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKr.trim()) {
      setErrorText('请输入角色的韩文名字');
      return;
    }

    const uniqueId = `custom_${Date.now()}`;
    const newCompanion: Companion = {
      id: uniqueId,
      name_ko: nameKr.trim(),
      name_kr: nameKr.trim(),
      name_zh: nameKr.trim(),
      name_en: nameKr.trim(),
      group: 'Custom Friend',
      avatar: avatarUrl || DEFAULT_AVATARS[0],
      customAvatarUrl: avatarUrl || DEFAULT_AVATARS[0],
      badge: 'MY BUDDY',
      status_msg: statusMsg.trim() || '온라인',
      voice_desc: `MiniMax Voice (${voiceId})`,
      system_prompt: systemPrompt.trim() || `[Character: ${nameKr}] 亲切随和的韩国男生好友。口吻自然松弛，每次回复1~2句话，像真实KakaoTalk聊天一样，严禁密集感叹号与做作油腻台词。`,
      persona: systemPrompt.trim() || `亲切随和的韩国男生好友 ${nameKr}`,
      tone_style: "标准韩国男生KakaoTalk发信口吻：简明、自然、松弛、每次1~2句话。严禁密集感叹号、波浪线及做作油腻台词。",
      relationship: '亲密随和的好友',
      userNickname: '너',
      voice_slot: voiceId,
      tts_pitch: 1.0,
      tts_rate: speed,
      isCustom: true
    };

    const voiceSlotConfig: VoiceSlotConfig = {
      voice_id: voiceId.trim() || `voice_${uniqueId}`,
      speed: Number(speed) || 1.0,
      pitch: Number(pitch) || 0,
      emotion: emotion || 'natural'
    };

    stopSpeaking();
    onCreate(newCompanion, voiceSlotConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-base text-stone-900">
                新建好友 (Add Custom Character)
              </h2>
              <p className="text-[11px] text-stone-500">创建专属韩国角色并绑定 MiniMax 声音克隆</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* 1. Avatar Selection & Upload */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              角色头像 (Avatar)
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer shrink-0"
                title="点击上传本地照片"
              >
                <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 shadow-xs overflow-hidden flex items-center justify-center">
                  <img src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Camera size={18} />
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>上传本地图片</span>
                  </button>
                  {avatarUrl && !DEFAULT_AVATARS.includes(avatarUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawUploadSrc(avatarUrl);
                        setIsCropOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Crop size={12} />
                      <span>裁剪</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-stone-400">预设头像:</span>
                  {DEFAULT_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-6 h-6 rounded-md overflow-hidden border transition cursor-pointer ${avatarUrl === url ? 'ring-2 ring-stone-900 border-transparent' : 'border-stone-200 opacity-70 hover:opacity-100'}`}
                    >
                      <img src={url} alt={`preset ${i}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Character Name & Status Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                角色韩文名字 <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={nameKr} 
                onChange={e => setNameKr(e.target.value)}
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition text-sm text-stone-900"
                placeholder="例如: 이도현, 차은우..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                日常状态签名 (Status)
              </label>
              <input 
                type="text" 
                value={statusMsg} 
                onChange={e => setStatusMsg(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition text-sm text-stone-900"
                placeholder="예: 촬영 대기 중, 온라인..."
              />
            </div>
          </div>

          {/* 3. Detailed Character Background & System Prompt (Hidden from UI view after creation) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <FileText size={13} className="text-stone-500" />
                <span>角色人设 / 背景设定 (System Prompt)</span>
              </label>
              <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">
                前端私密隐藏
              </span>
            </div>
            <textarea 
              rows={3}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition text-xs text-stone-900 leading-relaxed"
              placeholder="请描述角色的详细背景、性格特点、说话习惯等。创建完成后该设定在聊天界面彻底隐藏，仅作为底层上下文运行..."
            />
            <p className="text-[10px] text-stone-400 mt-1">
              💡 该角色会自动继承全站通用禁令：禁止油腻台词与过度感叹号，遵循 KakaoTalk / 泡泡 1~2 句话自然短讯风格。
            </p>
          </div>

          {/* 4. MiniMax Voice Clone Configuration */}
          <div className="bg-stone-50/90 p-4 rounded-xl border border-stone-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Mic size={15} className="text-stone-900" />
                <span className="text-xs font-bold text-stone-900">
                  音色配置 (MiniMax T2A Voice Clone)
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Play size={11} className={isTestingVoice ? "animate-spin text-amber-300" : ""} />
                <span>{isTestingVoice ? '正在合成...' : '试听音色'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cloned Voice ID */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  MiniMax Cloned Voice ID
                </label>
                <input 
                  type="text" 
                  value={voiceId}
                  onChange={e => setVoiceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-900"
                  placeholder="例如: voice_custom_001"
                />
              </div>

              {/* Emotion Preset */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  情绪预设 (Emotion)
                </label>
                <select
                  value={emotion}
                  onChange={e => setEmotion(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-900"
                >
                  <option value="natural">Natural (自然)</option>
                  <option value="happy">Happy (开心)</option>
                  <option value="calm">Calm (沉稳)</option>
                  <option value="soft">Soft (温柔)</option>
                  <option value="energetic">Energetic (阳光)</option>
                  <option value="playful">Playful (调皮)</option>
                </select>
              </div>

              {/* Speed Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-stone-600 mb-1">
                  <span>语速调节 (Speed)</span>
                  <span className="font-mono text-stone-900 font-bold">{speed.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-stone-900 cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-stone-600 mb-1">
                  <span>音调调节 (Pitch)</span>
                  <span className="font-mono text-stone-900 font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  step="1" 
                  value={pitch}
                  onChange={e => setPitch(parseInt(e.target.value))}
                  className="w-full accent-stone-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              取消
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>新建角色 (Create Buddy)</span>
            </button>
          </div>
        </form>
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
