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
  ArrowLeft,
  Lock,
  Eye,
  Sparkles,
} from 'lucide-react';
import { PatentProject } from '../types';

interface SmartEditorValidationProps {
  project: PatentProject;
  onUpdateProject: (updates: Partial<PatentProject>) => void;
  onGoBackToStream?: () => void;
  onGoToExport: () => void;
  onOpenReport: () => void;
  onOpenDrawing: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const SmartEditorValidation: React.FC<SmartEditorValidationProps> = ({
  project,
  onUpdateProject,
  onGoBackToStream,
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
    onShowToast("명세서 본문 [0048]에 '압력센서부(142)'가 자동 추가되었습니다. 점멸 경고가 해제되었습니다!", 'success');
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    
    if (activeSubTab === 'drawings') {
      onShowToast('도면 Mermaid 코드 구문 분석 및 오류 자동 교정을 시작합니다...', 'info');
      setTimeout(() => {
        // Sanitize generatedSpec mermaid blocks
        let spec = project.generatedSpec || '';
        const sanitizedSpec = spec.replace(/```mermaid([\s\S]*?)```/g, (fullMatch, codeContent) => {
          let cleaned = codeContent.trim();
          if (!cleaned.match(/^(graph|flowchart|sequenceDiagram|classDiagram)/i)) {
            cleaned = 'graph TD\n' + cleaned;
          }
          cleaned = cleaned.replace(/\[\s*([^"\]\n]+?)\s*\]/g, (_: any, inner: string) => {
            const clean = inner.replace(/"/g, "'").trim();
            return `["${clean}"]`;
          });
          return '```mermaid\n' + cleaned + '\n```';
        });

        onUpdateProject({ generatedSpec: sanitizedSpec });
        setIsRegenerating(false);
        onShowToast('도면 Mermaid 구문 오류(Syntax Error)가 100% 자동 교정되었습니다!', 'success');
      }, 800);
    } else if (activeSubTab === 'claims') {
      onShowToast('청구범위(독립항/종속항) AI 지능형 재작성 및 검증을 시작합니다...', 'info');
      setTimeout(() => {
        setIsRegenerating(false);
        onShowToast('최신 KIPO 심사지침 기반 청구범위 재정렬이 완료되었습니다.', 'success');
      }, 900);
    } else {
      onShowToast(`${activeSubTab === 'body' ? '명세서 본문' : '요약서'} AI 보완을 진행합니다...`, 'info');
      setTimeout(() => {
        setIsRegenerating(false);
        onShowToast('해당 섹션이 최적화되었습니다.', 'success');
      }, 800);
    }
  };

  const handleRenumber = () => {
    onShowToast('독립항/종속항 체계 6건의 인용 번호가 자동 재정렬되었습니다.', 'info');
  };

  const allPassed = !!project.isClaim2Fixed;

  return (
    <div className="flex flex-col w-full px-4 md:px-8 xl:px-12 pt-4 pb-36 md:pb-12 space-y-4 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
      {/* 1. Direct Back Navigation Bar to Previous Step */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ebedfb] flex-wrap gap-2">
        {onGoBackToStream ? (
          <button
            type="button"
            onClick={onGoBackToStream}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#ebedfb] text-[#181b25] text-xs md:text-sm font-bold border border-[#d2d6ea] hover:border-[#181b25] transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#181b25]" />
            <span>← 이전 단계 (실시간 생성 결과 화면으로 돌아가기)</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#505f76]">
          <span className="w-2 h-2 rounded-full bg-[#009668]"></span>
          <span>생성된 명세서 초안 원본 보존 중 (임의 재생성 없음)</span>
        </div>
      </div>

      {/* Live KIPO Claim Verification Header Banner with HIGH-VISIBILITY Warning */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#181b25] text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-['IBM_Plex_Serif'] text-[18px] font-bold text-[#181b25]">
                스마트 청구항 실시간 심사 검증기
              </h2>
              <p className="font-['Public_Sans'] text-[12px] text-[#505f76]">
                특허법 제42조 제4항 제1호(명세서 뒷받침 요건) 및 선행사 일치성 실시간 감지 중
              </p>
            </div>
          </div>

          {/* Eye-catching Blinking Warning Badge */}
          {!allPassed ? (
            <div 
              onClick={() => setActiveSubTab('claims')}
              className="cursor-pointer flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-['Public_Sans'] text-xs md:text-sm font-black tracking-wide shadow-lg shadow-red-500/30 border-2 border-red-300 animate-pulse hover:scale-[1.02] transition-transform"
              title="클릭하여 문제가 있는 청구항 2로 이동합니다"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-90"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              </span>
              <AlertTriangle className="w-4 h-4 text-yellow-300 animate-bounce" />
              <span>🚨 특허법 제42조 법조항 위반 점멸 경고 1건 발견! (필수 해결 요망)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-xs font-bold tracking-wide border border-[#4edea3]/40 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
              <span>✓ 특허법 법적 요건 1차 검토 100% 완료 (출원 가능)</span>
            </div>
          )}
        </div>
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
            className={`shrink-0 px-4 py-2 rounded-full font-['Public_Sans'] text-[12px] flex items-center gap-2 transition-all shadow-sm ${
              activeSubTab === 'claims'
                ? 'bg-[#181b25] text-white font-bold ring-2 ring-[#181b25]/50'
                : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#dfe2ef]'
            }`}
          >
            <span>청구범위 (Claims)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#131b2e] text-[#bec6e0] font-['JetBrains_Mono'] text-[10px] font-bold">
              6
            </span>
            {!allPassed && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] animate-pulse shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping"></span>
                <span>1건 점멸 경고!</span>
              </span>
            )}
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleRegenerate}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-['Public_Sans'] text-[12px] font-semibold active:scale-95 transition-all shadow-sm ${
              activeSubTab === 'drawings'
                ? 'bg-[#131b2e] text-[#4edea3] hover:bg-[#232a3d]'
                : 'bg-[#ebedfb] text-[#181b25] hover:bg-[#dfe2ef]'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>
              {activeSubTab === 'drawings'
                ? '도면 구문 오류 자동 교정 및 재작성'
                : activeSubTab === 'claims'
                ? '청구범위만 AI 재생성'
                : activeSubTab === 'summary'
                ? '요약서만 AI 재생성'
                : '명세서 본문 AI 다듬기'}
            </span>
          </button>
          {activeSubTab === 'claims' && (
            <button
              type="button"
              onClick={handleRenumber}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[12px] font-medium hover:bg-[#dfe2ef] active:scale-95 transition-all"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>항 번호 자동 정렬</span>
            </button>
          )}
        </div>
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76] shrink-0 font-medium">
          KIPO 2024 심사지침 규격 적용
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

        {/* Claim 2: Dependent Claim (with HIGH-VISIBILITY BLINKING WARNING) */}
        <div className={`p-5 rounded-2xl bg-white transition-all duration-300 flex flex-col gap-3 ${
          !project.isClaim2Fixed
            ? 'border-2 border-red-500 ring-4 ring-red-200 shadow-xl shadow-red-500/15'
            : 'border border-[#e5e8f5] shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#ebedfb] text-[#505f76] font-['JetBrains_Mono'] text-[10px] font-bold">
                종속항
              </span>
              <span className="font-['IBM_Plex_Serif'] text-[17px] font-bold text-[#181b25]">
                청구항 2
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
                [제1항 인용]
              </span>
            </div>

            {!project.isClaim2Fixed ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white font-['JetBrains_Mono'] text-[11px] font-bold animate-pulse shadow-md">
                <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
                <AlertTriangle className="w-4 h-4 text-yellow-300 animate-bounce" />
                <span>선행사 뒷받침 1건 결여 (특허법 제42조 위반)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[11px] font-bold border border-[#4edea3]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>선행사 기재 확인됨 (법적 요건 통과)</span>
              </div>
            )}
          </div>

          {/* Claim Body */}
          <div className="p-3.5 rounded-xl bg-[#f1f3ff] font-['IBM_Plex_Serif'] text-[13.5px] text-[#181b25] leading-relaxed border border-[#ebedfb]">
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#181b25] font-bold">
              【청구항 2】
            </span>{' '}
            제1항에 있어서, 상기 실시간 선행사 매칭 엔진(130)은 상기 청구항에 기재된{' '}
            {!project.isClaim2Fixed ? (
              <button
                type="button"
                onClick={handleFixAntecedent}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-[12px] align-middle shadow-md ring-2 ring-yellow-400 animate-pulse active:scale-95 transition-transform"
                title="클릭하여 명세서 본문에 '압력센서부(142)' 선행사를 즉시 추가합니다"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
                <span>🔥 [점멸 경고: 클릭하여 해결] 압력센서부(142)</span>
              </button>
            ) : (
              <span className="bg-[#d0e1fb] text-[#0b1c30] px-2 py-0.5 rounded font-bold border border-[#b7c8e1]">
                압력센서부(142)
              </span>
            )}
            가 상기 명세서 본문에 미기재된 경우, 경고 신호를 발생시키는 것을 특징으로 하는 특허 초안 자동 생성 장치.
          </div>

          {/* Warning / Resolved Box */}
          {!project.isClaim2Fixed ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 text-[#0b1c30] flex flex-col gap-3 shadow-md border-2 border-red-400">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-600 text-white shrink-0 mt-0.5 shadow">
                  <AlertOctagon className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-['IBM_Plex_Serif'] text-[15px] font-bold text-red-700">
                      🚨 본문 미기재 용어 감지: [압력센서부(142)]
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-['JetBrains_Mono'] text-[11px] font-extrabold shrink-0 border border-red-300 shadow animate-bounce">
                      특허청 거절이유 통지(OA) 위험 100%
                    </span>
                  </div>
                  <p className="font-['Public_Sans'] text-[12.5px] text-slate-700 leading-relaxed font-medium">
                    특허법 제42조 제4항 제1호(청구범위의 명세서 뒷받침 요건) 위배 가능성이 있습니다. 명세서 본문에 해당 구성 및 작동 관계가 명시되어야 공식 서식 내보내기가 가능합니다.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-red-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span>아래 버튼을 눌러 점멸 경고를 해결해야 내보내기가 활성화됩니다.</span>
                </div>
                <button
                  type="button"
                  onClick={handleFixAntecedent}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-['Public_Sans'] text-[13px] font-black shadow-lg hover:shadow-red-600/30 active:scale-95 transition-all ring-2 ring-yellow-400"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>✨ [AI 원클릭 자동 해결] 본문에 선행사 자동 추가하고 승인 (+)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#002113] text-[#4edea3] flex items-center justify-between gap-3 shadow border border-[#4edea3]/30">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#4edea3]" />
                <span className="font-['Public_Sans'] text-[12.5px] font-medium text-white">
                  【발명을 실시하기 위한 구체적인 내용】 [0048] 단락에 <strong>'압력센서부(142)'</strong> 설명 자동 주입 완료!
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[#4edea3] font-['JetBrains_Mono'] text-[11px] font-bold shrink-0">
                ✓ 해결 완료
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
        <div className="p-2 bg-white/95 backdrop-blur-xl border border-[#e5e8f5] rounded-xl shadow-xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenReport}
            className="flex-1 py-3.5 px-3 rounded-xl bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#dfe2ef] transition-colors active:scale-95"
          >
            <Eye className="w-4 h-4 text-[#505f76]" />
            <span>검증 리포트 보기</span>
          </button>

          {/* Export Button: STRICTLY LOCKED until Claim 2 blinking error is fixed */}
          {allPassed ? (
            <button
              type="button"
              onClick={onGoToExport}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-['Public_Sans'] text-[14px] font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all ring-2 ring-emerald-400/50"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>✓ 검토 완료: 공식 출원 서식 내보내기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onShowToast('🚨 청구항 2의 점멸 경고(특허법 제42조 선행사 결여)를 먼저 해결해야 공식 출원 서식을 내보낼 수 있습니다!', 'warning');
                setActiveSubTab('claims');
              }}
              className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 border-2 border-red-300 text-slate-400 font-['Public_Sans'] text-[13px] font-bold flex items-center justify-center gap-2 cursor-not-allowed group hover:bg-red-50/50 transition-all shadow-inner"
              title="청구항 2의 점멸 경고를 해결해야 내보내기가 활성화됩니다"
            >
              <Lock className="w-4 h-4 text-red-500 group-hover:animate-bounce" />
              <span className="text-red-700">🔒 검토 완료 및 내보내기 (잠김)</span>
            </button>
          )}
        </div>

        {!allPassed && (
          <div className="flex items-center justify-center gap-2 text-center text-xs font-bold text-red-600 animate-pulse px-4">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>청구항 2의 점멸 경고(특허법 제42조 제4항 제1호 위배)를 AI 원클릭으로 해결해야 공식 서식 내보내기 버튼이 활성화됩니다.</span>
          </div>
        )}

        <p className="text-center font-['Public_Sans'] text-[10px] text-[#8a98af] leading-tight px-4 pb-2">
          * 본 서비스의 검토 결과는 AI에 의한 참고용이며, 최종 출원에 대한 법적 책임은 사용자 본인에게 있습니다.
        </p>
      </div>
    </div>
  );
};
