import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Mic } from 'lucide-react';

declare global {
  interface Window {
    __townControls?: {
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
      action: boolean;
      actionRequested: boolean;
    };
  }
}

interface MobileControlsProps {
  onTalk: () => void;
  onMic: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onTalk, onMic }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.__townControls) {
      window.__townControls = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        actionRequested: false,
      };
    }

    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
      setVisible(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const setDirection = (dir: 'up' | 'down' | 'left' | 'right', isPressed: boolean) => {
    if (window.__townControls) {
      window.__townControls[dir] = isPressed;
    }
  };

  const handleActionPress = () => {
    if (window.__townControls) {
      window.__townControls.actionRequested = true;
    }
    onTalk();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 pointer-events-none z-30 flex justify-between items-end px-4 select-none">
      {/* Virtual D-Pad (Left) */}
      <div className="pointer-events-auto bg-[#141824cc] border border-[#4a5a8a] rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1.5 touch-manipulation">
        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); setDirection('up', true); }}
          onTouchEnd={(e) => { e.preventDefault(); setDirection('up', false); }}
          onMouseDown={() => setDirection('up', true)}
          onMouseUp={() => setDirection('up', false)}
          className="w-12 h-12 rounded-xl bg-[#232a46] hover:bg-[#343e68] active:bg-[#4a5892] text-amber-300 flex items-center justify-center border border-[#556] shadow transition"
          aria-label="Up"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onTouchStart={(e) => { e.preventDefault(); setDirection('left', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setDirection('left', false); }}
            onMouseDown={() => setDirection('left', true)}
            onMouseUp={() => setDirection('left', false)}
            className="w-12 h-12 rounded-xl bg-[#232a46] hover:bg-[#343e68] active:bg-[#4a5892] text-amber-300 flex items-center justify-center border border-[#556] shadow transition"
            aria-label="Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onTouchStart={(e) => { e.preventDefault(); setDirection('down', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setDirection('down', false); }}
            onMouseDown={() => setDirection('down', true)}
            onMouseUp={() => setDirection('down', false)}
            className="w-12 h-12 rounded-xl bg-[#232a46] hover:bg-[#343e68] active:bg-[#4a5892] text-amber-300 flex items-center justify-center border border-[#556] shadow transition"
            aria-label="Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <button
            type="button"
            onTouchStart={(e) => { e.preventDefault(); setDirection('right', true); }}
            onTouchEnd={(e) => { e.preventDefault(); setDirection('right', false); }}
            onMouseDown={() => setDirection('right', true)}
            onMouseUp={() => setDirection('right', false)}
            className="w-12 h-12 rounded-xl bg-[#232a46] hover:bg-[#343e68] active:bg-[#4a5892] text-amber-300 flex items-center justify-center border border-[#556] shadow transition"
            aria-label="Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Action Buttons (Right) */}
      <div className="pointer-events-auto flex flex-col gap-2.5 items-end touch-manipulation">
        <button
          type="button"
          onClick={onMic}
          className="w-13 h-13 rounded-2xl bg-[#1e3450] hover:bg-[#28466c] active:bg-[#386296] text-sky-300 flex items-center justify-center border-2 border-sky-400 shadow-xl transition"
          aria-label="Speak Microphone"
          title="Microphone (Tab)"
        >
          <Mic className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={handleActionPress}
          className="w-15 h-15 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold flex flex-col items-center justify-center border-2 border-amber-300 shadow-xl transition"
          aria-label="Action (E)"
          title="Talk / Enter Door / Bed (E)"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-[11px] font-black uppercase tracking-wider">E</span>
        </button>
      </div>
    </div>
  );
};
