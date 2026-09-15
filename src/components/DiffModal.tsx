import React from 'react';
import { GitCompare, X, Check } from 'lucide-react';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#181b25]/60 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-lg max-h-[85vh] rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#e5e8f5]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-[#f1f3ff] border-b border-[#ebedfb]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#181b25]" />
            <h4 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
              Diff 비교: v2.0 vs v3.2
            </h4>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:bg-[#ebedfb] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content Pane */}
        <div className="flex flex-col p-4 overflow-y-auto space-y-4">
          <div className="flex flex-col space-y-1.5">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76] uppercase tracking-wider font-bold">
              청구항 2 (압력센서부 한정)
            </span>
            <div className="rounded-lg bg-[#f1f3ff] p-3 space-y-2 border border-[#ebedfb]">
              <div className="p-2 rounded bg-[#ffdad6]/60 text-[#181b25] border border-[#ffdad6]">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#ba1a1a] font-bold">
                  - [이전 v2.0]
                </span>
                <p className="font-['IBM_Plex_Serif'] text-[12px] mt-1 text-[#505f76] line-through decoration-[#ba1a1a]">
                  상기 압력센서부는 피측정체의 압력 신호를 실시간 수집하는 것을 특징으로 하는 장치.
                </p>
              </div>

              <div className="p-2 rounded bg-[#d0e1fb]/60 text-[#181b25] border border-[#d0e1fb]">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#009668] font-bold">
                  + [현재 v3.2]
                </span>
                <p className="font-['IBM_Plex_Serif'] text-[12px] mt-1 text-[#181b25] leading-relaxed">
                  상기 압력센서부는 피측정체의 압력 신호를 기설정된 100Hz 샘플링 주기로 연속 계측하며, 상기 제어부의 아날로그 프론트엔드(AFE) 필터와 전기적으로 연계되는 것을 특징으로 하는 장치.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76] uppercase tracking-wider font-bold">
              발명의 설명 [0045] 뒷받침 단락
            </span>
            <div className="rounded-lg bg-[#f1f3ff] p-3 border border-[#ebedfb]">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#009668] font-bold">
                + [신규 추가 뒷받침 문장]
              </span>
              <p className="font-['IBM_Plex_Serif'] text-[12px] mt-1 text-[#181b25] leading-relaxed">
                &quot;압력센서부(120)는 압전소자 어레이를 채택하여 100Hz 주파수 대역의 진동을 디지털 전압값으로 변환함으로써 잡음을 감쇄시킨다.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 bg-[#f1f3ff] border-t border-[#ebedfb]">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            변경 사항: 1항 수정, 1개 단락 추가
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[13px] font-semibold hover:bg-[#2c303a] transition-all"
          >
            <Check className="w-4 h-4" />
            <span>확인 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
