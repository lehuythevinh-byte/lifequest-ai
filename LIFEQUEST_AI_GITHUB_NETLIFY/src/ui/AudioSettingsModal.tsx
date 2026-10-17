import React, { useState, useEffect } from 'react';
import { speechService, SpeechSettings } from '../services/speechService';
import { Volume2, VolumeX, Play, X, Settings2 } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SpeechSettings>(speechService.settings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(speechService.getVoices());
  const [isSpeaking, setIsSpeaking] = useState(speechService.isSpeaking());

  useEffect(() => {
    return speechService.subscribe(() => {
      setSettings({ ...speechService.settings });
      setVoices(speechService.getVoices());
      setIsSpeaking(speechService.isSpeaking());
    });
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    speechService.speak(
      "Hello there! Welcome to English Town. I'm excited to practice English with you today!"
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141824] border-2 border-[#5a8ad8] rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="text-lg font-bold text-sky-300">
                Cài đặt Giọng nói NPC (Voice)
              </h2>
              <p className="text-xs text-slate-400">
                Phát âm tiếng Anh tự nhiên qua SpeechSynthesis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Toggle NPC Voice */}
          <div className="flex items-center justify-between p-3 bg-[#1a2136] rounded-xl border border-slate-700">
            <div>
              <div className="font-semibold text-slate-100 flex items-center gap-2">
                {settings.voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                Bật giọng nói NPC
              </div>
              <div className="text-xs text-slate-400">
                NPC sẽ đọc to lời thoại bằng tiếng Anh
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => speechService.setVoiceEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Toggle Auto Speak */}
          <div className="flex items-center justify-between p-3 bg-[#1a2136] rounded-xl border border-slate-700">
            <div>
              <div className="font-semibold text-slate-100">
                Tự động đọc phản hồi mới
              </div>
              <div className="text-xs text-slate-400">
                Đọc ngay khi NPC trả lời (hoặc bấm 🔊 để nghe lại)
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => speechService.setAutoSpeak(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Speed Rate Slider */}
          <div className="p-3 bg-[#1a2136] rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-slate-100">Tốc độ phát âm:</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                {settings.rate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.2"
              step="0.05"
              value={settings.rate}
              onChange={(e) => speechService.setRate(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Chậm rõ (0.7x)</span>
              <span>Chuẩn học tập (0.9x)</span>
              <span>Bình thường (1.0x)</span>
            </div>
          </div>

          {/* Voice selector */}
          {voices.length > 0 && (
            <div className="p-3 bg-[#1a2136] rounded-xl border border-slate-700">
              <label className="block font-semibold text-slate-100 mb-1.5">
                Chọn giọng đọc tiếng Anh:
              </label>
              <select
                value={settings.preferredVoice || ''}
                onChange={(e) => speechService.setPreferredVoice(e.target.value)}
                className="w-full bg-[#0d1020] text-slate-200 border border-slate-600 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-400"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Test Voice Button */}
          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={isSpeaking || !settings.voiceEnabled}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSpeaking ? 'Đang đọc thử...' : 'Nghe thử giọng mẫu'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
