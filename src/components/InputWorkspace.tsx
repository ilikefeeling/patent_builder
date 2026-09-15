import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Sliders,
  ChevronDown,
  CheckCircle2,
  CornerDownRight,
  ArrowRight,
  FastForward,
  BrainCircuit,
  Key,
} from 'lucide-react';
import { PatentProject } from '../types';

const CloudDoneIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <path d="m9 13 2 2 4-4" />
  </svg>
);

interface InputWorkspaceProps {
  project: PatentProject;
  onUpdateProject: (updates: Partial<PatentProject>) => void;
  onStartPipeline: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const InputWorkspace: React.FC<InputWorkspaceProps> = ({
  project,
  onUpdateProject,
  onStartPipeline,
  onShowToast,
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [q2Option, setQ2Option] = useState('');
  const handleManualSave = () => {
    onShowToast('작성 중인 특허 초안 정보가 저장되었습니다.', 'success');
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-8 xl:px-12 pt-4 pb-36 md:pb-12 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
      {/* Top Status Bar */}
      <section className="flex items-center justify-between gap-2 px-1 mb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dfe2ef] text-[#505f76] font-['JetBrains_Mono'] text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
          {project.docId}
        </span>
        <button
          onClick={handleManualSave}
          className="flex items-center gap-1 text-[#505f76] hover:text-[#181b25] font-['JetBrains_Mono'] text-[11px] transition-colors"
        >
          <CloudDoneIcon className="w-3.5 h-3.5 text-[#009668]" />
          <span>자동 저장됨 ({project.lastSavedText})</span>
        </button>
      </section>

      {/* Grid Layout for Desktop */}
      <div className="flex flex-col md:grid md:grid-cols-[6fr_4fr] md:gap-8 gap-6">
        {/* Left Column: Core Inputs */}
        <div className="flex flex-col h-full">
          {/* 1. API Key & Model Selection */}
          <section className="mb-6">
        <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25] mb-2.5 px-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">1</span>
          <span>AI 모델 선택 및 API 키 입력</span>
          {project.apiKey && project.apiKey.trim().length > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">✓ 입력 완료</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">필수</span>
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-xl border-2 border-[#181b25] shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#505f76]" />
            <select
              className="bg-[#f1f3ff] border-2 border-[#181b25] focus:border-[#131b2e] rounded-lg px-2 py-1.5 text-[#181b25] font-['Public_Sans'] text-[13px] font-semibold outline-none cursor-pointer transition-colors"
              value={project.aiModel}
              onChange={(e) => onUpdateProject({ aiModel: e.target.value })}
            >
              <option value="Claude 3.5 Sonnet (Pro)">Claude 3.5 Sonnet (Pro)</option>
              <option value="Gemini 1.5 Pro (Advanced)">Gemini 1.5 Pro (Advanced)</option>
              <option value="GPT-4o (Plus)">GPT-4o (Plus)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Key className="w-4 h-4 text-[#505f76]" />
            <input
              type="password"
              placeholder="API 키 입력 (sk-...)"
              className="w-full bg-[#f1f3ff] border-2 border-[#181b25] focus:border-[#131b2e] rounded-lg px-3 py-1.5 text-[#181b25] font-['JetBrains_Mono'] text-[13px] outline-none transition-all"
              value={project.apiKey || ''}
              onChange={(e) => {
                const val = e.target.value;
                let autoModel = project.aiModel;
                
                if (val.startsWith('sk-ant-')) {
                  autoModel = 'Claude 3.5 Sonnet (Pro)';
                } else if (val.startsWith('AIza') || val.startsWith('AQ.')) {
                  autoModel = 'Gemini 1.5 Pro (Advanced)';
                } else if (val.startsWith('sk-') && !val.startsWith('sk-ant-')) {
                  autoModel = 'GPT-4o (Plus)';
                }
                
                onUpdateProject({ 
                  apiKey: val,
                  ...(autoModel !== project.aiModel ? { aiModel: autoModel } : {})
                });

                if (autoModel !== project.aiModel) {
                  onShowToast(`API 키 감지: ${autoModel.split(' ')[0]} 모델로 자동 전환되었습니다.`, 'success');
                }
              }}
              onClick={() => {
                if (!project.apiKey) {
                  onShowToast('특허 초안 생성을 위해 API 키를 입력해 주세요.', 'info');
                }
              }}
            />
            <button
              onClick={() => {
                const key = project.apiKey?.trim() || '';
                if (key.length < 10) {
                  onShowToast('API 키가 입력되지 않았거나 유효하지 않습니다.', 'warning');
                  return;
                }
                const model = project.aiModel;
                let isMismatch = false;
                let expectedPrefix = '';
                if (model.includes('Claude') && !key.startsWith('sk-ant-')) {
                  isMismatch = true;
                  expectedPrefix = 'sk-ant-';
                } else if (model.includes('Gemini') && !(key.startsWith('AIza') || key.startsWith('AQ.'))) {
                  isMismatch = true;
                  expectedPrefix = 'AIza 또는 AQ.';
                } else if (model.includes('GPT') && !key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
                  isMismatch = true;
                  expectedPrefix = 'sk-';
                }
                if (isMismatch) {
                  onShowToast(`모델(${model.split(' ')[0]})과 키 형식이 불일치합니다. (예상: ${expectedPrefix})`, 'warning');
                } else {
                  onShowToast('API 키 검증 완료! 형식이 올바릅니다.', 'success');
                }
              }}
              className="whitespace-nowrap px-3 py-1.5 bg-[#131b2e] hover:bg-[#1a2540] text-white rounded-lg font-['Public_Sans'] text-[12px] font-semibold transition-colors focus:outline-none"
            >
              검증
            </button>
          </div>
        </div>
      </section>

      {/* 2. Invention Title */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25] mb-2.5 px-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">2</span>
          <span>발명의 명칭 작성</span>
          {project.title.trim().length > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">✓ 입력 완료</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">필수</span>
          )}
        </h2>
        <div className="p-4 bg-white rounded-xl border-2 border-[#181b25] shadow-sm h-[100px] flex flex-col">
          <textarea
            className="w-full flex-1 bg-transparent text-[#181b25] font-['IBM_Plex_Serif'] text-[16px] font-semibold leading-snug outline-none border-b-2 border-[#e5e8f5] focus:border-[#131b2e] pb-2 resize-none transition-all placeholder:text-[#bec6e0]"
            placeholder="발명의 명칭을 입력하세요..."
            value={project.title}
            onChange={(e) => onUpdateProject({ title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
                onShowToast('발명의 명칭 작성이 완료되었습니다.', 'success');
              }
            }}
          />
        </div>
      </section>

      {/* 3. Problem & Purpose */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25]">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">3</span>
            <span>해결하고자 하는 과제 / 발명의 목적</span>
            {project.problemPurpose.trim().length > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">✓ 입력 완료</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">필수</span>
            )}
          </h2>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76] hidden sm:block">특허법 제42조 대응</span>
        </div>
        <textarea
          className="w-full h-[142px] p-4 rounded-xl bg-white text-[#181b25] font-['Public_Sans'] text-[13px] leading-relaxed outline-none border-2 border-[#181b25] focus:border-[#131b2e] focus:ring-1 focus:ring-[#131b2e] resize-none transition-all shadow-sm"
          value={project.problemPurpose}
          onChange={(e) => onUpdateProject({ problemPurpose: e.target.value })}
        />
      </section>

      {/* 4. Tech Field */}
      <section className="mb-6 flex flex-col flex-1">
        <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25] mb-2.5 px-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">4</span>
          <span>기술 분야 및 적용 대상 / 용도</span>
          {project.techField.trim().length > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">✓ 입력 완료</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold ml-1">필수</span>
          )}
        </h2>
        <textarea
          className="w-full flex-1 min-h-[160px] p-4 rounded-xl bg-white text-[#181b25] font-['Public_Sans'] text-[13px] leading-relaxed outline-none border-2 border-[#181b25] focus:border-[#131b2e] focus:ring-1 focus:ring-[#131b2e] resize-none transition-all shadow-sm"
          value={project.techField}
          onChange={(e) => onUpdateProject({ techField: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
              onShowToast('기술 분야 작성이 완료되었습니다.', 'success');
            }
          }}
        />
      </section>
        </div>

        {/* Right Column: Advanced & AI */}
        <div className="flex flex-col">
          {/* 5. Optional Advanced Controls */}
          <section className="mb-6">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25]">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">5</span>
            <span>명세서 정밀 제어 요소</span>
            <span className="px-2 py-0.5 rounded-full bg-[#f1f3ff] border border-[#131b2e]/30 text-[#131b2e] font-['JetBrains_Mono'] text-[10px] font-bold ml-1 shadow-sm">선택</span>
          </h2>
        </div>
        <div className="bg-white rounded-xl border-2 border-[#181b25] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full p-4 flex items-center justify-between bg-[#f1f3ff]/60 hover:bg-[#ebedfb] transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#505f76]" />
              <span className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">
                도면부호 가안 및 선행기술 입력
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#505f76] transition-transform duration-200 ${
                isAccordionOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isAccordionOpen && (
            <div className="p-4 space-y-4 border-t border-[#ebedfb]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-['Public_Sans'] text-[12px] font-semibold text-[#181b25]">
                    핵심 구성요소 및 도면부호 가안
                  </label>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76]">발명의 설명 자동 매핑</span>
                </div>
                <div className="p-1 rounded-lg bg-[#f1f3ff] border-2 border-[#181b25]">
                  <textarea
                    className="w-full p-2 bg-transparent text-[#181b25] font-['JetBrains_Mono'] text-[12px] outline-none resize-none"
                    rows={2}
                    value={project.keyComponents}
                    onChange={(e) => onUpdateProject({ keyComponents: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-['Public_Sans'] text-[12px] font-semibold text-[#181b25]">
                  인지된 선행기술 정보 (선택)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[13px] outline-none focus:bg-white border-2 border-[#181b25] focus:border-[#131b2e] transition-all"
                  value={project.priorArt}
                  onChange={(e) => onUpdateProject({ priorArt: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. AI Interactive Questions */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25]">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">6</span>
            <span>AI 기술 질문 보강</span>
            <span className="px-2 py-0.5 rounded-full bg-[#f1f3ff] border border-[#131b2e]/30 text-[#131b2e] font-['JetBrains_Mono'] text-[10px] font-bold ml-1 shadow-sm">선택</span>
          </h2>
        </div>
        <div className="relative p-4.5 bg-gradient-to-br from-[#131b2e] via-[#232a3d] to-[#181b25] text-white rounded-xl shadow-lg overflow-hidden border-2 border-[#181b25]">
          <div className="absolute -right-4 -bottom-6 text-white/5 pointer-events-none select-none">
            <BrainCircuit className="w-40 h-40" />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#4edea3] text-[#002113] font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider">
                  품질 향상 권장
                </span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#dae2fd]">
                  진행도 1/2 완료
                </span>
              </div>
              <h3 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-white">
                청구항 기재불비 방지용 심층 확인
              </h3>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="p-3 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-white/20">
              <div className="flex items-start justify-between gap-2">
                {project.q1Answer.trim().length > 0 ? (
                  <>
                    <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#002113] text-[#009668] font-bold">Q1 완료</span>
                    <CheckCircle2 className="w-4 h-4 text-[#009668]" />
                  </>
                ) : (
                  <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#d0e1fb] text-[#0b1c30] font-bold">Q1 응답 대기</span>
                )}
              </div>
              <p className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium mt-1">
                도면부호 매칭은 로컬 브라우저(Client-side WASM)에서 수행됩니까, 아니면 백엔드 API에서 처리됩니까?
              </p>
              <div className="mt-2">
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 rounded bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[12px] outline-none focus:bg-white border-2 border-[#181b25] focus:border-[#131b2e]"
                  placeholder="답변을 입력하세요..."
                  value={project.q1Answer}
                  onChange={(e) => onUpdateProject({ q1Answer: e.target.value })}
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg shadow-sm border border-white/20">
              <div className="flex items-start justify-between gap-2">
                <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#d0e1fb] text-[#0b1c30] font-bold">Q2 응답 대기</span>
              </div>
              <p className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium mt-1">
                도면 생성 코드는 Mermaid.js 외에 다른 형식(SVG, PlantUML)도 동시 지원합니까?
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['Mermaid.js 단독 지원 (경량화)', 'SVG 렌더링 + PlantUML 다중 지원', '텍스트 기반 ASCII 아키텍처 다이어그램'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setQ2Option(opt); onUpdateProject({ q2Selected: opt }); }}
                    className={`px-2.5 py-1 rounded text-[11px] font-['JetBrains_Mono'] transition-all ${
                      q2Option === opt ? 'bg-[#131b2e] text-[#dae2fd] font-semibold ring-1 ring-[#131b2e]' : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#131b2e] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 rounded bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[12px] outline-none focus:bg-white border-2 border-[#181b25] focus:border-[#131b2e]"
                  placeholder="직접 추가 세부사항 입력..."
                  value={project.q2Custom}
                  onChange={(e) => onUpdateProject({ q2Custom: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      </div>

      {/* Procedural Action Bar */}
      <div className="pt-2">
        <div className="p-3 bg-white/95 backdrop-blur-xl border border-[#e5e8f5] rounded-xl shadow-lg flex items-center justify-center">
          <button
            type="button"
            onClick={onStartPipeline}
            className="w-full px-4 py-8 rounded-xl bg-[#181b25] text-white font-['Public_Sans'] text-[18px] font-bold hover:bg-[#2c303a] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span>특허 초안 생성 파이프라인 시작</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
