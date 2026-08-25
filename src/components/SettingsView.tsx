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
      // 1. Try server proxy first to avoid browser CORS issues (especially for DeepSeek/OpenAI)
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
          showSuccessToast('✅ 大模型连接成功', successMsg);
          return;
        }
        // If server proxy returned error, we do not abort immediately; continue to client direct test
      }

      // 2. Client direct test (handles regional network routing & direct CORS enabled endpoints)
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
      placeholderKey: 'AQ... 或 AIzaSy... (从 aistudio.google.com 创建)',
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
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 font-sans">
              设置与接口 (Settings & API)
            </h1>
            <p className="text-xs text-stone-500">API 接口配置、MiniMax 声音克隆与偏好设置</p>
          </div>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>已保存</span>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      <div 
        onClick={() => setIsProfileModalOpen(true)}
        className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 flex items-center justify-between gap-3 hover:border-stone-400 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-medium text-lg shadow-xs overflow-hidden shrink-0 border border-stone-200">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span>{(userProfile.userName || userProfile.name || 'ME').slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base text-stone-900 flex items-center gap-1.5 flex-wrap">
              <span className="truncate">{userProfile.userName || userProfile.name}</span>
              {userProfile.userCallSign && (
                <span className="text-[11px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-normal shrink-0">
                  专属称呼: {userProfile.userCallSign}
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
          className="px-3.5 py-1.5 bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <User size={13} />
          <span>编辑资料</span>
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
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5 text-stone-900 font-bold">
            <Server size={20} className="text-stone-900" />
            <div className="flex flex-col">
              <span className="text-base font-bold">LLM API Configuration (大模型接口配置)</span>
              <span className="text-xs font-normal text-stone-500">支持 Gemini / Claude / OpenAI / DeepSeek / 自定义中转接口</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-800 rounded-full border border-stone-200">
            Real LLM Request
          </span>
        </div>

        <div className="space-y-5">
          {/* Provider Select */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              LLM Provider (模型服务商)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini' },
                { id: 'anthropic', label: 'Claude (Anthropic)' },
                { id: 'deepseek', label: 'DeepSeek' },
                { id: 'openai', label: 'OpenAI' },
                { id: 'custom', label: 'Custom (中转)' },
              ].map((p) => {
                const isSelected = llmConfig.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Key size={13} className="text-stone-500" />
                <span>API Key</span>
                <span className="text-[10px] text-stone-400 font-normal">（可输入或粘贴）</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLlmKey(!showLlmKey)}
                  className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 transition cursor-pointer"
                  title={showLlmKey ? "隐藏密文" : "显示明文"}
                >
                  {showLlmKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showLlmKey ? '隐藏' : '显示'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateLLMField('apiKey', val))}
                  className="text-[11px] text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer font-medium"
                >
                  <Clipboard size={12} />
                  <span>剪贴板粘贴</span>
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
                  // Allow standard browser paste
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) {
                    handleUpdateLLMField('apiKey', pasted.trim());
                  }
                }}
                className="w-full text-xs font-mono px-3.5 py-2.5 pr-8 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all text-stone-900"
              />
              {Boolean(llmConfig.apiKey) && (
                <button
                  type="button"
                  onClick={() => handleUpdateLLMField('apiKey', '')}
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  title="清空"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {llmConfig.provider === 'gemini' && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>前往 Google AI Studio 获取 Gemini API Key</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                {!llmConfig.apiKey && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <span>留空时若服务端配置了环境变量将使用服务端的默认 Key</span>
                  </p>
                )}
                {Boolean(llmConfig.apiKey) && (llmConfig.apiKey.startsWith('AQ.') || llmConfig.apiKey.startsWith('AIzaSy')) && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>
                      已识别为 Google AI Studio 密钥（{llmConfig.apiKey.startsWith('AQ.') ? '新版 Auth Key: AQ...' : '标准 Key: AIzaSy...'}），支持所有对话与语言评测。
                    </span>
                  </div>
                )}
                {Boolean(llmConfig.apiKey) && llmConfig.apiKey.startsWith('ya29.') && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <span>识别为 Google Cloud OAuth2 临时令牌 (ya29.)：</span>
                    </p>
                    <p className="text-[10.5px] leading-relaxed text-amber-700">
                      系统已启用 Bearer 认证模式。此类令牌通常为临时凭据（约 1 小时过期）。建议直接使用 Google AI Studio 创建的标准 API Key。
                    </p>
                  </div>
                )}
                {Boolean(llmConfig.apiKey) && llmConfig.apiKey.startsWith('sk-') && (
                  <div className="text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-black/[0.06] space-y-1.5">
                    <p className="font-semibold flex items-center gap-1">
                      <span>检测到您的 Key 为 "sk-" 格式（属于 OpenAI / DeepSeek / 中转服务商）：</span>
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSelectProvider('deepseek')}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-[10px] cursor-pointer transition"
                      >
                        切换为 DeepSeek
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectProvider('openai')}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-[10px] cursor-pointer transition"
                      >
                        切换为 OpenAI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectProvider('custom')}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-[10px] cursor-pointer transition"
                      >
                        切换为 Custom (中转)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Base URL & Model Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Globe size={13} className="text-stone-500" />
                  <span>Base URL / Endpoint (可选)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateLLMField('baseURL', val))}
                  className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Clipboard size={11} />
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
                      ? '官方端点（默认留空即可）' 
                      : (providerPresets[llmConfig.provider]?.defaultBaseURL || 'https://api.openai.com/v1')
                  }
                  value={llmConfig.baseURL || ''}
                  onChange={(e) => handleUpdateLLMField('baseURL', e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) handleUpdateLLMField('baseURL', pasted.trim());
                  }}
                  className="w-full text-xs font-mono px-3.5 py-2.5 pr-8 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all text-stone-900"
                />
                {Boolean(llmConfig.baseURL) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLLMField('baseURL', '')}
                    className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                    title="清空"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Sliders size={13} className="text-stone-500" />
                  <span>Model Name (模型标识)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField((val) => handleUpdateLLMField('model', val))}
                  className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Clipboard size={11} />
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
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) handleUpdateLLMField('model', pasted.trim());
                  }}
                  className="w-full text-xs font-mono px-3.5 py-2.5 pr-8 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all text-stone-900"
                />
                {Boolean(llmConfig.model) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLLMField('model', '')}
                    className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                    title="清空"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Model Chips */}
          {providerPresets[llmConfig.provider]?.popularModels && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-stone-400 font-semibold uppercase">推荐模型:</span>
              {providerPresets[llmConfig.provider].popularModels.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleUpdateLLMField('model', m)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer font-mono ${
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
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleTestLLM}
              disabled={isTestingLLM}
              className="flex items-center justify-center gap-2 py-2.5 px-5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Zap size={14} className={isTestingLLM ? 'animate-spin text-amber-300' : 'text-amber-400'} />
              <span>{isTestingLLM ? '正在连接测试...' : 'Test Connection (测试连接)'}</span>
            </button>

            {llmTestStatus && (
              <div
                className={`flex-1 p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                  llmTestStatus.ok
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {llmTestStatus.ok ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />}
                  <span className="font-medium leading-relaxed">{llmTestStatus.message}</span>
                </div>
                {!llmTestStatus.ok && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {Boolean(llmConfig.apiKey) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateLLMField('apiKey', '');
                          setLlmTestStatus(null);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-300 font-semibold text-[11px] cursor-pointer transition shadow-2xs"
                      >
                        清空 Key (使用预置环境)
                      </button>
                    )}
                    {llmConfig.provider === 'gemini' && (
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] cursor-pointer transition shadow-2xs inline-flex items-center gap-1"
                      >
                        <span>获取新 Key</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: MiniMax Voice Cloning Engine */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5 text-stone-900 font-bold">
            <Mic size={20} className="text-stone-900" />
            <div className="flex flex-col">
              <span className="text-base font-bold">MiniMax Voice Clone Pipeline</span>
              <span className="text-xs font-normal text-stone-500">7位专属爱豆声音克隆与音色控制台</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-800 rounded-full border border-stone-200">
            T2A Engine
          </span>
        </div>

        {/* API Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Key size={13} className="text-stone-500" />
                <span>MiniMax Group ID</span>
              </label>
              <button
                type="button"
                onClick={() => handlePasteToField((val) => handleUpdateMinimaxField('group_id', val))}
                className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
              >
                <Clipboard size={11} />
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
                placeholder="e.g. 1823901..."
                value={mmConfig.group_id || ''}
                onChange={(e) => handleUpdateMinimaxField('group_id', e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) handleUpdateMinimaxField('group_id', pasted.trim());
                }}
                className="w-full text-xs font-mono px-3.5 py-2.5 pr-8 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all text-stone-900"
              />
              {Boolean(mmConfig.group_id) && (
                <button
                  type="button"
                  onClick={() => handleUpdateMinimaxField('group_id', '')}
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  title="清空"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Key size={13} className="text-stone-500" />
                <span>MiniMax API Key</span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Clipboard size={11} />
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
                placeholder="eyJhbGciOi..."
                value={mmConfig.api_key || ''}
                onChange={(e) => handleUpdateMinimaxField('api_key', e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (pasted) handleUpdateMinimaxField('api_key', pasted.trim());
                }}
                className="w-full text-xs font-mono px-3.5 py-2.5 pr-8 rounded-xl border border-stone-300 bg-stone-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all text-stone-900"
              />
              {Boolean(mmConfig.api_key) && (
                <button
                  type="button"
                  onClick={() => handleUpdateMinimaxField('api_key', '')}
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  title="清空"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Sliders size={13} className="text-stone-500" />
              <span>Model Selection</span>
            </label>
            <select
              value={mmConfig.model || 'speech-01-turbo'}
              onChange={(e) => handleUpdateMinimaxField('model', e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all text-stone-900"
            >
              <option value="speech-01-turbo">speech-01-turbo (Recommended)</option>
              <option value="speech-01-hd">speech-01-hd (High Definition)</option>
              <option value="speech-01">speech-01 (Standard)</option>
            </select>
          </div>
        </div>

        {/* Idol Voice Slots Manager */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            爱豆与自定义好友音色通道配置 (Voice Slot Mapping)
          </div>

          {/* Idol Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {companions.map((comp) => {
              const isActive = activeVoiceTab === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setActiveVoiceTab(comp.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CompanionAvatar
                    companion={comp}
                    sizeClassName="w-6 h-6"
                  />
                  <span>{comp.name_ko || comp.name_kr}</span>
                  <span className="text-[10px] opacity-75 font-normal">({comp.badge || 'BUDDY'})</span>
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
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <CompanionAvatar
                      companion={currentCompanion}
                      sizeClassName="w-14 h-14"
                    />
                    <div>
                      <div className="text-sm font-bold text-stone-800">
                        {currentCompanion.name_ko || currentCompanion.name_kr} ({currentCompanion.badge || 'BUDDY'})
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">{currentCompanion.voice_desc || 'MiniMax Voice Clone'}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => testIdolVoice(currentCompanion.id)}
                    disabled={testingAudio}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={13} className={testingAudio ? "animate-spin text-amber-300" : ""} />
                    <span>{testingAudio ? '正在合成中...' : '试听音色 (Test Voice)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-600">克隆声音 ID (Voice ID)</label>
                      <button
                        type="button"
                        onClick={() => handlePasteToField((val) => handleUpdateVoiceSlot(currentCompanion.id, { voice_id: val }))}
                        className="text-[9px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Clipboard size={10} />
                        <span>粘贴</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id={`voice-slot-id-${currentCompanion.id}`}
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={slot.voice_id}
                        onChange={(e) => handleUpdateVoiceSlot(currentCompanion.id, { voice_id: e.target.value })}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          if (pasted) handleUpdateVoiceSlot(currentCompanion.id, { voice_id: pasted.trim() });
                        }}
                        placeholder="voice_id_xxx"
                        className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition-all text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">语速: {slot.speed || 1.0}x</label>
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
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Pitch Tone: {slot.pitch || 0}</label>
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
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Emotion Preset</label>
                    <select
                      value={slot.emotion || 'natural'}
                      onChange={(e) => handleUpdateVoiceSlot(currentCompanion.id, { emotion: e.target.value })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition-all text-stone-900"
                    >
                      <option value="natural">Natural (自然)</option>
                      <option value="cool_empathetic">Cool & Empathetic (松弛知心)</option>
                      <option value="energetic_happy">Energetic & Happy (阳光元气)</option>
                      <option value="gentle_warm">Gentle & Warm (软萌温润)</option>
                      <option value="playful_witty">Playful & Witty (傲娇斗嘴)</option>
                      <option value="soft_calm">Soft & Calm (清爽沉静)</option>
                      <option value="cheerful_cute">Cheerful & Cute (元气爱笑)</option>
                      <option value="sporty_confident">Sporty & Confident (运动直率)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* SECTION 3: App Theme & Study Preferences */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-bold mb-2">
          <Palette size={20} className="text-stone-800" />
          <span>App Theme</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <button 
            type="button"
            onClick={() => onUpdateSettings({...settings, theme: 'default'})}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${settings.theme === 'default' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-800 font-bold">
              Aa
            </div>
            <span className="font-bold text-xs">Light & Clean</span>
          </button>
          
          <button 
            type="button"
            onClick={() => onUpdateSettings({...settings, theme: 'kkt'})}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${settings.theme === 'kkt' ? 'border-[#FFEB3B] bg-[#FFEB3B]/10' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#FFEB3B] flex items-center justify-center text-stone-900 font-bold text-xs">
              TALK
            </div>
            <span className="font-bold text-xs">KakaoTalk</span>
          </button>

          <button 
            type="button"
            onClick={() => onUpdateSettings({...settings, theme: 'wechat'})}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${settings.theme === 'wechat' ? 'border-[#07C160] bg-[#07C160]/10' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#07C160] flex items-center justify-center text-white font-bold text-xs">
              微信
            </div>
            <span className="font-bold text-xs">WeChat</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: Study Goals Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-bold mb-2">
          <Target size={20} className="text-emerald-600" />
          <span>Daily Recall & Study Goals</span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-2">Daily Target Words</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="10"
              value={settings.dailyVocabGoal}
              onChange={(e) => onUpdateSettings({...settings, dailyVocabGoal: Number(e.target.value)})}
              className="flex-1 accent-stone-800 cursor-pointer"
            />
            <span className="font-bold text-stone-800 w-16 text-right text-sm">{settings.dailyVocabGoal} words/day</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Language Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-semibold mb-1">
          <Globe size={20} className="text-slate-500" />
          <span className="text-sm">Translation Target Language (翻译目标语言)</span>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onUpdateSettings({...settings, languageMode: 'zh'})}
            className={`flex-1 py-2 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
              settings.languageMode === 'zh'
                ? 'bg-white shadow-sm text-neutral-900 font-medium'
                : 'text-neutral-400 hover:text-neutral-600 font-normal'
            }`}
          >
            简体中文 (Simplified Chinese)
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({...settings, languageMode: 'en'})}
            className={`flex-1 py-2 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
              settings.languageMode === 'en'
                ? 'bg-white shadow-sm text-neutral-900 font-medium'
                : 'text-neutral-400 hover:text-neutral-600 font-normal'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* SECTION 6: Proactive Messages Toggle */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 max-w-[80%]">
            <div className="flex items-center gap-2 text-stone-800 font-bold">
              <Sparkles size={18} className="text-amber-600" />
              <span className="text-sm font-bold">接收角色日常主动消息 (Enable Proactive Messages)</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              开启后，未在聊天窗口的角色会结合真实时间与专属人设，偶尔发送日常问候（可随时关闭）。
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

      {/* SECTION 7: System Maintenance & Global Reset */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-bold mb-1">
          <RefreshCw size={18} className="text-rose-600" />
          <span>System Reset & Maintenance</span>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed">
          想要重新开始吗？您可以一键恢复默认设置。全局恢复默认将清空所有聊天记录、核心记忆，并将所有系统内置好友重置为初始状态与精美的常量爱豆头像。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
          >
            <RefreshCw size={13} className="text-rose-600" />
            <span>恢复系统全局默认 (Global Restore Defaults)</span>
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
