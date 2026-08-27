import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Palette, 
  Target, 
  Globe, 
  Mic, 
  Volume2, 
  Key, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  User, 
  Sparkles, 
  Server, 
  Zap, 
  RefreshCw,
  Eye,
  EyeOff,
  Clipboard,
  X,
  Radio,
  ExternalLink
} from 'lucide-react';
import { AppSettings, UserProfile, LLMConfig, MiniMaxConfig, VoiceSlotConfig, Companion } from '../types';
import { PRESET_COMPANIONS } from '../data/companions';
import { speakKorean, stopSpeaking } from '../utils/audio';
import { directTestLLMConnection } from '../utils/geminiDirect';
import { UserProfileModal } from './UserProfileModal';
import { notifyToast, showSuccessToast, showErrorToast, formatApiErrorMessage } from '../utils/toast';
import { CompanionAvatar } from './CompanionAvatar';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  userProfile: UserProfile;
  onUpdateUserProfile?: (profile: UserProfile) => void;
  companions?: Companion[];
  onResetAllData?: () => void;
}

export const SettingsView: React.FC<Props> = ({ 
  settings, 
  onUpdateSettings, 
  userProfile, 
  onUpdateUserProfile,
  companions = PRESET_COMPANIONS,
  onResetAllData
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeVoiceTab, setActiveVoiceTab] = useState<string>('sunwoo');
  const [testingAudio, setTestingAudio] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  
  // Custom reset confirmation states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Key Visibility Toggles
  const [showLlmKey, setShowLlmKey] = useState<boolean>(false);
  const [showMmKey, setShowMmKey] = useState<boolean>(false);

  // LLM State
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    if (settings.api_config && settings.api_config.provider) {
      return settings.api_config;
    }
    try {
      const saved = localStorage.getItem('korean_buddy_api_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { provider: 'gemini', apiKey: '', baseURL: '', model: 'gemini-3.7-flash' };
  });

  // MiniMax State
  const [mmConfig, setMmConfig] = useState<MiniMaxConfig>(() => {
    if (settings.minimax_config && (settings.minimax_config.api_key || settings.minimax_config.group_id)) {
      return settings.minimax_config;
    }
    try {
      const saved = localStorage.getItem('korean_minimax_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      group_id: '',
      api_key: '',
      model: 'speech-01-turbo',
      voice_slots: {}
    };
  });

  const [isTestingLLM, setIsTestingLLM] = useState<boolean>(false);
  const [llmTestStatus, setLlmTestStatus] = useState<{ ok?: boolean; message?: string } | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSavedFeedback = () => {
    setSavedSuccess(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSavedSuccess(false);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Update LLM Config
  const handleUpdateLLMField = (field: keyof LLMConfig, value: string) => {
    // If field is apiKey, strip non-ASCII characters to avoid ISO-8859-1 header errors
    const sanitizedValue = field === 'apiKey' ? value.replace(/[^\x00-\x7F]/g, '').trim() : value;
    const updated: LLMConfig = {
      ...llmConfig,
      [field]: sanitizedValue
    };
    setLlmConfig(updated);
    try {
      localStorage.setItem('korean_buddy_api_config', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    onUpdateSettings({
      ...settings,
      api_config: updated
    });
    triggerSavedFeedback();
  };

  // Switch Provider Preset
  const handleSelectProvider = (providerId: LLMConfig['provider']) => {
    const preset = providerPresets[providerId] || providerPresets.custom;
    const updated: LLMConfig = {
      ...llmConfig,
      provider: providerId,
      model: preset.defaultModel,
      baseURL: preset.defaultBaseURL
    };
    setLlmConfig(updated);
    try {
      localStorage.setItem('korean_buddy_api_config', JSON.stringify(updated));
    } catch (e) {}
    onUpdateSettings({
      ...settings,
      api_config: updated
    });
    triggerSavedFeedback();
  };

  // Update MiniMax Config
  const handleUpdateMinimaxField = (field: keyof MiniMaxConfig, value: any) => {
    const updated: MiniMaxConfig = {
      ...mmConfig,
      [field]: value
    };
    setMmConfig(updated);
    try {
      localStorage.setItem('korean_minimax_config', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save minimax config:', e);
    }
    onUpdateSettings({
      ...settings,
      minimax_config: updated
    });
    triggerSavedFeedback();
  };

  // Update Voice Slot for Character
  const handleUpdateVoiceSlot = (characterId: string, slotPartial: Partial<VoiceSlotConfig>) => {
    const currentSlots = mmConfig.voice_slots || {};
    const existingSlot = currentSlots[characterId] || {
      voice_id: `voice_${characterId}_001`,
      speed: 1.0,
      pitch: 0,
      emotion: 'natural'
    };

    const updatedSlots = {
      ...currentSlots,
      [characterId]: {
        ...existingSlot,
        ...slotPartial
      }
    };

    handleUpdateMinimaxField('voice_slots', updatedSlots);
  };

  // Direct clipboard paste helper for seamless experience
  const handlePasteToField = async (setter: (val: string) => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setter(text.trim());
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
    }
  };

  const handleTestLLM = async () => {
    setIsTestingLLM(true);
    setLlmTestStatus(null);
    try {
      // 1. Test via server proxy first (keeps key secure & avoids CORS/browser restrictions)
      const res = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(llmConfig)
      }).catch(() => null);

      if (res) {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          const successMsg = data.message || '大模型已成功响应！';
          setLlmTestStatus({ ok: true, message: successMsg });
          showSuccessToast('✅ 连接测试成功', successMsg);
          return;
        } else if (data.error) {
          throw new Error(data.error);
        }
      }

      // 2. Client direct test fallback (handles static / direct endpoint cases)
      if (llmConfig.apiKey?.trim()) {
        try {
          const result = await directTestLLMConnection({
            provider: llmConfig.provider,
            apiKey: llmConfig.apiKey || '',
            model: llmConfig.model,
            baseURL: llmConfig.baseURL
          });
          const successMsg = result.message || '大模型已成功响应！';
          setLlmTestStatus({ ok: true, message: successMsg });
          showSuccessToast('✅ 客户端直连测试成功', successMsg);
          return;
        } catch (directErr: any) {
          throw directErr;
        }
      }

      const noKeyMsg = '请先填入有效的 API Key 或选择服务商';
      setLlmTestStatus({ ok: false, message: noKeyMsg });
      notifyToast({
        type: 'warning',
        title: '🔑 未填写 API Key',
        message: noKeyMsg,
      });
    } catch (err: any) {
      const errMsg = err.message || '连接测试异常，请检查网络或 API Key';
      setLlmTestStatus({ ok: false, message: errMsg });
      const { title, message } = formatApiErrorMessage(err, '连接测试');
      showErrorToast(title, message);
    } finally {
      setIsTestingLLM(false);
    }
  };

  const testIdolVoice = (charId: string) => {
    const comp = companions.find(c => c.id === charId) || PRESET_COMPANIONS.find(c => c.id === charId) || PRESET_COMPANIONS[0];
    const testPhrase = comp.intro_kr || '안녕하세요! 반가워요.';
    
    stopSpeaking();
    setTestingAudio(true);
    speakKorean(testPhrase, {
      characterId: charId,
      minimaxConfig: mmConfig,
      rate: mmConfig.voice_slots?.[charId]?.speed || comp.tts_rate || 1.0,
      pitch: comp.tts_pitch || 0.95,
      emotion: mmConfig.voice_slots?.[charId]?.emotion || 'natural',
      onEnd: () => setTestingAudio(false),
      onError: () => setTestingAudio(false)
    });
  };

  // Provider presets
  const providerPresets: Record<string, { defaultModel: string; defaultBaseURL: string; placeholderKey: string; popularModels: string[] }> = {
    gemini: {
      defaultModel: 'gemini-3.7-flash',
      defaultBaseURL: '',
      placeholderKey: '填入 Google AI Studio API Key',
      popularModels: ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview']
    },
    anthropic: {
      defaultModel: 'claude-3-5-sonnet-20241022',
      defaultBaseURL: 'https://api.anthropic.com/v1/messages',
      placeholderKey: 'sk-ant-api03-...',
      popularModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
    },
    deepseek: {
      defaultModel: 'deepseek-chat',
      defaultBaseURL: 'https://api.deepseek.com',
      placeholderKey: 'sk-... (DeepSeek 开放平台 API Key)',
      popularModels: ['deepseek-chat', 'deepseek-reasoner']
    },
    openai: {
      defaultModel: 'gpt-4o',
      defaultBaseURL: 'https://api.openai.com/v1',
      placeholderKey: 'sk-...',
      popularModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini']
    },
    custom: {
      defaultModel: 'gpt-4o-mini',
      defaultBaseURL: 'https://your-custom-proxy.com/v1',
      placeholderKey: 'sk-...',
      popularModels: ['gpt-4o-mini', 'claude-3-5-sonnet', 'deepseek-chat', 'qwen-plus']
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3.5 sm:px-6 py-6 pb-36 space-y-6 animate-in fade-in duration-300 h-full overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Settings size={17} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 font-sans">
              设置 (Settings)
            </h1>
            <p className="text-xs text-stone-500">接口配置与学习偏好</p>
          </div>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={12} />
            <span>已保存</span>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      <div 
        onClick={() => setIsProfileModalOpen(true)}
        className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-stone-200/80 flex items-center justify-between gap-3 hover:border-stone-400 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-medium text-base shadow-xs overflow-hidden shrink-0 border border-stone-200">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span>{(userProfile.userName || userProfile.name || 'ME').slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-stone-900 flex items-center gap-1.5 flex-wrap">
              <span className="truncate">{userProfile.userName || userProfile.name}</span>
              {userProfile.userCallSign && (
                <span className="text-[11px] px-1.5 py-0.2 bg-stone-100 text-stone-700 rounded-md font-normal shrink-0">
                  称呼: {userProfile.userCallSign}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500 truncate mt-0.5">{userProfile.status}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileModalOpen(true);
          }}
          className="px-3 py-1.5 bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <User size={12} />
          <span>编辑</span>
        </button>
      </div>

      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={userProfile}
          onSave={(updated) => {
            if (onUpdateUserProfile) {
              onUpdateUserProfile(updated);
            }
          }}
        />
      )}

      {/* SECTION 1: LLM API Configuration Center */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2 text-stone-900 font-bold">
            <Server size={17} className="text-stone-900" />
            <span className="text-sm sm:text-base font-bold">模型接口 (LLM API)</span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full border border-stone-200">
            {llmConfig.provider.toUpperCase()}
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Provider Select */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              服务商 (Provider)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'gemini', label: 'Gemini' },
                { id: 'anthropic', label: 'Claude' },
                { id: 'deepseek', label: 'DeepSeek' },
                { id: 'openai', label: 'OpenAI' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => {
                const isSelected = llmConfig.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Key size={12} className="text-stone-500" />
                <span>API Key</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowLlmKey(!showLlmKey)}
                  className="text-[10.5px] text-stone-500 hover:text-stone-900 flex items-center gap-0.5 cursor-pointer"
                >
                  {showLlmKey ? <EyeOff size={11} /> : <Eye size={11} />}
                  <span>{showLlmKey ? '隐藏' : '显示'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateLLMField('apiKey', val))}
                  className="text-[10.5px] text-stone-700 bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer font-medium"
                >
                  <Clipboard size={10} />
                  <span>粘贴</span>
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                id="llm-api-key-input"
                name="apiKey"
                type={showLlmKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                placeholder={providerPresets[llmConfig.provider]?.placeholderKey || '请输入或粘贴 API Key...'}
                value={llmConfig.apiKey || ''}
                onChange={(e) => handleUpdateLLMField('apiKey', e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) handleUpdateLLMField('apiKey', pasted.trim());
                }}
                className="w-full text-xs font-mono px-3 py-2 pr-8 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
              />
              {Boolean(llmConfig.apiKey) && (
                <button
                  type="button"
                  onClick={() => handleUpdateLLMField('apiKey', '')}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  title="清空"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {/* Smart Key Format Detection Hint */}
            {Boolean(llmConfig.apiKey) && (
              <div className="mt-1">
                {llmConfig.apiKey?.startsWith('sk-ant-') && llmConfig.provider !== 'anthropic' && (
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('anthropic')}
                    className="w-full text-left text-[11px] p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 transition flex items-center justify-between gap-1 cursor-pointer"
                  >
                    <span>💡 检测到这是 <strong>Anthropic (Claude)</strong> 的 API Key，点击一键切换为 Claude</span>
                    <span className="font-bold underline shrink-0">立即切换 &rarr;</span>
                  </button>
                )}
                {llmConfig.apiKey?.startsWith('sk-') && !llmConfig.apiKey?.startsWith('sk-ant-') && llmConfig.provider === 'gemini' && (
                  <div className="text-[11px] p-2 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-1.5">
                    <span>💡 检测到这可能是 OpenAI / DeepSeek / 中转站 Key：</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectProvider('openai')}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        切为 OpenAI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectProvider('deepseek')}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        切为 DeepSeek
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectProvider('custom')}
                        className="px-2 py-0.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        切为 Custom 中转
                      </button>
                    </div>
                  </div>
                )}
                {llmConfig.apiKey?.startsWith('AIzaSy') && llmConfig.provider !== 'gemini' && (
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('gemini')}
                    className="w-full text-left text-[11px] p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 transition flex items-center justify-between gap-1 cursor-pointer"
                  >
                    <span>💡 检测到这是 <strong>Google Gemini</strong> 的 API Key，点击一键切换为 Gemini</span>
                    <span className="font-bold underline shrink-0">立即切换 &rarr;</span>
                  </button>
                )}
              </div>
            )}

            {llmConfig.provider === 'gemini' && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Google AI Studio 获取 Key</span>
                    <ExternalLink size={10} />
                  </a>
                  {Boolean(llmConfig.apiKey) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateLLMField('apiKey', '');
                        handleUpdateLLMField('baseURL', '');
                        handleUpdateLLMField('model', 'gemini-3.7-flash');
                        setLlmTestStatus(null);
                        showSuccessToast('✅ 已恢复默认', '已恢复使用系统内置免费 Gemini 服务');
                      }}
                      className="text-stone-500 hover:text-stone-900 hover:underline cursor-pointer"
                    >
                      恢复使用系统内置免费服务
                    </button>
                  )}
                </div>
                {!llmConfig.apiKey && (
                  <div className="text-[10.5px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                      已启用系统预置 Gemini 服务，无需填写 Key 即可畅享全功能。
                    </span>
                  </div>
                )}
                {Boolean(llmConfig.apiKey) && (
                  <div className="text-[10.5px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>已配置自定义 API Key。</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Base URL & Model Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Globe size={11} className="text-stone-500" />
                  <span>Base URL (可选)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateLLMField('baseURL', val))}
                  className="text-[9.5px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Clipboard size={10} />
                  <span>粘贴</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="llm-base-url-input"
                  name="baseURL"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={
                    llmConfig.provider === 'gemini' 
                      ? '默认官方端点' 
                      : (providerPresets[llmConfig.provider]?.defaultBaseURL || 'https://api.openai.com/v1')
                  }
                  value={llmConfig.baseURL || ''}
                  onChange={(e) => handleUpdateLLMField('baseURL', e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 pr-7 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
                />
                {Boolean(llmConfig.baseURL) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLLMField('baseURL', '')}
                    className="absolute right-2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Sliders size={11} className="text-stone-500" />
                  <span>模型名称 (Model)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateLLMField('model', val))}
                  className="text-[9.5px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Clipboard size={10} />
                  <span>粘贴</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="llm-model-name-input"
                  name="model"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={providerPresets[llmConfig.provider]?.defaultModel || 'gpt-4o'}
                  value={llmConfig.model || ''}
                  onChange={(e) => handleUpdateLLMField('model', e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 pr-7 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
                />
                {Boolean(llmConfig.model) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLLMField('model', '')}
                    className="absolute right-2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Model Chips */}
          {providerPresets[llmConfig.provider]?.popularModels && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-stone-400 font-semibold uppercase">推荐:</span>
              {providerPresets[llmConfig.provider].popularModels.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleUpdateLLMField('model', m)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-md border transition cursor-pointer font-mono ${
                    llmConfig.model === m
                      ? 'bg-stone-900 text-white border-stone-900 font-bold'
                      : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Test Button & Status */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleTestLLM}
              disabled={isTestingLLM}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Zap size={13} className={isTestingLLM ? 'animate-spin text-amber-300' : 'text-amber-400'} />
              <span>{isTestingLLM ? '测试中...' : '测试连接 (Test)'}</span>
            </button>

            {llmTestStatus && (
              <div
                className={`flex-1 p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  llmTestStatus.ok
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {llmTestStatus.ok ? <CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> : <AlertCircle size={14} className="shrink-0 text-rose-600" />}
                  <span className="font-medium break-words">{llmTestStatus.message}</span>
                </div>
                {!llmTestStatus.ok && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectProvider('gemini');
                      handleUpdateLLMField('apiKey', '');
                      handleUpdateLLMField('baseURL', '');
                      handleUpdateLLMField('model', 'gemini-3.7-flash');
                      setLlmTestStatus(null);
                      showSuccessToast('✅ 已恢复默认', '已恢复使用系统内置免费 Gemini 服务');
                    }}
                    className="self-end sm:self-auto px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-800 rounded-lg text-[11px] font-bold border border-rose-200 shrink-0 cursor-pointer shadow-2xs"
                  >
                    🔄 一键恢复系统内置免费服务
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: MiniMax Voice Cloning Engine */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2 text-stone-900 font-bold">
            <Mic size={17} className="text-stone-900" />
            <span className="text-sm sm:text-base font-bold">MiniMax 声音克隆 (Voice)</span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full border border-stone-200">
            T2A
          </span>
        </div>

        {/* API Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Key size={11} className="text-stone-500" />
                <span>Group ID</span>
              </label>
              <button
                type="button"
                onClick={() => handlePasteToField((val) => handleUpdateMinimaxField('group_id', val))}
                className="text-[9.5px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
              >
                <Clipboard size={10} />
                <span>粘贴</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                id="minimax-group-id-input"
                name="group_id"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Group ID..."
                value={mmConfig.group_id || ''}
                onChange={(e) => handleUpdateMinimaxField('group_id', e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 pr-7 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
              />
              {Boolean(mmConfig.group_id) && (
                <button
                  type="button"
                  onClick={() => handleUpdateMinimaxField('group_id', '')}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Key size={11} className="text-stone-500" />
                <span>API Key</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowMmKey(!showMmKey)}
                  className="text-[10px] text-stone-500 hover:text-stone-900 flex items-center gap-0.5 cursor-pointer"
                >
                  {showMmKey ? <EyeOff size={11} /> : <Eye size={11} />}
                  <span>{showMmKey ? '隐藏' : '显示'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateMinimaxField('api_key', val))}
                  className="text-[9.5px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Clipboard size={10} />
                  <span>粘贴</span>
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                id="minimax-api-key-input"
                name="api_key"
                type={showMmKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                placeholder="API Key..."
                value={mmConfig.api_key || ''}
                onChange={(e) => handleUpdateMinimaxField('api_key', e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 pr-7 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
              />
              {Boolean(mmConfig.api_key) && (
                <button
                  type="button"
                  onClick={() => handleUpdateMinimaxField('api_key', '')}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Sliders size={11} className="text-stone-500" />
              <span>模型 (Model)</span>
            </label>
            <select
              value={mmConfig.model || 'speech-01-turbo'}
              onChange={(e) => handleUpdateMinimaxField('model', e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
            >
              <option value="speech-01-turbo">speech-01-turbo (推荐)</option>
              <option value="speech-01-hd">speech-01-hd (高保真)</option>
              <option value="speech-01">speech-01 (标准)</option>
            </select>
          </div>
        </div>

        {/* Idol Voice Slots Manager */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold text-stone-700">
            角色音色通道 (Voice Mapping)
          </div>

          {/* Idol Selector Pills */}
          <div className="flex flex-wrap gap-1.5">
            {companions.map((comp) => {
              const isActive = activeVoiceTab === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setActiveVoiceTab(comp.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CompanionAvatar
                    companion={comp}
                    sizeClassName="w-5 h-5"
                  />
                  <span>{comp.name_ko || comp.name_kr}</span>
                </button>
              );
            })}
          </div>

          {/* Active Idol Slot Tuning Box */}
          {(() => {
            const currentCompanion = companions.find(c => c.id === activeVoiceTab) || PRESET_COMPANIONS.find(c => c.id === activeVoiceTab) || PRESET_COMPANIONS[0];
            const slot = mmConfig.voice_slots?.[currentCompanion.id] || {
              voice_id: currentCompanion.voice_slot || `voice_${currentCompanion.id}_001`,
              speed: currentCompanion.tts_rate || 1.0,
              pitch: 0,
              emotion: 'natural'
            };

            return (
              <div className="bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <CompanionAvatar
                      companion={currentCompanion}
                      sizeClassName="w-10 h-10"
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-800">
                        {currentCompanion.name_ko || currentCompanion.name_kr} ({currentCompanion.badge || 'BUDDY'})
                      </div>
                      <div className="text-[11px] text-stone-500">{currentCompanion.voice_desc || 'MiniMax Voice Clone'}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => testIdolVoice(currentCompanion.id)}
                    disabled={testingAudio}
                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={11} className={testingAudio ? "animate-spin text-amber-300" : ""} />
                    <span>{testingAudio ? '合成中...' : '试听音色'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Voice ID</label>
                    <input
                      id={`voice-slot-id-${currentCompanion.id}`}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={slot.voice_id}
                      onChange={(e) => handleUpdateVoiceSlot(currentCompanion.id, { voice_id: e.target.value })}
                      placeholder="voice_id_xxx"
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">语速: {slot.speed || 1.0}x</label>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.05"
                      value={slot.speed || 1.0}
                      onChange={(e) => handleUpdateVoiceSlot(currentCompanion.id, { speed: parseFloat(e.target.value) })}
                      className="w-full accent-stone-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">音调: {slot.pitch || 0}</label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="1"
                      value={slot.pitch || 0}
                      onChange={(e) => handleUpdateVoiceSlot(currentCompanion.id, { pitch: parseInt(e.target.value) })}
                      className="w-full accent-stone-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">情感 (Emotion)</label>
                    <select
                      value={slot.emotion || 'natural'}
                      onChange={(e) => handleUpdateVoiceSlot(currentCompanion.id, { emotion: e.target.value })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 transition-all text-stone-900"
                    >
                      <option value="natural">Natural (自然)</option>
                      <option value="cool_empathetic">Cool (知心)</option>
                      <option value="energetic_happy">Happy (阳光)</option>
                      <option value="gentle_warm">Gentle (温润)</option>
                      <option value="playful_witty">Witty (斗嘴)</option>
                      <option value="soft_calm">Calm (沉静)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* SECTION 3: App Theme */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-3">
        <div className="flex items-center gap-2 text-stone-800 font-bold">
          <Palette size={17} className="text-stone-800" />
          <span className="text-sm font-bold">界面主题 (Theme)</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <button 
            type="button"
            onClick={() => onUpdateSettings({...settings, theme: 'default'})}
            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${settings.theme === 'default' ? 'border-stone-900 bg-stone-50 font-bold' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-800 text-xs font-bold">
              Aa
            </div>
            <span className="text-xs">极简 (Light)</span>
          </button>
          
          <button 
            type="button"
            onClick={() => onUpdateSettings({...settings, theme: 'kkt'})}
            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${settings.theme === 'kkt' ? 'border-[#FFEB3B] bg-[#FFEB3B]/10 font-bold' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFEB3B] flex items-center justify-center text-stone-900 font-bold text-[10px]">
              TALK
            </div>
            <span className="text-xs">KakaoTalk</span>
          </button>

          <button 
            type="button"
            onClick={() => onUpdateSettings({...settings, theme: 'wechat'})}
            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${settings.theme === 'wechat' ? 'border-[#07C160] bg-[#07C160]/10 font-bold' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#07C160] flex items-center justify-center text-white font-bold text-[10px]">
              微信
            </div>
            <span className="text-xs">WeChat</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: Study Goals Settings */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-3">
        <div className="flex items-center gap-2 text-stone-800 font-bold">
          <Target size={17} className="text-emerald-600" />
          <span className="text-sm font-bold">每日目标 (Daily Goal)</span>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="10"
              value={settings.dailyVocabGoal}
              onChange={(e) => onUpdateSettings({...settings, dailyVocabGoal: Number(e.target.value)})}
              className="flex-1 accent-stone-800 cursor-pointer"
            />
            <span className="font-semibold text-stone-800 text-xs shrink-0">{settings.dailyVocabGoal} 词 / 天</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Language Settings */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-3">
        <div className="flex items-center gap-2 text-stone-800 font-bold">
          <Globe size={17} className="text-slate-500" />
          <span className="text-sm font-bold">目标语言 (Language)</span>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onUpdateSettings({...settings, languageMode: 'zh'})}
            className={`flex-1 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
              settings.languageMode === 'zh'
                ? 'bg-white shadow-xs text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            简体中文
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({...settings, languageMode: 'en'})}
            className={`flex-1 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
              settings.languageMode === 'en'
                ? 'bg-white shadow-xs text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* SECTION 6: Proactive Messages Toggle */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 max-w-[80%]">
            <div className="flex items-center gap-1.5 text-stone-800 font-bold">
              <Sparkles size={16} className="text-amber-600" />
              <span className="text-sm font-bold">角色主动发信 (Proactive)</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              开启后，未在聊天界面的角色会结合真实时段和人设偶尔主动发信问候。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.proactiveMessagesEnabled !== false}
            onClick={() => onUpdateSettings({
              ...settings,
              proactiveMessagesEnabled: settings.proactiveMessagesEnabled === false ? true : false
            })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.proactiveMessagesEnabled !== false ? 'bg-stone-900' : 'bg-stone-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.proactiveMessagesEnabled !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* SECTION 7: System Reset */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-2">
        <div className="flex items-center gap-2 text-stone-800 font-bold">
          <RefreshCw size={16} className="text-rose-600" />
          <span className="text-sm font-bold">数据重置 (Reset)</span>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed">
          一键恢复所有聊天记录、生词本进度与预置角色头像至系统初始状态。
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className="text-rose-600" />
            <span>恢复系统全局默认</span>
          </button>
        </div>
      </div>

      {/* Inline Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
              <RefreshCw size={24} className="animate-spin-slow text-rose-600" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm mb-1.5">
              确认要恢复系统全局默认吗？
            </h3>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed px-1">
              该操作将**彻底删除**所有聊天历史、已设定的专属核心记忆、生词本内容、每日口语进度，并将内置角色的头像恢复为系统真实照片头像。此操作不可撤销。
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetAllData?.();
                  setResetSuccess(true);
                  setTimeout(() => setResetSuccess(false), 2200);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                确认恢复默认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast for Reset */}
      {resetSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-xs px-4 py-2.5 rounded-full shadow-xl z-[120] animate-in fade-in slide-in-from-bottom-2 pointer-events-none backdrop-blur-xs font-sans flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>系统已成功恢复至初始默认状态</span>
        </div>
      )}
    </div>
  );
};
