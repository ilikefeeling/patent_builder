import React from 'react';
import { X, Award, CheckCircle2, AlertTriangle, ShieldCheck, Printer } from 'lucide-react';
import { PatentProject } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PatentProject;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  project,
  onShowToast,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b25]/60 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-lg max-h-[85vh] rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#e5e8f5]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#f1f3ff] border-b border-[#ebedfb]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#009668]" />
            <div>
              <h4 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
                KIPO 자가 사전 심사 종합 리포트
              </h4>
              <p className="font-['Public_Sans'] text-[11px] text-[#505f76]">
                문서번호: {project.docId} · 기준: 2024년 특허·실용신안 심사기준
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#505f76] hover:bg-[#ebedfb] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Score Summary Box */}
          <div className="p-4 rounded-xl bg-[#ebedfb] border border-[#dfe2ef] flex items-center justify-between">
            <div>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76] uppercase font-bold">
                KIPO 적합성 신뢰도 점수
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['JetBrains_Mono'] text-[28px] font-bold text-[#181b25]">
                  {project.isClaim2Fixed ? '98' : '82'}
                </span>
                <span className="font-['Public_Sans'] text-[13px] text-[#505f76]">
                  / 100점 (최우수 등급)
                </span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[12px] font-bold">
              {project.isClaim2Fixed ? '형식 오류 없음' : '보정 권고'}
            </div>
          </div>

          {/* Detailed Metric Rows */}
          <div className="space-y-2">
            <h5 className="font-['Public_Sans'] text-[13px] font-bold text-[#181b25]">
              법적 요건 정밀 분석 항목
            </h5>

            <div className="p-3 rounded-lg bg-[#f1f3ff] border border-[#ebedfb] flex items-start justify-between gap-3">
              <div>
                <span className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">
                  1. 특허법 제42조 제4항 제1호 (청구범위의 뒷받침)
                </span>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  청구항에 기재된 용어가 발명의 설명에 대응하여 기재되었는지 여부
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold shrink-0 ${
                  project.isClaim2Fixed
                    ? 'bg-[#002113] text-[#4edea3]'
                    : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}
              >
                {project.isClaim2Fixed ? '적합' : '1건 결여'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#f1f3ff] border border-[#ebedfb] flex items-start justify-between gap-3">
              <div>
                <span className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">
                  2. 특허법 제42조 제4항 제2호 (명확성)
                </span>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  독립항의 구성요소 및 종속항의 인용 관계 및 번호 순서 적합성
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                적합
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#f1f3ff] border border-[#ebedfb] flex items-start justify-between gap-3">
              <div>
                <span className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">
                  3. 특허법 제42조 제3항 제1호 (실시가능요건)
                </span>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  해당 기술분야의 통상의 지식을 가진 자가 쉽게 실시할 수 있는지 여부
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                적합
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#f1f3ff] border border-[#ebedfb] flex items-start justify-between gap-3">
              <div>
                <span className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">
                  4. 도면부호 일관성 (KIPO 규칙 1:1 매핑)
                </span>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  본문 설명과 첨부 도면 블록 간 100번대 부호 중복 및 누락 여부
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                용어 일치 확인
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f1f3ff] border-t border-[#ebedfb] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onShowToast('사전 심사 리포트 인쇄본이 생성되었습니다.', 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e8f5] text-[#181b25] font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#ebedfb]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>리포트 인쇄</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
