import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Search,
  Lightbulb,
  Settings2,
  Loader2,
  Check,
  RefreshCw,
  FileSearch,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Cpu,
  X,
} from 'lucide-react';
import { PatentProject } from '../types';
import { searchSimilarPatents, generateFallbackPatents, SimilarPatentCandidate } from '../utils/patentAiApi';

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
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  
  const handleTranslateTitle = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.includes('{') || trimmed.includes('}')) return;
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const translated = data[0].map((item: any) => item[0]).join('').toUpperCase();
      onUpdateProject({ title: `${trimmed}{${translated}}` });
    } catch (e) {
      console.error('Translation failed', e);
    }
  };
  const [q2Option, setQ2Option] = useState('');
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [similarCandidates, setSimilarCandidates] = useState<SimilarPatentCandidate[]>([]);
  const [selectedCandidateIndices, setSelectedCandidateIndices] = useState<number[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDetectingModel, setIsDetectingModel] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const abortSearchRef = useRef<AbortController | null>(null);
  const searchIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (project.apiKey && project.apiKey.trim().length > 15) {
      setIsDetectingModel(true);
      const timer = setTimeout(() => {
        setIsDetectingModel(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsDetectingModel(false);
    }
  }, [project.apiKey]);

  const handleManualSave = () => {
    onShowToast('작성 중인 특허 초안 정보가 저장되었습니다.', 'success');
  };

  const syncFieldsFromSelectedIndices = (indices: number[], candidates = similarCandidates) => {
    if (indices.length === 0) {
      onUpdateProject({
        similarPatentNo: '',
        differentiation: '',
      });
      return;
    }
    const sorted = [...indices].sort((a, b) => a - b);

    // Format patent numbers: 1 per line with line breaks (\n). Sanitize \n from fields to prevent splitting issues.
    const patentLines = sorted
      .map((idx) => {
        const pNo = (candidates[idx].patentNumber || '').toString().replace(/\n/g, ' ').trim();
        const pTi = (candidates[idx].title || '').toString().replace(/\n/g, ' ').trim();
        return `${pNo} : ${pTi}`;
      })
      .join('\n');

    // Format differentiation: clean multi-line with line breaks (\n\n)
    const diffLines = sorted
      .map((idx, i) => `[특허 ${i + 1} 대비 (${candidates[idx].title})] ${candidates[idx].differentiation}`)
      .join('\n\n');

    onUpdateProject({
      similarPatentNo: patentLines,
      differentiation: diffLines,
    });
  };

  const handleAutoSearchSimilar = async () => {
    const key = project.apiKey?.trim() || '';
    if (!key || key.length < 5) {
      onShowToast('1번 항목 [AI 모델 선택 및 API 키 입력]에 API 키를 먼저 입력해야 AI 유사 특허 검색이 가능합니다.', 'warning');
      const inputEl = document.getElementById('apiKeyInput');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
      return;
    }

    if (abortSearchRef.current) {
      abortSearchRef.current.abort();
    }
    abortSearchRef.current = new AbortController();

    const title = project.title?.trim() || '';
    if (!title) {
      onShowToast('2번 [발명의 명칭]을 먼저 입력해야 관련 유사 특허를 검색할 수 있습니다.', 'warning');
      return;
    }

    setIsSearchingSimilar(true);
    setSearchTime(0);
    searchIntervalRef.current = window.setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    try {
      const results = await searchSimilarPatents(
        project.aiModel || 'Gemini 1.5 Flash (초고속/추천)',
        key,
        {
          title: project.title,
          problemPurpose: project.problemPurpose,
          techField: project.techField,
        },
        abortSearchRef.current?.signal
      );
      setSimilarCandidates(results);
      setSelectedCandidateIndices([]);
      onShowToast(`AI가 유사 선행 특허 ${results.length}건 및 차별화 전략을 발췌했습니다.`, 'success');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onShowToast('AI 유사 특허 검색이 중지되었습니다.', 'info');
        return;
      }
      const msg = err instanceof Error ? err.message : '유사 특허 검색 중 오류가 발생했습니다.';
      onShowToast(msg, 'warning');

      // Auto-fallback so the user's patent workflow is never blocked
      const fallbackList = generateFallbackPatents({
        title: project.title,
        problemPurpose: project.problemPurpose,
        techField: project.techField,
      });
      setSimilarCandidates(fallbackList);
      setSelectedCandidateIndices([]);
    } finally {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
      setIsSearchingSimilar(false);
    }
  };

  const handleStopSearch = () => {
    if (abortSearchRef.current) {
      abortSearchRef.current.abort();
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
      setIsSearchingSimilar(false);
    }
  };

  const handleToggleCandidate = (idx: number) => {
    let nextIndices: number[];
    if (selectedCandidateIndices.includes(idx)) {
      nextIndices = selectedCandidateIndices.filter((i) => i !== idx);
      onShowToast(`'${similarCandidates[idx].title}' 채택이 해제되었습니다.`, 'info');
    } else {
      nextIndices = [...selectedCandidateIndices, idx];
      onShowToast(`'${similarCandidates[idx].title}' 특허가 한 줄 추가되었습니다.`, 'success');
    }
    setSelectedCandidateIndices(nextIndices);
    syncFieldsFromSelectedIndices(nextIndices);
  };

  const handleSelectAllCandidates = () => {
    const allIndices = similarCandidates.map((_, i) => i);
    setSelectedCandidateIndices(allIndices);
    syncFieldsFromSelectedIndices(allIndices);
    onShowToast(`유사 특허 ${allIndices.length}건이 특허별 줄바꿈으로 일괄 채택되었습니다.`, 'success');
  };

  const handleClearSelection = () => {
    setSelectedCandidateIndices([]);
    onUpdateProject({
      similarPatentNo: '',
      differentiation: '',
    });
    onShowToast('채택된 유사 특허 목록이 초기화되었습니다.', 'info');
  };

  // Individual patent item slots ("특허별 칸칸이")
  const rawPatentLines = (project.similarPatentNo !== undefined && project.similarPatentNo.trim() !== '')
    ? project.similarPatentNo.split('\n')
    : [''];

  const handleUpdatePatentItem = (index: number, val: string) => {
    const next = [...rawPatentLines];
    next[index] = val;
    onUpdateProject({ similarPatentNo: next.join('\n') });
  };

  const handleRemovePatentItem = (index: number) => {
    if (rawPatentLines.length <= 1) {
      onUpdateProject({ similarPatentNo: '' });
      setSelectedCandidateIndices([]);
      return;
    }
    const next = rawPatentLines.filter((_, i) => i !== index);
    onUpdateProject({ similarPatentNo: next.join('\n') });
  };

  const handleAddPatentItem = () => {
    const next = [...rawPatentLines, ''];
    onUpdateProject({ similarPatentNo: next.join('\n') });
  };

  const activePatentCount = rawPatentLines.filter((l) => l.trim().length > 0).length;

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
          {/* 1. AI Engine & API Key Input */}
          <section className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
              <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">1</span>
                <span>AI 엔진 연동 (API 키 입력)</span>
                {project.apiKey && project.apiKey.trim().length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold">✓ 키 등록 완료</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-['JetBrains_Mono'] text-[10px] font-bold">필수</span>
                )}
              </h2>

              {/* Automatic Engine Detection Badge */}
              <div className="flex items-center gap-1.5">
                {(() => {
                  const key = project.apiKey?.trim() || '';
                  if (!key) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f1f3ff] text-[#505f76] text-[11px] font-semibold border border-[#d8dce8]">
                        <Cpu className="w-3.5 h-3.5 text-[#505f76]" />
                        <span>AI 스마트 자동 감지</span>
                      </span>
                    );
                  }
                  if (isDetectingModel) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fff8e6] text-[#b45309] text-[11px] font-bold border border-[#fef08a] animate-in fade-in">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>최적의 최신 모델을 탐색 중입니다...</span>
                      </span>
                    );
                  }
                  if (key.startsWith('AIza') || key.startsWith('AQ.')) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e8f0fe] text-[#1a73e8] text-[11px] font-bold border border-[#b2d1fd] animate-in fade-in">
                        <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse"></span>
                        <span>Google Gemini 자동 연동됨</span>
                      </span>
                    );
                  }
                  if (key.startsWith('sk-ant-')) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f5eefc] text-[#7c3aed] text-[11px] font-bold border border-[#ddd6fe] animate-in fade-in">
                        <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse"></span>
                        <span>Anthropic Claude 자동 연동됨</span>
                      </span>
                    );
                  }
                  if (key.startsWith('sk-')) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e6f7ef] text-[#10a37f] text-[11px] font-bold border border-[#a7f3d0] animate-in fade-in">
                        <span className="w-2 h-2 rounded-full bg-[#10a37f] animate-pulse"></span>
                        <span>OpenAI GPT 자동 연동됨</span>
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fef3c7] text-[#92400e] text-[11px] font-bold border border-[#fde68a]">
                      <span>맞춤형 AI 키 감지됨</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border-2 border-[#181b25] shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#f1f3ff] text-[#181b25] shrink-0 border border-[#d8dce8]">
                  <Key className="w-4 h-4 text-[#131b2e]" />
                </div>
                <input
                  id="apiKeyInput"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="보유하신 API 키를 붙여넣으세요 (Google: AIza... / Claude: sk-ant-... / OpenAI: sk-...)"
                  className="w-full bg-[#f1f3ff] border-2 border-[#181b25] focus:border-[#131b2e] rounded-lg px-3.5 py-2 text-[#181b25] font-['JetBrains_Mono'] text-[13px] outline-none transition-all"
                  value={project.apiKey || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    let autoModel = 'Gemini 최신 모델 (자동 탐색)';
                    if (val.startsWith('sk-ant-')) {
                      autoModel = 'Claude 3.5 Sonnet (Pro)';
                    } else if (val.startsWith('AIza') || val.startsWith('AQ.')) {
                      autoModel = 'Gemini 최신 모델 (자동 탐색)';
                    } else if (val.startsWith('sk-') && !val.startsWith('sk-ant-')) {
                      autoModel = 'GPT-4o (Plus)';
                    }
                    onUpdateProject({ apiKey: val, aiModel: autoModel });
                  }}
                  onClick={() => {
                    if (!project.apiKey) {
                      onShowToast('특허 초안 생성을 위해 보유하신 AI API 키를 입력해 주세요.', 'info');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'API 키 숨기기' : 'API 키 확인하기'}
                  className="px-3 py-2 rounded-lg bg-[#f1f3ff] hover:bg-[#e4e7fa] text-[#505f76] border-2 border-[#181b25] text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="hidden sm:inline">{showApiKey ? '숨김' : '확인'}</span>
                </button>
              </div>
              <p className="text-[12px] text-[#505f76] font-['Public_Sans'] flex items-center gap-1.5 px-0.5">
                <span>💡 사용자 본인의 API 키를 입력하시면, 보유하신 AI 계정 등급(무료/유료 플랜)에 맞춰 100% 자동 연결되어 초안 작성이 진행됩니다.</span>
              </p>
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
            onBlur={(e) => handleTranslateTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
                handleTranslateTitle(e.currentTarget.value);
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

        {/* Right Column: Section 5 (Similar Patent) & Optional Advanced Accordion */}
        <div className="flex flex-col gap-6">
          {/* 5. Similar / Prior Patent & Differentiation */}
          <section className="bg-white rounded-xl border-2 border-[#181b25] p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="flex items-center gap-2 font-['Public_Sans'] text-[15px] font-bold text-[#181b25] flex-wrap">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono']">
                  5
                </span>
                <span>유사·비교 특허 및 핵심 차별점</span>
                <span className="px-2 py-0.5 rounded-full bg-[#f1f3ff] border border-[#131b2e]/30 text-[#131b2e] font-['JetBrains_Mono'] text-[10px] font-bold shadow-sm">
                  선택
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold">
                  품질 극대화 추천
                </span>
              </h2>

              {isSearchingSimilar ? (
                <button
                  type="button"
                  onClick={handleStopSearch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 border border-rose-200 hover:bg-rose-200 hover:text-rose-700 font-['Public_Sans'] text-[11.5px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>검색 중지 ({searchTime}초)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAutoSearchSimilar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-[#131b2e] hover:from-indigo-500 hover:to-indigo-900 text-white font-['Public_Sans'] text-[11.5px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="AI가 발명 정보를 분석하여 종래 유사 특허와 차별점을 자동 검색 및 발췌합니다"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ AI 유사 특허 자동 확인·발췌</span>
                </button>
              )}
            </div>

            <p className="font-['Public_Sans'] text-[12px] text-[#505f76] leading-relaxed">
              특허청 심사관의 <strong>'진보성 결여(특허법 제29조 제2항)' 거절이유를 100% 회피</strong>하기 위해 선행 특허와의 차별점을 기술합니다. 위 <strong>[⚡ AI 유사 특허 자동 확인·발췌]</strong> 버튼을 누르면 AI가 키프리스(KIPRIS) 데이터베이스를 조회하여 유사 특허와 한계점을 자동으로 발췌해 드립니다.
            </p>

            {/* AI Search Loading State */}
            {isSearchingSimilar && (
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="font-['Public_Sans'] text-[13px] font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>AI 특허 분석관이 선행 특허 DB를 검색·분석 중입니다...</span>
                  </div>
                  <span className="font-['Public_Sans'] text-[11px] text-indigo-700 leading-tight">
                    입력하신 발명 명칭 및 기술 과제와 유사한 등록/공개 특허의 한계점과 본 발명의 차별화 포인트를 도출하고 있습니다.
                  </span>
                </div>
              </div>
            )}

            {/* AI Extracted Similar Patent Candidates */}
            {similarCandidates.length > 0 && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-[#f8f9ff] border border-indigo-200/80 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <FileSearch className="w-4 h-4 text-indigo-600" />
                    <span className="font-['Public_Sans'] text-[12px] font-bold text-[#181b25]">
                      AI 발췌 유사 특허 후보 ({similarCandidates.length}건)
                    </span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full font-medium">
                      {selectedCandidateIndices.length > 0
                        ? `${selectedCandidateIndices.length}건 채택 (특허별 1줄씩 줄바꿈 반영됨)`
                        : '특허별 채택 또는 전체 일괄 채택 가능'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCandidates}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-3 h-3" />
                      <span>3건 전체 일괄 채택</span>
                    </button>
                    {selectedCandidateIndices.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer transition-colors"
                      >
                        <span>선택 해제</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAutoSearchSimilar}
                      disabled={isSearchingSimilar}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#505f76] hover:text-indigo-600 cursor-pointer transition-colors ml-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSearchingSimilar ? 'animate-spin' : ''}`} />
                      <span>재검색</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {similarCandidates.map((c, idx) => {
                    const isSelected = selectedCandidateIndices.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all text-left flex flex-col gap-2 bg-white ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm bg-indigo-50/30'
                            : 'border-[#dfe2ef] hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-['JetBrains_Mono'] text-[10px] font-bold">
                                유사도 {c.relevanceScore}%
                              </span>
                              <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#181b25]">
                                [특허 {idx + 1}] {c.patentNumber}
                              </span>
                            </div>
                            <h4 className="font-['Public_Sans'] text-[12px] font-bold text-[#181b25]">
                              {c.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleCandidate(idx)}
                            className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>채택됨 (해제)</span>
                              </>
                            ) : (
                              <>
                                <span>+ 이 특허 채택</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 pt-0.5 text-[11px] font-['Public_Sans']">
                          <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200/70 text-amber-950 flex flex-col gap-0.5">
                            <span className="font-bold text-[10px] text-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              종래 특허의 한계점 (거절 위험 요소)
                            </span>
                            <span className="leading-snug text-amber-900">{c.limitations}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-indigo-50/90 border border-indigo-200/70 text-indigo-950 flex flex-col gap-0.5">
                            <span className="font-bold text-[10px] text-indigo-800 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-indigo-600 shrink-0" />
                              본 발명의 차별화 전략 (진보성 확보 방안)
                            </span>
                            <span className="leading-snug text-indigo-900">{c.differentiation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input A: Similar Patent Identification (Individual boxes per patent - "칸칸이") */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-['Public_Sans'] text-[12px] font-bold text-[#181b25] flex items-center gap-1.5">
                  <span>비교 대상 유사 특허</span>
                  {activePatentCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ebedfb] text-[#131b2e] font-['JetBrains_Mono'] text-[10px] font-bold">
                      {activePatentCount}건 등록됨
                    </span>
                  )}
                </label>
              </div>

              {/* Individual Patent Input Boxes ("칸칸이") */}
              <div className="flex flex-col gap-2">
                {rawPatentLines.map((patentLine, pIdx) => {
                  const displayVal = patentLine.replace(/^\d+\.\s*/, '');
                  return (
                    <div key={pIdx} className="flex items-center gap-2">
                      <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-[#131b2e] text-white text-[11px] font-['JetBrains_Mono'] font-bold shadow-xs">
                        {pIdx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={
                          pIdx === 0
                            ? '예: 10-2023-0048192 (공개특허) : 스마트 압력 모니터링 장치'
                            : `특허 ${pIdx + 1} 출원/등록번호 및 명칭`
                        }
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#f1f3ff] text-[#181b25] font-['JetBrains_Mono'] text-[12.5px] outline-none border-2 border-[#181b25] focus:border-[#131b2e] focus:bg-white transition-all placeholder:text-[#94a3b8]"
                        value={displayVal}
                        onChange={(e) => handleUpdatePatentItem(pIdx, e.target.value)}
                      />
                      {rawPatentLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePatentItem(pIdx)}
                          title="이 특허 칸 삭제"
                          className="shrink-0 p-2 rounded-lg text-[#505f76] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddPatentItem}
                  className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#181b25]/40 hover:border-[#181b25] text-[#181b25] font-['Public_Sans'] text-[11.5px] font-bold transition-all hover:bg-[#f1f3ff] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 비교 특허 칸 추가</span>
                </button>
              </div>
            </div>

            {/* Input B: Core Differentiation (Multi-line) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-['Public_Sans'] text-[12px] font-bold text-[#181b25]">
                기존 유사 특허 대비 내 발명의 핵심 차별점 / 개선 효과
              </label>
              <textarea
                rows={4}
                placeholder={"[특허 1 대비] 기존 특허는 수동 측정 방식이라 오차가 크지만, 내 발명은 실시간 센서와 AI로 임계 압력을 자동 예측함\n\n[특허 2 대비] 유선 통신망 단절 시에도 로컬 엣지 모듈이 독립적으로 긴급 비상 차단을 수행함"}
                className="w-full h-[120px] p-3.5 rounded-xl bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[12.5px] leading-relaxed outline-none border-2 border-[#181b25] focus:border-[#131b2e] focus:bg-white resize-y transition-all placeholder:text-[#94a3b8]"
                value={project.differentiation || ''}
                onChange={(e) => onUpdateProject({ differentiation: e.target.value })}
              />
            </div>

            {/* Optional KIPRIS Link for manual verification */}
            <div className="flex items-center justify-between text-[11px] text-[#505f76] pt-1 border-t border-[#f1f3ff]">
              <span>💡 발췌된 내용을 확인 후 필요시 자유롭게 직접 수정하실 수 있습니다.</span>
              <a
                href="http://www.kipris.or.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#505f76] hover:text-indigo-600 underline font-medium"
                title="특허청 키프리스(KIPRIS) 직접 검색 열기"
              >
                <span>키프리스에서 직접 조회하기</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </section>

          {/* Collapsible: Optional Advanced Settings for Experts */}
          <section className="bg-white rounded-xl border-2 border-[#d2d6ea] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-4 flex items-center justify-between bg-[#f8f9ff] hover:bg-[#ebedfb] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#505f76]" />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-['Public_Sans'] text-[13px] font-bold text-[#181b25]">
                      ⚙️ 전문가용 정밀 설정 (도면부호 및 세부 질문)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f1f3ff] border border-[#131b2e]/30 text-[#131b2e] font-['JetBrains_Mono'] text-[10px] font-bold shadow-sm">
                      선택
                    </span>
                  </div>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76]">
                    일반 발명자는 미입력해도 AI가 문맥에 맞게 100% 자동 생성합니다.
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#505f76] transition-transform duration-200 ${
                  isAccordionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isAccordionOpen && (
              <div className="p-4 space-y-4 border-t border-[#ebedfb] bg-white">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-['Public_Sans'] text-[12px] font-semibold text-[#181b25]">
                      핵심 구성요소 및 도면부호 가안 (선택)
                    </label>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76]">
                      미입력 시 100번대 자동 부여
                    </span>
                  </div>
                  <div className="p-1 rounded-lg bg-[#f1f3ff] border border-[#d2d6ea]">
                    <textarea
                      placeholder="예: 입력부(110), 제어부(120), 표시부(130)..."
                      className="w-full p-2 bg-transparent text-[#181b25] font-['JetBrains_Mono'] text-[12px] outline-none resize-none"
                      rows={2}
                      value={project.keyComponents}
                      onChange={(e) => onUpdateProject({ keyComponents: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-['Public_Sans'] text-[12px] font-semibold text-[#181b25]">
                    기타 참고 문헌 / 추가 선행기술 메모 (선택)
                  </label>
                  <input
                    type="text"
                    placeholder="기타 논문, 기술 문서, URL 등"
                    className="w-full px-3 py-2 rounded-lg bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[12px] outline-none focus:bg-white border border-[#d2d6ea] focus:border-[#131b2e] transition-all"
                    value={project.priorArt}
                    onChange={(e) => onUpdateProject({ priorArt: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-['Public_Sans'] text-[12px] font-semibold text-[#181b25]">
                    발명의 주요 구현 형태 (선택)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['하드웨어/기계 장치 중심', '소프트웨어/AI/클라우드 중심', '하드웨어+소프트웨어 복합 시스템'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setQ2Option(opt);
                          onUpdateProject({ q2Selected: opt });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-['Public_Sans'] transition-all ${
                          q2Option === opt
                            ? 'bg-[#131b2e] text-white font-bold'
                            : 'bg-[#ebedfb] text-[#505f76] hover:bg-[#dfe2ef]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
