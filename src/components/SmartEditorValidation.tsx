import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  ListOrdered,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  PlusCircle,
  Network,
  Edit2,
  FileCheck,
  ChevronDown,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { PatentProject } from '../types';

interface SmartEditorValidationProps {
  project: PatentProject;
  onUpdateProject: (updates: Partial<PatentProject>) => void;
  onGoToExport: () => void;
  onOpenReport: () => void;
  onOpenDrawing: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const SmartEditorValidation: React.FC<SmartEditorValidationProps> = ({
  project,
  onUpdateProject,
  onGoToExport,
  onOpenReport,
  onOpenDrawing,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'body' | 'claims' | 'drawings'>('claims');
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleFixAntecedent = () => {
    onUpdateProject({ isClaim2Fixed: true });
    onShowToast("명세서 본문 [0048]에 '압력센서부(142)'가 자동 추가되었습니다.", 'success');
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    onShowToast('청구범위 AI 지능형 다듬기를 시작합니다...', 'info');
    setTimeout(() => {
      setIsRegenerating(false);
      onShowToast('최신 KIPO 심사지침 기반 다듬기가 완료되었습니다.', 'success');
    }, 900);
  };

  const handleRenumber = () => {
    onShowToast('독립항/종속항 체계 6건의 인용 번호가 자동 재정렬되었습니다.', 'info');
  };

  const allPassed = project.isClaim2Fixed;

  return (
    <div className="flex flex-col w-full px-4 md:px-8 xl:px-12 pt-4 pb-36 md:pb-12 space-y-4 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
      {/* Live KIPO Claim Verification Header Banner */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#181b25] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="font-['IBM_Plex_Serif'] text-[17px] font-semibold text-[#181b25]">
              스마트 청구항 실시간 검증기
            </h2>
          </div>

          {!allPassed ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse"></span>
              <span>법조항 검토 필요</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
              <span>법적 요건 1차 검토 완료</span>
            </div>
          )}
        </div>
        <p className="font-['Public_Sans'] text-[12px] text-[#505f76]">
          특허법 제42조 제4항 제1호(명세서 뒷받침 요건) 및 선행사 일치성 실시간 감지 중
        </p>
      </div>

      {/* Document Section Navigation Tabs */}
      <div className="overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('summary');
              onShowToast('특허 요약서 섹션으로 전환되었습니다.', 'info');
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-['Public_Sans'] text-[12px] transition-colors ${
              activeSubTab === 'summary'
                ? 'bg-[#181b25] text-white font-semibold'
                : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#dfe2ef]'
            }`}
          >
            요약서
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('body');
              onShowToast('명세서 본문 【발명을 실시하기 위한 구체적인 내용】으로 전환되었습니다.', 'info');
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-['Public_Sans'] text-[12px] transition-colors ${
              activeSubTab === 'body'
                ? 'bg-[#181b25] text-white font-semibold'
                : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#dfe2ef]'
            }`}
          >
            명세서 본문
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('claims')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-['Public_Sans'] text-[12px] flex items-center gap-1.5 transition-colors shadow-sm ${
              activeSubTab === 'claims'
                ? 'bg-[#181b25] text-white font-semibold'
                : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#dfe2ef]'
            }`}
          >
            <span>청구범위 (Claims)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#131b2e] text-[#bec6e0] font-['JetBrains_Mono'] text-[10px] font-bold">
              6
            </span>
            {!allPassed && <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span>}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('drawings');
              onOpenDrawing();
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full font-['Public_Sans'] text-[12px] transition-colors flex items-center gap-1 ${
              activeSubTab === 'drawings'
                ? 'bg-[#181b25] text-white font-semibold'
                : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#dfe2ef]'
            }`}
          >
            <span>도면 (Mermaid/SVG)</span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76]">4</span>
          </button>
        </div>
      </div>

      {/* Section Quick Utility Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[12px] font-medium hover:bg-[#dfe2ef] active:scale-95 transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>이 섹션만 AI 재생성</span>
          </button>
          <button
            type="button"
            onClick={handleRenumber}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[12px] font-medium hover:bg-[#dfe2ef] active:scale-95 transition-all"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>항 번호 자동 정렬</span>
          </button>
        </div>
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76] shrink-0 font-medium">
          KIPO 2024 심사지침 적용
        </span>
      </div>

      {/* Grid Layout for Desktop */}
      <div className="flex flex-col md:grid md:grid-cols-[6fr_4fr] md:gap-8 gap-6">
        {/* Left Column: Main Editor/Claims */}
        <div className="flex flex-col gap-3.5">
          {/* Claim 1: Independent Claim */}
          <section className="bg-white rounded-xl border-2 border-[#d2d6ea] shadow-sm flex flex-col h-full overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-[#131b2e] focus-within:border-transparent p-4 gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-[#131b2e] text-[#bec6e0] font-['JetBrains_Mono'] text-[10px] font-bold uppercase">
                독립항
              </span>
              <span className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
                청구항 1
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
                [장치 청구항]
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>선행사 기재 확인됨</span>
            </div>
          </div>

          {/* Claim Body */}
          <div className="p-3 rounded-lg bg-[#f1f3ff] font-['IBM_Plex_Serif'] text-[13px] text-[#181b25] leading-relaxed border border-[#ebedfb]">
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#181b25] font-bold">
              【청구항 1】
            </span>{' '}
            사용자의 기초 발명 데이터를 입력받는{' '}
            <span className="bg-[#d0e1fb] text-[#0b1c30] px-1 py-0.5 rounded font-medium">
              입력부(110)
            </span>
            ; 상기 기초 발명 데이터로부터 100번대 도면부호 목록을 자동 추출하여 등록하는{' '}
            <span className="bg-[#d0e1fb] text-[#0b1c30] px-1 py-0.5 rounded font-medium">
              부호 레지스트리부(120)
            </span>
            ; 및 작성 중인 청구항 내 명사구와 상기 명세서 본문 간의 일치 여부를 대조하는{' '}
            <span className="bg-[#d0e1fb] text-[#0b1c30] px-1 py-0.5 rounded font-medium">
              실시간 선행사 매칭 엔진(130)
            </span>
            ;을 포함하는 특허 초안 자동 생성 장치.
          </div>

          {/* Quick Action Footnote */}
          <div className="flex items-center justify-between pt-1 font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-[#009668]" />
              <span>선행사 인용 3개 노드 연결 완료</span>
            </div>
            <button
              type="button"
              onClick={() => onShowToast('청구항 1 직접 편집 모드가 활성화되었습니다.', 'info')}
              className="text-[#505f76] hover:text-[#181b25] flex items-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>수정</span>
            </button>
          </div>
        </section>

        {/* Claim 2: Dependent Claim */}
        <div className="p-4 rounded-xl bg-white border border-[#e5e8f5] shadow-sm flex flex-col gap-2.5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-[#ebedfb] text-[#505f76] font-['JetBrains_Mono'] text-[10px] font-bold">
                종속항
              </span>
              <span className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
                청구항 2
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
                [제1항 인용]
              </span>
            </div>

            {!project.isClaim2Fixed ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-[#ba1a1a]" />
                <span>뒷받침 1건 결여</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>선행사 기재 확인됨</span>
              </div>
            )}
          </div>

          {/* Claim Body */}
          <div className="p-3 rounded-lg bg-[#f1f3ff] font-['IBM_Plex_Serif'] text-[13px] text-[#181b25] leading-relaxed border border-[#ebedfb]">
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#181b25] font-bold">
              【청구항 2】
            </span>{' '}
            제1항에 있어서, 상기 실시간 선행사 매칭 엔진(130)은 상기 청구항에 기재된{' '}
            {!project.isClaim2Fixed ? (
              <span
                onClick={handleFixAntecedent}
                className="bg-[#ffdad6] text-[#93000a] px-1.5 py-0.5 rounded font-bold cursor-pointer hover:underline ring-1 ring-[#ba1a1a]/30"
                title="클릭하여 명세서 본문에 자동 추가"
              >
                압력센서부(142)
              </span>
            ) : (
              <span className="bg-[#d0e1fb] text-[#0b1c30] px-1.5 py-0.5 rounded font-medium">
                압력센서부(142)
              </span>
            )}
            가 상기 명세서 본문에 미기재된 경우, 경고 신호를 발생시키는 것을 특징으로 하는 특허 초안 자동 생성 장치.
          </div>

          {/* Warning / Resolved Box */}
          {!project.isClaim2Fixed ? (
            <div className="p-3.5 rounded-lg bg-[#d0e1fb] text-[#0b1c30] flex flex-col gap-2 shadow-sm border border-[#b7c8e1]">
              <div className="flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-['IBM_Plex_Serif'] text-[14px] font-bold text-[#93000a]">
                      본문 미기재 용어 감지: [압력센서부(142)]
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[#ba1a1a] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0 border border-[#ffdad6]">
                      거절이유 통지 위험
                    </span>
                  </div>
                  <p className="font-['Public_Sans'] text-[12px] text-[#505f76] leading-normal">
                    특허법 제42조 제4항 제1호(청구범위의 명세서 뒷받침 요건) 위배 가능성이 있습니다. 명세서 본문에 해당 구성 및 작동 관계가 명시되어야 합니다.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col items-end gap-1.5">
                <span className="font-['Public_Sans'] text-[11px] text-[#93000a] font-bold animate-pulse">
                  ✨ 클릭 한 번으로 AI가 문맥을 분석하여 본문에 누락된 내용을 자동 작성합니다.
                </span>
                <button
                  type="button"
                  onClick={handleFixAntecedent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-bold shadow hover:bg-[#2c303a] active:scale-95 transition-all animate-pulse ring-2 ring-[#4edea3]/50 ring-offset-1 ring-offset-[#d0e1fb]"
                >
                  <PlusCircle className="w-4 h-4 text-[#4edea3]" />
                  <span>AI 자동 해결: 명세서 본문에 누락된 구성요소 자동 추가 (+)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#002113] text-[#4edea3] flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
                <span className="font-['Public_Sans'] text-[12px] font-medium text-white">
                  【발명을 실시하기 위한 구체적인 내용】 [0048] 단락에 '압력센서부(142)' 설명 자동 주입 완료
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold">
                해결됨
              </span>
            </div>
          )}
        </div>

        {/* Claim 3: Dependent Claim */}
        <div className="p-4 rounded-xl bg-white border border-[#e5e8f5] shadow-sm flex flex-col gap-2.5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-[#ebedfb] text-[#505f76] font-['JetBrains_Mono'] text-[10px] font-bold">
                종속항
              </span>
              <span className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
                청구항 3
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
                [제1항 인용]
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>선행사 기재 확인됨</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#f1f3ff] font-['IBM_Plex_Serif'] text-[13px] text-[#181b25] leading-relaxed border border-[#ebedfb]">
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#181b25] font-bold">
              【청구항 3】
            </span>{' '}
            제1항에 있어서, 상기 부호 레지스트리부(120)는 상기 입력된 기초 발명 데이터의 제어 흐름에 기초하여 복수의 단계 블록별 도면부호를 10단위 인덱스로 자동 분류하는 제어 시퀀스 분배 모듈;을 더 포함하는 것을 특징으로 하는 특허 초안 자동 생성 장치.
          </div>
        </div>
      </div>

      {/* Right Column: Validation & Previews */}
      <div className="flex flex-col gap-4">
          {/* Visual Drawing Preview Thumbnail Card */}
          <div className="p-4 rounded-xl bg-[#f1f3ff] border border-[#ebedfb] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-[#dfe2ef] flex items-center justify-center shrink-0 border border-[#c6c6cd]/50">
            <svg className="w-8 h-8 text-[#505f76]" fill="none" viewBox="0 0 40 40">
              <rect x="4" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="22" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="13" y="22" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.4" />
              <path d="M11 18V28H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M29 18V28H27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-['IBM_Plex_Serif'] text-[15px] font-semibold text-[#181b25] truncate">
                도 1. 시스템 구성 블록도
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold">
                연동됨
              </span>
            </div>
            <span className="font-['Public_Sans'] text-[12px] text-[#505f76] truncate">
              부호 110, 120, 130 매핑 완료 · 도면 1건 매핑 확인
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDrawing}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#dfe2ef] transition-colors"
        >
          도면 보기
        </button>
      </div>

      {/* Collapsible Self-Verification Checklist */}
      <div className="p-4 rounded-xl bg-white border border-[#e5e8f5] shadow-sm flex flex-col gap-2.5">
        <div
          onClick={() => setIsChecklistOpen(!isChecklistOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#181b25]" />
            <h3 className="font-['IBM_Plex_Serif'] text-[15px] font-semibold text-[#181b25]">
              KIPO 자가 사전 심사 체크리스트
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold ${
                allPassed ? 'bg-[#002113] text-[#4edea3]' : 'bg-[#d0e1fb] text-[#0b1c30]'
              }`}
            >
              {allPassed ? '5/5 충족' : '4/5 충족'}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#505f76] transition-transform duration-200 ${
              isChecklistOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {isChecklistOpen && (
          <div className="flex flex-col gap-1.5 pt-1">
            {/* Item 1 */}
            {!allPassed ? (
              <div className="p-2.5 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-center justify-between gap-2 border border-[#ba1a1a]/20">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                  <span className="font-['Public_Sans'] text-[13px] truncate font-medium">
                    청구항 구성요소 명세서 뒷받침 여부
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFixAntecedent}
                  className="px-2 py-0.5 rounded bg-white text-[#ba1a1a] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0 hover:bg-[#ffdad6] transition-colors"
                >
                  1건 주의 필요
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#f1f3ff] flex items-center justify-between gap-2 border border-[#ebedfb]">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-[#009668] shrink-0" />
                  <span className="font-['Public_Sans'] text-[13px] text-[#181b25] truncate">
                    청구항 구성요소 명세서 뒷받침 여부
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                  AI 검토 완료
                </span>
              </div>
            )}

            {/* Item 2 */}
            <div className="p-2.5 rounded-lg bg-[#f1f3ff] flex items-center justify-between gap-2 border border-[#ebedfb]">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#009668] shrink-0" />
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] truncate">
                  도면부호-본문 용어 1:1 일치 여부
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                AI 검토 완료
              </span>
            </div>

            {/* Item 3 */}
            <div className="p-2.5 rounded-lg bg-[#f1f3ff] flex items-center justify-between gap-2 border border-[#ebedfb]">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#009668] shrink-0" />
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] truncate">
                  해결과제 - 발명의 효과 1:1 대응
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                일치
              </span>
            </div>

            {/* Item 4 */}
            <div className="p-2.5 rounded-lg bg-[#f1f3ff] flex items-center justify-between gap-2 border border-[#ebedfb]">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#009668] shrink-0" />
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] truncate">
                  독립항 과도한 한정 배제 여부
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                양호 (넓은 권리범위)
              </span>
            </div>

            {/* Item 5 */}
            <div className="p-2.5 rounded-lg bg-[#f1f3ff] flex items-center justify-between gap-2 border border-[#ebedfb]">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#009668] shrink-0" />
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] truncate">
                  당업자 재현 가능성 및 기재불비 검사
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                AI 검토 완료
              </span>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>

      {/* Bottom Interactive Action Dock */}
      <div className="pt-2 flex flex-col gap-2">
        <div className="p-2 bg-white/95 backdrop-blur-xl border border-[#e5e8f5] rounded-xl shadow-xl flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenReport}
            className="flex-1 py-3 px-3 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#dfe2ef] transition-colors active:scale-95"
          >
            <Eye className="w-4 h-4 text-[#505f76]" />
            <span>검증 리포트 보기</span>
          </button>
          <button
            type="button"
            onClick={onGoToExport}
            className="flex-1 py-3 px-3 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2c303a] active:scale-95 transition-all shadow"
          >
            <span>검토 완료 및 내보내기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center font-['Public_Sans'] text-[10px] text-[#8a98af] leading-tight px-4 pb-2">
          * 본 서비스의 검토 결과는 AI에 의한 참고용이며, 최종 출원에 대한 법적 책임은 사용자 본인에게 있습니다.
        </p>
      </div>
    </div>
  );
};
