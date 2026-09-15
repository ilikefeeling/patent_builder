import React, { useState } from 'react';
import { X, Handshake, ShieldCheck, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { PatentProject } from '../types';

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PatentProject;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const ConsultModal: React.FC<ConsultModalProps> = ({
  isOpen,
  onClose,
  project,
  onShowToast,
}) => {
  const [selectedFirm, setSelectedFirm] = useState('특허법인 케이앤피 (IT/AI 전담)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
      onShowToast('전담 변리사 네트워크에 명세서 암호화 패키지가 안전하게 전송되었습니다.', 'success');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b25]/60 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#e5e8f5]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#131b2e] text-white">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-[#4edea3]" />
            <div>
              <h4 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-white">
                변리사 원클릭 검토 의뢰
              </h4>
              <p className="font-['Public_Sans'] text-[11px] text-[#bec6e0]">
                Partner Legal Network · 비밀유지 협약(NDA) 적용
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#bec6e0] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!isDone ? (
            <>
              <div className="p-3 bg-[#f1f3ff] rounded-lg border border-[#ebedfb] space-y-1">
                <div className="font-['Public_Sans'] text-[13px] font-bold text-[#181b25]">
                  이관 대상 초안 정보
                </div>
                <div className="font-['Public_Sans'] text-[12px] text-[#505f76]">
                  • 문서: {project.title}
                </div>
                <div className="font-['Public_Sans'] text-[12px] text-[#505f76]">
                  • 분류: {project.ipcClass} · 버전: {project.version}
                </div>
                <div className="font-['Public_Sans'] text-[12px] text-[#009668] font-semibold">
                  • 초안 형식 검토 완료 (AI 평가 98점 / 클레임 트리 6건 포함)
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">
                  추천 전문 특허법인 선택
                </label>
                {[
                  '특허법인 케이앤피 (IT/AI 전담 · 승인율 94%)',
                  '센서랩스 전담 지정 변리사회 (전기전자/SW)',
                  '글로벌 IP 파트너스 (해외 PCT 우선권 출원 전문)',
                ].map((firm) => (
                  <label
                    key={firm}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFirm === firm
                        ? 'border-[#131b2e] bg-[#f1f3ff] font-medium'
                        : 'border-[#e5e8f5] hover:bg-[#faf9ff]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="firm"
                      checked={selectedFirm === firm}
                      onChange={() => setSelectedFirm(firm)}
                      className="accent-[#131b2e]"
                    />
                    <span className="font-['Public_Sans'] text-[13px] text-[#181b25]">
                      {firm}
                    </span>
                  </label>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#002113]/5 border border-[#002113]/10 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#009668] shrink-0 mt-0.5" />
                <p className="font-['Public_Sans'] text-[11px] text-[#505f76] leading-relaxed">
                  본 의뢰 시 Anthropic API Zero Retention 규정에 따라 원본 프롬프트는 보존되지 않으며, 변리사 검토용 암호화 보안 패키지만 지정된 전용 채널로 전송됩니다.
                </p>
              </div>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#002113] text-[#4edea3] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h5 className="font-['IBM_Plex_Serif'] text-[17px] font-bold text-[#181b25]">
                변리사 검토 패키지 전송 완료
              </h5>
              <p className="font-['Public_Sans'] text-[13px] text-[#505f76] max-w-xs">
                선택하신 &apos;{selectedFirm}&apos;에 암호화된 특허 초안과 클레임 트리가 전송되었습니다. 24시간 이내에 1차 피드백이 등록됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f1f3ff] border-t border-[#ebedfb] flex items-center justify-end gap-2">
          {!isDone ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white border border-[#e5e8f5] text-[#181b25] font-['Public_Sans'] text-[13px] font-medium hover:bg-[#ebedfb]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[13px] font-bold hover:bg-[#2c303a] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>암호화 전송 및 의뢰</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[13px] font-bold hover:bg-[#2c303a]"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
