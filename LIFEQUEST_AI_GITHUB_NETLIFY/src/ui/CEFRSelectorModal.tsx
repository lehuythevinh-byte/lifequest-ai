import React, { useState, useEffect } from 'react';
import { cefrService, CEFRLevel, CEFR_LEVELS } from '../services/cefrService';
import { Award, Check, Sparkles, X } from 'lucide-react';

interface CEFRSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CEFRSelectorModal: React.FC<CEFRSelectorModalProps> = ({ isOpen, onClose }) => {
  const [level, setLevel] = useState<CEFRLevel>(cefrService.getLevel());

  useEffect(() => {
    return cefrService.subscribe(() => {
      setLevel(cefrService.getLevel());
    });
  }, []);

  if (!isOpen) return null;

  const handleSelect = (selected: CEFRLevel) => {
    cefrService.setLevel(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141824] border-2 border-[#5a8ad8] rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-amber-300">
                Chọn trình độ tiếng Anh (CEFR)
              </h2>
              <p className="text-xs text-slate-400">
                NPC sẽ tự điều chỉnh tốc độ nói, độ dài câu và từ vựng phù hợp
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

        <div className="space-y-2.5">
          {(Object.keys(CEFR_LEVELS) as CEFRLevel[]).map((code) => {
            const item = CEFR_LEVELS[code];
            const isSelected = level === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleSelect(code)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-400'
                    : 'bg-[#1a2136] border-[#3b476b] hover:bg-[#232c48]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {code}
                    </span>
                    <span className="font-semibold text-slate-100 text-sm">
                      {item.vietnameseTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {isSelected ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full border border-slate-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Có thể đổi trình độ bất kỳ lúc nào
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
