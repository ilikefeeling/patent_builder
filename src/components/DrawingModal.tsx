import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedDrawing, setSelectedDrawing] = useState<'fig1' | 'fig2' | 'fig3'>('fig1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b25]/60 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-xl rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#e5e8f5]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#f1f3ff] border-b border-[#ebedfb]">
          <div>
            <h4 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
              특허 도면 뷰어 (Mermaid / SVG)
            </h4>
            <p className="font-['Public_Sans'] text-[12px] text-[#505f76]">
              특허청 심사 기준 규격 전산 도면부호 매핑 완료
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:bg-[#ebedfb] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#ebedfb] bg-[#faf9ff] px-4 pt-2 gap-2">
          {[
            { id: 'fig1' as const, label: '도 1 (시스템)' },
            { id: 'fig2' as const, label: '도 2 (블록도)' },
            { id: 'fig3' as const, label: '도 3 (순서도)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDrawing(tab.id)}
              className={`px-3 py-2 text-[13px] font-['Public_Sans'] border-b-2 font-semibold transition-all ${
                selectedDrawing === tab.id
                  ? 'border-[#181b25] text-[#181b25]'
                  : 'border-transparent text-[#505f76] hover:text-[#181b25]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Canvas Display */}
        <div className="p-6 bg-[#f1f3ff]/40 flex flex-col items-center justify-center min-h-[280px]">
          {selectedDrawing === 'fig1' && (
            <div className="w-full max-w-md bg-white p-4 rounded-xl border border-[#e5e8f5] shadow-sm">
              <svg className="w-full h-48 text-[#181b25]" viewBox="0 0 200 120" fill="none">
                <rect x="10" y="20" width="80" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="#ebedfb" />
                <text x="25" y="44" className="font-['JetBrains_Mono']" fontSize="11" fill="currentColor" fontWeight="bold">서버 [100]</text>
                
                <rect x="110" y="20" width="80" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="#ebedfb" />
                <text x="125" y="44" className="font-['JetBrains_Mono']" fontSize="11" fill="currentColor" fontWeight="bold">센서 [120]</text>
                
                <path d="M90 40 H110" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                
                <rect x="60" y="75" width="80" height="36" rx="4" stroke="currentColor" strokeWidth="2" fill="#d0e1fb" />
                <text x="72" y="98" className="font-['JetBrains_Mono']" fontSize="11" fill="#0b1c30" fontWeight="bold">모니터 [140]</text>
                <path d="M100 60 V75" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="text-center font-['IBM_Plex_Serif'] text-[13px] text-[#505f76] mt-2">
                [도 1] 본 발명에 따른 특허 청구항 실시간 검증 시스템의 전체 아키텍처
              </div>
            </div>
          )}

          {selectedDrawing === 'fig2' && (
            <div className="w-full max-w-md bg-white p-4 rounded-xl border border-[#e5e8f5] shadow-sm">
              <svg className="w-full h-48 text-[#181b25]" viewBox="0 0 200 120" fill="none">
                <rect x="15" y="10" width="170" height="28" rx="4" stroke="currentColor" strokeWidth="1.8" fill="#ebedfb" />
                <text x="55" y="29" className="font-['JetBrains_Mono']" fontSize="11" fill="currentColor" fontWeight="bold">제어부 [210]</text>
                
                <rect x="15" y="46" width="80" height="28" rx="4" stroke="currentColor" strokeWidth="1.8" fill="#f1f3ff" />
                <text x="25" y="64" className="font-['JetBrains_Mono']" fontSize="10" fill="currentColor">압력센서 [220]</text>

                <rect x="105" y="46" width="80" height="28" rx="4" stroke="currentColor" strokeWidth="1.8" fill="#f1f3ff" />
                <text x="115" y="64" className="font-['JetBrains_Mono']" fontSize="10" fill="currentColor">AI분석기 [230]</text>

                <rect x="45" y="82" width="110" height="26" rx="4" stroke="currentColor" strokeWidth="1.8" fill="#d0e1fb" />
                <text x="65" y="99" className="font-['JetBrains_Mono']" fontSize="10" fill="#0b1c30" fontWeight="bold">송수신부 [240]</text>
              </svg>
              <div className="text-center font-['IBM_Plex_Serif'] text-[13px] text-[#505f76] mt-2">
                [도 2] 세부 제어부 및 서브 모듈 간 신호 연계 블록도
              </div>
            </div>
          )}

          {selectedDrawing === 'fig3' && (
            <div className="w-full max-w-md bg-white p-4 rounded-xl border border-[#e5e8f5] shadow-sm">
              <svg className="w-full h-48 text-[#181b25]" viewBox="0 0 200 120" fill="none">
                <path d="M100 8 L150 28 L100 48 L50 28 Z" stroke="currentColor" strokeWidth="1.8" fill="#ebedfb" />
                <text x="80" y="32" className="font-['JetBrains_Mono']" fontSize="10" fill="currentColor" fontWeight="bold">S310 조건 판별</text>
                <line x1="100" y1="48" x2="100" y2="68" stroke="currentColor" strokeWidth="1.8" />
                <rect x="55" y="68" width="90" height="36" rx="4" stroke="currentColor" strokeWidth="1.8" fill="#d0e1fb" />
                <text x="68" y="90" className="font-['JetBrains_Mono']" fontSize="10" fill="#0b1c30" fontWeight="bold">S320 부호 매핑</text>
              </svg>
              <div className="text-center font-['IBM_Plex_Serif'] text-[13px] text-[#505f76] mt-2">
                [도 3] 실시간 선행사 매칭 및 도면부호 인덱싱 시퀀스 흐름도
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f1f3ff] border-t border-[#ebedfb] flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            해상도: 300 DPI · Vector SVG
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onShowToast('도면 SVG 파일이 클립보드에 복사되었습니다.', 'success')}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#e5e8f5] text-[#181b25] font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#ebedfb]"
            >
              SVG 복사
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a]"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
