import React, { useState } from 'react';
import { Settings, Palette, Target, Globe, Mic, Volume2, Key, Sliders, CheckCircle2, Play, User } from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { PRESET_COMPANIONS } from '../data/companions';
import { speakKorean, stopSpeaking } from '../utils/audio';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  userProfile: UserProfile;
  onUpdateUserProfile?: (profile: UserProfile) => void;
}

export const SettingsView: React.FC<Props> = ({ settings, onUpdateSettings, userProfile, onUpdateUserProfile }) => {
  const [activeVoiceTab, setActiveVoiceTab] = useState<string>('sunwoo');
  const [testingAudio, setTestingAudio] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const mmConfig = settings.minimax_config || {
    group_id: '',
    api_key: '',
    model: 'speech-01-turbo',
    voice_slots: {}
  };

  const handleUpdateMinimaxConfig = (newPartial: Partial<typeof mmConfig>) => {
    const updated = {
      ...mmConfig,
      ...newPartial
    };
    onUpdateSettings({
      ...settings,
      minimax_config: updated
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleUpdateVoiceSlot = (characterId: string, slotPartial: any) => {
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

    handleUpdateMinimaxConfig({ voice_slots: updatedSlots });
  };

  const testIdolVoice = (charId: string) => {
    const comp = PRESET_COMPANIONS.find(c => c.id === charId) || PRESET_COMPANIONS[0];
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-36 space-y-8 animate-in fade-in duration-300 h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Settings className="text-stone-800" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Settings & Voice Engine</h1>
            <p className="text-xs text-stone-500">Korean Buddy 系统设置与 MiniMax 声音克隆控制台</p>
          </div>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
            <CheckCircle2 size={14} />
            <span>Saved Config</span>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-[#FFEB3B] flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden shrink-0 border border-stone-800">
            {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : userProfile.avatar}
          </div>
          <div>
            <div className="font-bold text-lg text-stone-800 flex items-center gap-2">
              <span>{userProfile.name}</span>
              <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md font-normal">Learner</span>
            </div>
            <div className="text-sm text-stone-500">{userProfile.status}</div>
          </div>
        </div>
      </div>

      {/* MiniMax Voice Cloning Engine Configuration (SECTION 4) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/70 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5 text-stone-800 font-bold">
            <Mic size={20} className="text-indigo-600" />
            <div className="flex flex-col">
              <span className="text-base">MiniMax Voice Clone Pipeline</span>
              <span className="text-xs font-normal text-stone-500">7位专属爱豆声音克隆与音色控制台</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            T2A Engine
          </span>
        </div>

        {/* API Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Key size={13} />
              MiniMax Group ID
            </label>
            <input
              type="text"
              placeholder="e.g. 1823901..."
              value={mmConfig.group_id || ''}
              onChange={(e) => handleUpdateMinimaxConfig({ group_id: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Key size={13} />
              MiniMax API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOi..."
              value={mmConfig.api_key || ''}
              onChange={(e) => handleUpdateMinimaxConfig({ api_key: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Sliders size={13} />
              Model Selection
            </label>
            <select
              value={mmConfig.model || 'speech-01-turbo'}
              onChange={(e) => handleUpdateMinimaxConfig({ model: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
            7 Idol Voice Slot Mapping (爱豆音色通道配置)
          </div>

          {/* Idol Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {PRESET_COMPANIONS.map((idol) => {
              const isActive = activeVoiceTab === idol.id;
              return (
                <button
                  key={idol.id}
                  onClick={() => setActiveVoiceTab(idol.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isActive
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-base">{idol.avatar}</span>
                  <span>{idol.name_zh}</span>
                  <span className="text-[10px] opacity-75 font-normal">({idol.badge})</span>
                </button>
              );
            })}
          </div>

          {/* Active Idol Slot Tuning Box */}
          {(() => {
            const currentIdol = PRESET_COMPANIONS.find(c => c.id === activeVoiceTab) || PRESET_COMPANIONS[0];
            const slot = mmConfig.voice_slots?.[currentIdol.id] || {
              voice_id: currentIdol.voice_slot || `voice_${currentIdol.id}_001`,
              speed: currentIdol.tts_rate || 1.0,
              pitch: 0,
              emotion: 'natural'
            };

            return (
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentIdol.avatar}</span>
                    <div>
                      <div className="text-sm font-bold text-stone-800">
                        {currentIdol.name_ko} · {currentIdol.name_zh} ({currentIdol.badge})
                      </div>
                      <div className="text-xs text-stone-500">{currentIdol.voice_desc}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => testIdolVoice(currentIdol.id)}
                    disabled={testingAudio}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                  >
                    <Play size={13} className={testingAudio ? "animate-spin" : ""} />
                    <span>{testingAudio ? 'Synthesizing...' : 'Test Voice Voice (试听音色)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Cloned Voice ID</label>
                    <input
                      type="text"
                      value={slot.voice_id}
                      onChange={(e) => handleUpdateVoiceSlot(currentIdol.id, { voice_id: e.target.value })}
                      placeholder="voice_id_xxx"
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Speed: {slot.speed || 1.0}x</label>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={slot.speed || 1.0}
                      onChange={(e) => handleUpdateVoiceSlot(currentIdol.id, { speed: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600"
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
                      onChange={(e) => handleUpdateVoiceSlot(currentIdol.id, { pitch: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Emotion Preset</label>
                    <select
                      value={slot.emotion || 'natural'}
                      onChange={(e) => handleUpdateVoiceSlot(currentIdol.id, { emotion: e.target.value })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-white"
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

      {/* Theme Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/70 space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-bold mb-2">
          <Palette size={20} className="text-stone-800" />
          <span>App Theme</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => onUpdateSettings({...settings, theme: 'default'})}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.theme === 'default' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-800 font-bold">
              Aa
            </div>
            <span className="font-bold text-xs">Light & Clean</span>
          </button>
          
          <button 
            onClick={() => onUpdateSettings({...settings, theme: 'kkt'})}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.theme === 'kkt' ? 'border-[#FFEB3B] bg-[#FFEB3B]/10' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#FFEB3B] flex items-center justify-center text-stone-900 font-bold text-xs">
              TALK
            </div>
            <span className="font-bold text-xs">KakaoTalk</span>
          </button>

          <button 
            onClick={() => onUpdateSettings({...settings, theme: 'wechat'})}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.theme === 'wechat' ? 'border-[#07C160] bg-[#07C160]/10' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#07C160] flex items-center justify-center text-white font-bold text-xs">
              微信
            </div>
            <span className="font-bold text-xs">WeChat</span>
          </button>
        </div>
      </div>

      {/* Study Goals Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/70 space-y-4">
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
              className="flex-1 accent-stone-800"
            />
            <span className="font-bold text-stone-800 w-16 text-right text-sm">{settings.dailyVocabGoal} words/day</span>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/70 space-y-4">
        <div className="flex items-center gap-2 text-stone-800 font-bold mb-2">
          <Globe size={20} className="text-blue-600" />
          <span>Bilingual Translation Mode</span>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => onUpdateSettings({...settings, languageMode: 'bilingual'})}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${settings.languageMode === 'bilingual' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Bilingual (韩文+中文)
          </button>
          <button
            onClick={() => onUpdateSettings({...settings, languageMode: 'zh'})}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${settings.languageMode === 'zh' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Simplified Chinese
          </button>
          <button
            onClick={() => onUpdateSettings({...settings, languageMode: 'en'})}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${settings.languageMode === 'en' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
};
