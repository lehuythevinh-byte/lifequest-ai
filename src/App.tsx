<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import type { ActiveTab } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeModule } from './components/HomeModule';
import { ScannerModule } from './components/ScannerModule';
import { EvidenceLabModule } from './components/EvidenceLabModule';
import { AcademyModule } from './components/AcademyModule';
import { SimulatorModule } from './components/SimulatorModule';
import { SafeBotModule } from './components/SafeBotModule';
import { ResearchDashboardModule } from './components/ResearchDashboardModule';
import { ResearchReportModule } from './components/ResearchReportModule';
import { EmergencyModule } from './components/EmergencyModule';
import { AccountModule } from './components/AccountModule';
import { AdminModule } from './components/AdminModule';
import type { AppUser } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    // Check URL hash for direct deep linking
    const hash = window.location.hash.replace('#', '') as ActiveTab;
    const validTabs: ActiveTab[] = [
      'home',
      'scanner',
      'evidence-lab',
      'academy',
      'simulator',
      'safebot',
      'research',
      'report',
      'emergency',
      'account',
      'admin',
    ];
    return validTabs.includes(hash) ? hash : 'home';
  });

  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authAvailable, setAuthAvailable] = useState(true);

  // Check backend health and AI configuration status on startup
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setAiConfigured(Boolean(data.aiConfigured));
        } else {
          setAiConfigured(false);
        }
      } catch (e) {
        console.warn('Backend health check error, falling back to manual mode:', e);
        setAiConfigured(false);
      }
    };

    checkBackendStatus();
  }, []);

  // Restore the current account session on page load.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
        const data = await response.json();
        setCurrentUser(data.authenticated && data.user ? data.user as AppUser : null);
        setAuthAvailable(Boolean(data.authAvailable));
      } catch {
        setCurrentUser(null);
        setAuthAvailable(false);
      }
    };
    void checkSession();
  }, []);

  const handleAuthChange = (user: AppUser | null, available = true) => {
    setCurrentUser(user);
    setAuthAvailable(available);
  };

  // Sync tab changes with URL hash
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActiveTab;
      const validTabs: ActiveTab[] = [
        'home',
        'scanner',
        'evidence-lab',
        'academy',
        'simulator',
        'safebot',
        'research',
        'report',
        'emergency',
        'account',
        'admin',
      ];
      if (validTabs.includes(hash) && hash !== activeTab) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#101C32] text-[#F5F7FA]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        aiConfigured={aiConfigured}
        user={currentUser}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeModule onTabChange={handleTabChange} aiConfigured={aiConfigured} />
        )}
        {activeTab === 'scanner' && (
          <ScannerModule onTabChange={handleTabChange} aiConfigured={aiConfigured} />
        )}
        {activeTab === 'evidence-lab' && (
          <EvidenceLabModule onTabChange={handleTabChange} />
        )}
        {activeTab === 'academy' && (
          <AcademyModule onTabChange={handleTabChange} />
        )}
        {activeTab === 'simulator' && (
          <SimulatorModule onTabChange={handleTabChange} />
        )}
        {activeTab === 'safebot' && (
          <SafeBotModule onTabChange={handleTabChange} aiConfigured={aiConfigured} />
        )}
        {activeTab === 'research' && (
          <ResearchDashboardModule onTabChange={handleTabChange} />
        )}
        {activeTab === 'report' && (
          <ResearchReportModule onTabChange={handleTabChange} />
        )}
        {activeTab === 'emergency' && (
          <EmergencyModule onTabChange={handleTabChange} />
        )}
        {activeTab === 'account' && (
          <AccountModule user={currentUser} authAvailable={authAvailable} onAuthChange={handleAuthChange} onTabChange={handleTabChange} />
        )}
        {activeTab === 'admin' && (
          <AdminModule user={currentUser} />
        )}
      </main>

      {/* Unified Global Footer */}
      <Footer onTabChange={handleTabChange} />
    </div>
=======
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { startGame, stopGame } from './game_engine.js';
import { speechService } from './services/speechService';
import { cefrService, CEFRLevel } from './services/cefrService';
import { CEFRSelectorModal } from './ui/CEFRSelectorModal';
import { AudioSettingsModal } from './ui/AudioSettingsModal';
import { MobileControls } from './ui/MobileControls';
import { 
  BookOpen, 
  HelpCircle, 
  Scroll, 
  Settings as SettingsIcon, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Compass, 
  Award,
  Smartphone,
  CheckCircle2, 
  X 
} from 'lucide-react';

export default function App() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [cefrOpen, setCefrOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [serverAiOk, setServerAiOk] = useState<boolean | null>(null);
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(cefrService.getLevel());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(speechService.settings.voiceEnabled);

  useEffect(() => {
    // Check server AI connectivity
    fetch('/api/gemini')
      .then(res => res.json())
      .then(data => {
        setServerAiOk(data.ok && data.hasKey);
      })
      .catch(() => setServerAiOk(false));

    // Detect mobile touch
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 840;
    setShowMobileControls(isMobile);

    // Subscribe to services
    const unsubCefr = cefrService.subscribe(() => {
      setCurrentLevel(cefrService.getLevel());
    });

    const unsubSpeech = speechService.subscribe(() => {
      setVoiceEnabled(speechService.settings.voiceEnabled);
    });

    // Start Phaser game scene
    try {
      startGame();
    } catch (err) {
      console.error('Failed to start English Town game:', err);
    }

    return () => {
      unsubCefr();
      unsubSpeech();
      try {
        stopGame();
      } catch (e) {}
    };
  }, []);

  const triggerMenuAction = (act: string) => {
    const btn = document.querySelector<HTMLButtonElement>(`#group-menu button[data-act="${act}"]`);
    if (btn) {
      btn.click();
    } else {
      const keyMap: Record<string, string> = {
        talk: 'KeyE',
        quests: 'KeyQ',
        journal: 'KeyJ',
        helper: 'KeyH',
        settings: 'KeyK'
      };
      if (keyMap[act]) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: keyMap[act], key: act[0] }));
      }
    }
  };

  const handleMobileTalk = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true }));
  };

  const handleMobileMic = () => {
    const micBtn = document.querySelector<HTMLButtonElement>('#chat #mic');
    if (micBtn) {
      micBtn.click();
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true }));
    }
  };

  return (
    <>
      {/* Top Floating Control Bar */}
      <header className="fixed top-2 left-2 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        {/* Brand & Connection Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141824f2] border border-[#5a6a9a] rounded-lg shadow-lg backdrop-blur-sm">
          <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/40">
            LQ
          </div>
          <div>
            <div className="text-xs font-bold tracking-wide text-amber-300 flex items-center gap-1.5">
              <span>English Town</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950/80 text-indigo-300 rounded border border-indigo-700/50">
                AI RPG
              </span>
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${serverAiOk ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{serverAiOk ? 'Gemini 3.8 AI' : 'AI Hybrid'}</span>
            </div>
          </div>
        </div>

        {/* CEFR Level Selector Pill */}
        <button
          type="button"
          onClick={() => setCefrOpen(true)}
          title="Chọn trình độ tiếng Anh (CEFR)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e2746eb] hover:bg-[#28345e] border border-indigo-500/50 rounded-lg shadow-md backdrop-blur-sm text-xs font-medium text-amber-300 transition"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Level: <strong>{currentLevel}</strong></span>
        </button>

        {/* Voice Audio Settings Pill */}
        <button
          type="button"
          onClick={() => setAudioOpen(true)}
          title="Cài đặt giọng nói NPC (SpeechSynthesis)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg shadow-md backdrop-blur-sm text-xs font-medium transition ${
            voiceEnabled 
              ? 'bg-[#163046eb] hover:bg-[#1e415e] border-sky-500/50 text-sky-200' 
              : 'bg-[#262632eb] border-slate-600 text-slate-400'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          <span className="hidden sm:inline">Giọng đọc</span>
        </button>

        {/* Desktop Quick Toolbar */}
        <div className="hidden md:flex items-center gap-1 bg-[#141824d9] border border-[#3b476b] rounded-lg p-1 shadow-md backdrop-blur-sm">
          <button 
            type="button"
            onClick={() => triggerMenuAction('quests')}
            title="Quests (Q)"
            className="flex items-center gap-1 px-2 py-1 text-xs text-amber-200 hover:bg-slate-800/80 rounded transition"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhiệm vụ (Q)</span>
          </button>
          <button 
            type="button"
            onClick={() => triggerMenuAction('journal')}
            title="Learning Journal (J)"
            className="flex items-center gap-1 px-2 py-1 text-xs text-purple-200 hover:bg-slate-800/80 rounded transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Nhật ký (J)</span>
          </button>
          <button 
            type="button"
            onClick={() => triggerMenuAction('helper')}
            title="Word Helper (H)"
            className="flex items-center gap-1 px-2 py-1 text-xs text-sky-200 hover:bg-slate-800/80 rounded transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Tra từ (H)</span>
          </button>
          <button 
            type="button"
            onClick={() => triggerMenuAction('settings')}
            title="AI Settings (K)"
            className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-200 hover:bg-slate-800/80 rounded transition"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cài đặt (K)</span>
          </button>
          <button 
            type="button"
            onClick={() => setGuideOpen(true)}
            title="Hướng dẫn chơi & học tiếng Anh"
            className="flex items-center gap-1 px-2 py-1 text-xs text-yellow-300 hover:bg-slate-800/80 rounded transition border-l border-slate-700 ml-0.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-medium">Hướng dẫn</span>
          </button>
        </div>

        {/* Mobile D-Pad Toggle */}
        <button
          type="button"
          onClick={() => setShowMobileControls(!showMobileControls)}
          title="Bật/Tắt phím ảo cảm ứng"
          className="flex sm:hidden items-center justify-center p-1.5 bg-[#141824f2] border border-[#5a6a9a] rounded-lg text-slate-300 hover:text-white"
        >
          <Smartphone className="w-4 h-4 text-amber-300" />
        </button>
      </header>

      {/* Virtual Touch Controls for Mobile/Tablet */}
      {showMobileControls && (
        <MobileControls onTalk={handleMobileTalk} onMic={handleMobileMic} />
      )}

      {/* CEFR Level Selector Modal */}
      <CEFRSelectorModal isOpen={cefrOpen} onClose={() => setCefrOpen(false)} />

      {/* Audio & Voice Settings Modal */}
      <AudioSettingsModal isOpen={audioOpen} onClose={() => setAudioOpen(false)} />

      {/* Guide Modal (Tiếng Việt) */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141824] border-2 border-[#5a8ad8] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-amber-300">
                  Hướng Dẫn Toàn Diện LifeQuest AI — English Town
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setGuideOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-lg p-3.5">
                <h3 className="font-semibold text-sky-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Mục tiêu của Game
                </h3>
                <p className="text-slate-300">
                  Bạn nhập vai người dân mới đến <strong>English Town</strong> (Thị trấn tiếng Anh) và <strong>Minerals Town</strong> (Thị trấn hầm mỏ). Qua các đoạn hội thoại thực tế với cư dân, bạn sẽ luyện phản xạ giao tiếp tiếng Anh, luyện nghe phát âm qua giọng đọc NPC, sửa lỗi ngữ pháp tức thì và hoàn thành các nhiệm vụ thú vị!
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-amber-300 mb-2">🎮 Phím điều khiển</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-400 border border-slate-700">W A S D</span>
                    <span>Di chuyển nhân vật trong thị trấn</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-400 border border-slate-700">W / Lên</span>
                    <span>Bước vào trong nhà / cửa hàng khi đứng trước cửa</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-400 border border-slate-700">E</span>
                    <span>Nói chuyện với NPC hoặc ngủ khi đứng cạnh giường sau 19h</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-400 border border-slate-700">Tab / 🎤</span>
                    <span>Bật micro nói tiếng Anh trực tiếp</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-400 border border-slate-700">🔊 Icon</span>
                    <span>Bấm nút loa bên cạnh lời NPC để nghe lại phát âm</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-400 border border-slate-700">?từ</span>
                    <span>Gõ ?từ trong khung chat để tra nghĩa tức thì (vd: ?recommend)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-300 mb-2">⭐ Tính năng học tiếng Anh mới nâng cấp</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <strong>Giọng đọc NPC (Text-to-Speech):</strong> Mỗi câu trả lời của NPC được đọc to rõ ràng bằng giọng tiếng Anh bản xứ. Bạn có thể bấm nút 🔊 để nghe lại từng câu, hoặc chỉnh tốc độ phát âm (0.7x đến 1.2x) trong mục Giọng đọc.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <strong>Thích ứng theo trình độ (CEFR A1 đến C1):</strong> Bạn có thể bấm vào huy hiệu Level trên thanh công cụ để chọn mức độ học. NPC sẽ tự điều chỉnh độ dài câu, từ vựng và câu hỏi thử thách phù hợp.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <strong>Gợi ý cách diễn đạt tự nhiên (Native Alternative):</strong> Khi bạn nói một câu có phần gượng gạo, hệ thống sẽ gợi ý dòng <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">💡 Native way: ...</code> giúp bạn học cách người bản xứ hay nói.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <strong>Điều khiển cảm ứng di động:</strong> Hỗ trợ cụm phím D-Pad và nút tương tác E/Mic ngay trên màn hình điện thoại hoặc máy tính bảng.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shadow transition"
                >
                  Bắt đầu trải nghiệm!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
>>>>>>> 742ed336759c7e8e3d93fa5cf05858a7a92fd3da
  );
}
