import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Check,
  Hourglass,
  Clock,
  Pause,
  Play,
  ArrowRight,
  GitFork,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  FileCheck2,
  FileX2,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { PatentProject } from '../types';
import {
  streamPatentGeneration,
  streamPatentContinuation,
  checkSpecificationCompleteness,
  SpecificationCompleteness,
} from '../utils/patentAiApi';

interface LiveGenerationPipelineProps {
  project: PatentProject;
  onGoBackToInput?: () => void;
  onGoToEditor: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download', options?: { sticky?: boolean }) => void;
  onUpdateGeneratedSpec: (spec: string) => void;
}

export const LiveGenerationPipeline: React.FC<LiveGenerationPipelineProps> = ({
  project,
  onGoBackToInput,
  onGoToEditor,
  onShowToast,
  onUpdateGeneratedSpec,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [streamedText, setStreamedText] = useState(project.generatedSpec || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(project.generatedSpec?.length || 0);

  // Auto-continuation & completeness states
  const [showContinuationModal, setShowContinuationModal] = useState(false);
  const [continuationRound, setContinuationRound] = useState(0);
  const [isAutoContinuing, setIsAutoContinuing] = useState(false);
  const [continuationSuccess, setContinuationSuccess] = useState(false);
  const [continuationStatusMessage, setContinuationStatusMessage] = useState('');
  const [completenessState, setCompletenessState] = useState<SpecificationCompleteness | null>(null);

  const streamOutputRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep ref in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Timer
  useEffect(() => {
    if (isPaused || currentStep >= 5 || !isStreaming) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused, currentStep, isStreaming]);

  // Auto scroll
  useEffect(() => {
    if (streamOutputRef.current && isStreaming) {
      streamOutputRef.current.scrollTop = streamOutputRef.current.scrollHeight;
    }
  }, [streamedText, isStreaming]);

  // Determine current step from streamed text content
  const updateStepFromText = useCallback((text: string) => {
    if (text.includes('【특허청구범위】') || text.includes('【요약서】')) {
      setCurrentStep(4);
      setProgressPercent(92);
    } else if (text.includes('【발명을 실시하기 위한 구체적인 내용】') || text.includes('【도면의 간단한 설명】')) {
      setCurrentStep(3);
      setProgressPercent(65);
    } else if (text.includes('【발명의 내용】') || text.includes('【해결하려는 과제】')) {
      setCurrentStep(2);
      setProgressPercent(35);
    } else {
      setCurrentStep(1);
      setProgressPercent(10);
    }
  }, []);

  // Main generator trigger
  const executeGeneration = useCallback(async () => {
    const apiKey = project.apiKey?.trim();
    if (!apiKey || apiKey.length < 10) {
      setApiError('API 키가 입력되지 않았습니다.');
      return;
    }

    setIsStreaming(true);
    setApiError(null);
    setCurrentStep(1);
    setProgressPercent(5);
    setStreamedText('');
    setTokenCount(0);
    setElapsedSeconds(0);
    setIsPaused(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    try {
      let accumulated = '';
      let tokens = 0;

      const generator = streamPatentGeneration(
        project.aiModel,
        apiKey,
        {
          title: project.title,
          problemPurpose: project.problemPurpose,
          techField: project.techField,
          referenceNumerals: project.referenceNumerals,
          similarPatentNo: project.similarPatentNo,
          differentiation: project.differentiation,
          keyComponents: project.keyComponents,
          priorArt: project.priorArt,
          applicant: project.applicant,
        },
        currentController.signal
      );

      for await (const chunk of generator) {
        // Pause support
        while (isPausedRef.current) {
          await new Promise((r) => setTimeout(r, 100));
        }

        accumulated += chunk;
        tokens += chunk.length;
        setStreamedText(accumulated);
        setTokenCount(tokens);
        updateStepFromText(accumulated);
        // Continuously preserve draft in parent state so back navigation never loses it
        if (tokens % 40 === 0 || tokens < 100) {
          onUpdateGeneratedSpec(accumulated);
        }
      }

      // 무결성 검증 및 토큰 소진 자동 연장
      let completeness = checkSpecificationCompleteness(accumulated);
      setCompletenessState(completeness);

      let rounds = 0;
      const MAX_ROUNDS = 3;

      while (!completeness.isComplete && rounds < MAX_ROUNDS) {
        rounds++;
        setContinuationRound(rounds);
        setIsAutoContinuing(true);
        setShowContinuationModal(true);
        setContinuationStatusMessage(
          `AI 단일 응답 토큰 한도에 도달하여 미작성된 [${completeness.missingSections.join(', ')}] 항목을 자동으로 연속 작성 중입니다. (연장 ${rounds}/${MAX_ROUNDS}회차)`
        );
        onShowToast(
          `토큰 한도 도달: 누락된 ${completeness.missingSections.length}개 필수 항목을 자동으로 이어서 작성합니다.`,
          'warning'
        );

        const contGen = streamPatentContinuation(
          project.aiModel,
          apiKey,
          {
            title: project.title,
            problemPurpose: project.problemPurpose,
            techField: project.techField,
            referenceNumerals: project.referenceNumerals,
            similarPatentNo: project.similarPatentNo,
            differentiation: project.differentiation,
            keyComponents: project.keyComponents,
            priorArt: project.priorArt,
            applicant: project.applicant,
          },
          accumulated,
          completeness.missingSections,
          currentController.signal
        );

        for await (const chunk of contGen) {
          while (isPausedRef.current) {
            await new Promise((r) => setTimeout(r, 100));
          }

          accumulated += chunk;
          tokens += chunk.length;
          setStreamedText(accumulated);
          setTokenCount(tokens);
          updateStepFromText(accumulated);
          if (tokens % 40 === 0) {
            onUpdateGeneratedSpec(accumulated);
          }
        }

        completeness = checkSpecificationCompleteness(accumulated);
        setCompletenessState(completeness);
      }

      setIsAutoContinuing(false);

      if (completeness.isComplete) {
        setContinuationSuccess(true);
        setContinuationStatusMessage(
          '축하합니다! 청구범위(독립항/종속항)와 요약서를 포함한 모든 필수 항목이 완벽히 작성되었습니다.'
        );
        setTimeout(() => {
          setShowContinuationModal(false);
        }, 2200);
      }

      let cleanSpec = accumulated;
      const firstBracketIdx = cleanSpec.indexOf('【');
      if (firstBracketIdx > 0) {
        cleanSpec = cleanSpec.substring(firstBracketIdx);
      }
      cleanSpec = cleanSpec.replace(/^---+$/gm, '').replace(/^\*\*\*+$/gm, '');

      setCurrentStep(5);
      setProgressPercent(100);
      setIsPaused(true);
      onUpdateGeneratedSpec(cleanSpec);
      onShowToast('특허 명세서 전체 완결 자동 생성이 완료되었습니다!', 'success');
    } catch (err: any) {
      if (abortControllerRef.current !== currentController) return;
      if (err.name === 'AbortError') {
        onShowToast('특허 초안 생성이 사용자에 의해 중지되었습니다.', 'info');
        // Stop UI states cleanly
        setIsPaused(true);
      } else {
        const msg = err?.message || '알 수 없는 오류';
        setApiError(msg);
        onShowToast(`AI API 오류: ${msg}`, 'warning', { sticky: true });
      }
    } finally {
      if (abortControllerRef.current === currentController) {
        setIsStreaming(false);
        setIsAutoContinuing(false);
      }
    }
  }, [project, onShowToast, onUpdateGeneratedSpec, updateStepFromText]);

  // Main resume trigger
  const executeResumeGeneration = useCallback(async () => {
    const apiKey = project.apiKey?.trim();
    if (!apiKey || apiKey.length < 10) {
      setApiError('API 키가 입력되지 않았습니다.');
      return;
    }

    if (!streamedText) {
      return executeGeneration();
    }

    setIsStreaming(true);
    setApiError(null);
    setIsPaused(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    try {
      let accumulated = streamedText;
      let tokens = tokenCount;

      let completeness = checkSpecificationCompleteness(accumulated);
      setCompletenessState(completeness);

      let rounds = continuationRound;
      const MAX_ROUNDS = rounds + 3;

      while (!completeness.isComplete && rounds < MAX_ROUNDS) {
        rounds++;
        setContinuationRound(rounds);
        setIsAutoContinuing(true);
        setShowContinuationModal(true);
        setContinuationStatusMessage(
          `AI 단일 응답 토큰 한도에 도달하여 미작성된 [${completeness.missingSections.join(', ')}] 항목을 자동으로 이어서 작성 중입니다. (복구/연장 ${rounds}회차)`
        );
        onShowToast(
          `에러 복구: 누락된 ${completeness.missingSections.length}개 필수 항목을 자동으로 이어서 작성합니다.`,
          'info'
        );

        const contGen = streamPatentContinuation(
          project.aiModel,
          apiKey,
          {
            title: project.title,
            problemPurpose: project.problemPurpose,
            techField: project.techField,
            referenceNumerals: project.referenceNumerals,
            similarPatentNo: project.similarPatentNo,
            differentiation: project.differentiation,
            keyComponents: project.keyComponents,
            priorArt: project.priorArt,
            applicant: project.applicant,
          },
          accumulated,
          completeness.missingSections,
          currentController.signal
        );

        for await (const chunk of contGen) {
          while (isPausedRef.current) {
            await new Promise((r) => setTimeout(r, 100));
          }

          accumulated += chunk;
          tokens += chunk.length;
          setStreamedText(accumulated);
          setTokenCount(tokens);
          updateStepFromText(accumulated);
          if (tokens % 40 === 0) {
            onUpdateGeneratedSpec(accumulated);
          }
        }

        completeness = checkSpecificationCompleteness(accumulated);
        setCompletenessState(completeness);
      }

      setIsAutoContinuing(false);

      if (completeness.isComplete) {
        setContinuationSuccess(true);
        setContinuationStatusMessage(
          '축하합니다! 청구범위(독립항/종속항)와 요약서를 포함한 모든 필수 항목이 완벽히 작성되었습니다.'
        );
        setTimeout(() => {
          setShowContinuationModal(false);
        }, 2200);
      }

      let cleanSpec = accumulated;
      const firstBracketIdx = cleanSpec.indexOf('【');
      if (firstBracketIdx > 0) {
        cleanSpec = cleanSpec.substring(firstBracketIdx);
      }
      cleanSpec = cleanSpec.replace(/^---+$/gm, '').replace(/^\*\*\*+$/gm, '');

      setCurrentStep(5);
      setProgressPercent(100);
      setIsPaused(true);
      onUpdateGeneratedSpec(cleanSpec);
      onShowToast('특허 명세서 전체 완결 생성(복구)이 완료되었습니다!', 'success');
    } catch (err: any) {
      if (abortControllerRef.current !== currentController) return;
      if (err.name === 'AbortError') {
        onShowToast('특허 초안 생성이 사용자에 의해 중지되었습니다.', 'info');
        setIsPaused(true);
      } else {
        const msg = err?.message || '알 수 없는 오류';
        setApiError(msg);
        onShowToast(`AI API 오류: ${msg}`, 'warning', { sticky: true });
      }
    } finally {
      if (abortControllerRef.current === currentController) {
        setIsStreaming(false);
        setIsAutoContinuing(false);
      }
    }
  }, [project, streamedText, tokenCount, continuationRound, executeGeneration, onShowToast, onUpdateGeneratedSpec, updateStepFromText]);

  // Keep refs for unmount cleanup
  const streamedTextRef = useRef(streamedText);
  useEffect(() => {
    streamedTextRef.current = streamedText;
  }, [streamedText]);

  const onUpdateGeneratedSpecRef = useRef(onUpdateGeneratedSpec);
  useEffect(() => {
    onUpdateGeneratedSpecRef.current = onUpdateGeneratedSpec;
  }, [onUpdateGeneratedSpec]);

  // Sync to parent on component unmount ONLY
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (streamedTextRef.current && streamedTextRef.current.trim().length > 30) {
        onUpdateGeneratedSpecRef.current?.(streamedTextRef.current);
      }
    };
  }, []);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Safe navigation handler that guarantees parent state is fully updated
  const handleProceedToEditor = useCallback(() => {
    if (streamedText && streamedText.trim().length > 30) {
      onUpdateGeneratedSpec(streamedText);
    }
    onGoToEditor();
  }, [streamedText, onUpdateGeneratedSpec, onGoToEditor]);

  // Initial effect: If already generated, PRESERVE IT and DO NOT re-generate!
  useEffect(() => {
    // Check if we already have a generated specification in project state
    if (project.generatedSpec && project.generatedSpec.trim().length > 30) {
      setStreamedText(project.generatedSpec);
      setTokenCount(project.generatedSpec.length);
      setCurrentStep(5);
      setProgressPercent(100);
      setIsPaused(true);
      setIsStreaming(false);
      setCompletenessState(checkSpecificationCompleteness(project.generatedSpec));
      onShowToast('이전에 생성 완료된 특허 명세서 초안이 안전하게 보존되어 표시됩니다.', 'info');
      return;
    }

    // Otherwise run fresh generation
    executeGeneration();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStreamText = streamedText;

  const togglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    if (nextState) {
      onShowToast('스트리밍이 일시정지되었습니다.', 'info');
    } else {
      onShowToast('스트리밍이 재개되었습니다.', 'success');
    }
  };

  const tokPerSec = elapsedSeconds > 0 ? Math.round(tokenCount / elapsedSeconds) : 0;

  return (
    <div className="flex flex-col w-full px-4 md:px-8 xl:px-12 pt-4 pb-36 md:pb-12 space-y-4 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
      {/* Top Navigation Bar: Back to Input & Re-generate */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {onGoBackToInput && (
          <button
            type="button"
            onClick={onGoBackToInput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#d2d6ea] text-[#181b25] font-['Public_Sans'] text-xs font-semibold hover:bg-[#ebedfb] transition-all shadow-sm active:scale-95"
          >
            <span>← 1단계: 기본 정보로 돌아가기</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {project.generatedSpec && !isStreaming && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('기존 생성된 명세서를 초기화하고 새로 다시 생성하시겠습니까?')) {
                  executeGeneration();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>AI 전체 새로 생성하기</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleProceedToEditor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181b25] text-white text-xs font-bold hover:bg-[#2c303a] transition-all shadow-sm active:scale-95"
          >
            <span>스마트 에디터로 가기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Status Banner */}
      <div className="p-4 bg-[#ebedfb] rounded-xl border border-[#dfe2ef] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#131b2e] text-[#bec6e0] shrink-0">
            <RotateCcw className={`w-4 h-4 ${!isPaused && isStreaming ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-['IBM_Plex_Serif'] text-[17px] font-semibold text-[#181b25] truncate">
                {currentStep === 5 || (!isStreaming && project.generatedSpec && project.generatedSpec.length > 30)
                  ? '특허 명세서 초안 작성 완료 (안전 보존됨)'
                  : isAutoContinuing
                  ? '특허 명세서 완성도 보강 및 연속 작성 중'
                  : '특허 명세서 실시간 AI 자동 생성 중'}
              </span>
              <span className={`px-2 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold ${
                currentStep === 5 || (!isStreaming && project.generatedSpec && project.generatedSpec.length > 30)
                  ? 'bg-[#002113] text-[#4edea3]'
                  : isAutoContinuing ? 'bg-amber-400 text-[#002113]' : 'bg-[#4edea3] text-[#002113]'
              }`}>
                {currentStep === 5 || (!isStreaming && project.generatedSpec && project.generatedSpec.length > 30)
                  ? '100% 보존 완료'
                  : isAutoContinuing ? `토큰 연장 ${continuationRound}차` : 'SSE LIVE'}
              </span>
            </div>
            <p className="font-['Public_Sans'] text-[12px] text-[#505f76] truncate">
              {currentStep === 5 || (!isStreaming && project.generatedSpec && project.generatedSpec.length > 30)
                ? '기존 생성된 명세서 원본이 안전하게 보존 중입니다. (임의 재생성되지 않음)'
                : isAutoContinuing
                ? '토큰 소진으로 인한 미완성 제출 방지: 청구항/요약서 자동 연장 중'
                : 'KIPO 특허청 서식 표준 규격 준수 엔진 가동 중'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(isAutoContinuing || showContinuationModal || continuationRound > 0) && (
            <button
              onClick={() => setShowContinuationModal(true)}
              className="px-2.5 py-1 rounded-full bg-[#131b2e] text-[#4edea3] font-['Public_Sans'] text-[11px] font-bold flex items-center gap-1 hover:bg-[#2c303a] transition-colors shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>완성도 검증 현황</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-[#dfe2ef] px-2.5 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isAutoContinuing ? 'bg-amber-400' : 'bg-[#4edea3]'} animate-pulse`}></span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#181b25] font-bold">
              {elapsedSeconds.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Continuation Notice In-line Alert if continuing */}
      {isAutoContinuing && (
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-['Public_Sans'] text-xs font-bold text-amber-900">
                  [특허 무결성 보호] 1차 토큰 소진에 따른 필수 섹션 자동 연속 작성 중
                </span>
                <span className="px-2 py-0.2 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full">
                  연장 {continuationRound}차
                </span>
              </div>
              <p className="font-['Public_Sans'] text-[11px] text-amber-800 truncate">
                {continuationStatusMessage || '완벽한 정식 출원서(독립항/종속항/요약서)를 완비할 때까지 이어서 작성하고 있습니다.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowContinuationModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            안내 모달 열기
          </button>
        </div>
      )}

      {/* 4-Step Pipeline Stepper */}
      <div className="bg-white p-4 rounded-xl border border-[#e5e8f5] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-['Public_Sans'] text-[11px] text-[#505f76] uppercase tracking-wider font-semibold">
            파이프라인 진행 상태
          </span>
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#4edea3] bg-[#131b2e] px-2.5 py-1 rounded-full font-bold shadow-sm">
            {currentStep >= 5 ? '전체 완료' : `총 4단계 중 ${Math.min(currentStep, 4)}단계 진행`}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Step 1 */}
          <div className={`p-3 rounded-lg flex items-center justify-between border ${currentStep === 1 ? 'bg-[#131b2e] text-white border-[#232a3d] shadow-md' : 'bg-[#f1f3ff] border-[#ebedfb]'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${currentStep > 1 ? 'bg-[#4edea3] text-[#002113]' : currentStep === 1 ? 'bg-[#6ffbbe] text-[#002113] animate-pulse' : 'bg-[#dfe2ef] text-[#505f76]'}`}>
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Hourglass className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-['Public_Sans'] text-[13px] font-semibold truncate ${currentStep === 1 ? 'text-white' : 'text-[#181b25]'}`}>
                  Step 1. 기술분야 및 배경기술 분석
                </span>
                <span className={`font-['Public_Sans'] text-[11px] truncate ${currentStep === 1 ? 'text-[#bec6e0]' : 'text-[#505f76]'}`}>
                  {currentStep > 1 ? '완료 · 기술 동향 및 종래 기술 분석 완료' : 'AI가 기술 분야를 분석하고 있습니다...'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold shrink-0 ${currentStep > 1 ? 'bg-white text-[#181b25] border border-[#e5e8f5]' : currentStep === 1 ? 'bg-[#4edea3] text-[#002113]' : 'bg-[#dfe2ef] text-[#505f76]'}`}>
              {currentStep > 1 ? '완료' : currentStep === 1 ? `${progressPercent}%` : '대기 중'}
            </span>
          </div>

          {/* Step 2 */}
          <div className={`p-3 rounded-lg flex items-center justify-between border ${currentStep === 2 ? 'bg-[#131b2e] text-white border-[#232a3d] shadow-md' : currentStep > 2 ? 'bg-[#f1f3ff] border-[#ebedfb]' : 'bg-[#f1f3ff]/50 border-[#ebedfb] opacity-75'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${currentStep > 2 ? 'bg-[#4edea3] text-[#002113]' : currentStep === 2 ? 'bg-[#6ffbbe] text-[#002113] animate-pulse' : 'bg-[#dfe2ef] text-[#505f76]'}`}>
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : currentStep === 2 ? <Hourglass className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-['Public_Sans'] text-[13px] font-semibold truncate ${currentStep === 2 ? 'text-white' : 'text-[#181b25]'}`}>
                  Step 2. 발명의 내용 (과제, 수단, 효과) 작성
                </span>
                <span className={`font-['Public_Sans'] text-[11px] truncate ${currentStep === 2 ? 'text-[#bec6e0]' : 'text-[#505f76]'}`}>
                  {currentStep > 2 ? '완료 · 해결 과제 및 수단 도출 완료' : currentStep === 2 ? '발명의 핵심 내용 작성 중...' : '대기 중'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold shrink-0 ${currentStep > 2 ? 'bg-white text-[#181b25] border border-[#e5e8f5]' : currentStep === 2 ? 'bg-[#4edea3] text-[#002113]' : 'bg-[#dfe2ef] text-[#505f76]'}`}>
              {currentStep > 2 ? '완료' : currentStep === 2 ? `${progressPercent}%` : '대기 중'}
            </span>
          </div>

          {/* Step 3 */}
          {currentStep === 3 ? (
            <div className="p-3 bg-[#131b2e] text-white rounded-lg flex flex-col gap-2 shadow-md border border-[#232a3d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#6ffbbe] text-[#002113] flex items-center justify-center shrink-0 animate-pulse">
                    <Hourglass className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-['Public_Sans'] text-[13px] text-white font-semibold truncate">
                      Step 3. 청구항 및 발명을 실시하기 위한 구체적인 내용 스트리밍
                    </span>
                    <span className="font-['Public_Sans'] text-[11px] text-[#bec6e0] truncate">
                      KIPO 표준 서식 명세서 본문 실시간 작성 중
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#4edea3] text-[#002113] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-[#4edea3] rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : currentStep > 3 ? (
            <div className="p-3 bg-[#f1f3ff] rounded-lg flex items-center justify-between border border-[#ebedfb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#4edea3] text-[#002113] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-semibold truncate">
                    Step 3. 청구항 및 발명을 실시하기 위한 구체적인 내용 스트리밍
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    100% 완료 · KIPO 표준 서식 명세서 본문 작성 완료
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#181b25] font-['JetBrains_Mono'] text-[10px] font-bold border border-[#e5e8f5]">
                완료
              </span>
            </div>
          ) : (
            <div className="p-3 bg-[#f1f3ff]/50 rounded-lg flex items-center justify-between opacity-75 border border-[#ebedfb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#dfe2ef] text-[#505f76] flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium truncate">
                    Step 3. 청구항 및 발명을 실시하기 위한 구체적인 내용 스트리밍
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    명세서 본문 실시간 작성 예정
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#dfe2ef] text-[#505f76] font-['JetBrains_Mono'] text-[10px] font-medium shrink-0">
                대기 중
              </span>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 5 ? (
            <div className="p-3 bg-[#f1f3ff] rounded-lg flex items-center justify-between border border-[#ebedfb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#4edea3] text-[#002113] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-semibold truncate">
                    Step 4. 요약서 및 Mermaid.js 기반 도면 생성
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    100% 완료 · 요약서 작성 및 도면 시각화 렌더링 완료
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#181b25] font-['JetBrains_Mono'] text-[10px] font-bold border border-[#e5e8f5]">
                완료
              </span>
            </div>
          ) : currentStep === 4 ? (
            <div className="p-3 bg-[#131b2e] text-white rounded-lg flex flex-col gap-2 shadow-md border border-[#232a3d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#6ffbbe] text-[#002113] flex items-center justify-center shrink-0 animate-pulse">
                    <Hourglass className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-['Public_Sans'] text-[13px] text-white font-semibold truncate">
                      Step 4. 요약서 및 Mermaid.js 기반 도면 생성
                    </span>
                    <span className="font-['Public_Sans'] text-[11px] text-[#bec6e0] truncate">
                      요약서 작성 및 도면 시각화 코드 렌더링 중...
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#4edea3] text-[#002113] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-[#4edea3] rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#f1f3ff]/50 rounded-lg flex items-center justify-between opacity-75 border border-[#ebedfb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#dfe2ef] text-[#505f76] flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium truncate">
                    Step 4. 요약서 및 Mermaid.js 기반 도면 생성
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    요약서 작성 및 도면 시각화 렌더링 예정
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#dfe2ef] text-[#505f76] font-['JetBrains_Mono'] text-[10px] font-medium shrink-0">
                대기 중
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live SSE Streaming Output Console */}
      <div className="bg-white rounded-xl border border-[#e5e8f5] shadow-sm overflow-hidden flex flex-col">
        {/* Console Header / Metrics Bar */}
        <div className="px-4 py-2.5 bg-[#e5e8f5] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#009668] animate-ping"></span>
            <span className="font-['Public_Sans'] text-[12px] text-[#181b25] font-bold uppercase tracking-wider">
              KIPO 명세서 실시간 출력 콘솔
            </span>
          </div>
          <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-[#ff4d4d] to-[#f9cb28] text-white font-bold animate-pulse">
              🚀 {tokPerSec} tok/s ({project.aiModel.split(' ')[0]})
            </span>
            <span>•</span>
            <span>진행: {elapsedSeconds.toFixed(1)}s</span>
            <span>•</span>
            <span>{tokenCount.toLocaleString()} chars</span>
          </div>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="p-3 bg-[#fff0f0] border border-[#ffd0d0] rounded-lg flex items-center gap-2 text-[#c00]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-['Public_Sans'] text-[12px]">{apiError}</span>
          </div>
        )}

        {/* Legal Stream Area */}
        <div
          ref={streamOutputRef}
          className="p-4 bg-[#f1f3ff] flex flex-col gap-1 max-h-72 overflow-y-auto font-['IBM_Plex_Serif'] text-[13px] text-[#181b25] leading-relaxed border-t border-b border-[#ebedfb]"
        >
          <div className="leading-relaxed whitespace-pre-wrap">
            {currentStreamText || (isStreaming ? 'AI가 명세서를 작성하기 시작합니다...' : apiError ? '오류가 발생했습니다.' : '대기 중...')}
            {isStreaming && !isPaused && <span className="inline-block w-2 h-4 bg-[#181b25] ml-0.5 animate-pulse align-middle" />}
          </div>
        </div>

        {/* Live Stream Metadata footer */}
        <div className="px-4 py-2 bg-[#ebedfb] text-[#505f76] font-['JetBrains_Mono'] text-[10px] flex items-center justify-between">
          <span>Encoding: UTF-8 (KIPO Spec Rev.2024)</span>
          <span className="text-[#009668] font-semibold">
            Auto-Sync On Antecedent DB
          </span>
        </div>
      </div>

      {/* Live Drawing Symbol Registry Table */}
      <div className="bg-white p-4 rounded-xl border border-[#e5e8f5] shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GitFork className="w-4 h-4 text-[#505f76]" />
            <h3 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
              도면부호 실시간 레지스트리
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold">
            5개 등록됨
          </span>
        </div>
        <p className="font-['Public_Sans'] text-[12px] text-[#505f76]">
          본문 생성에 맞춰 도면 번호 및 주요 구성요소 용어가 자동으로 구조화됩니다.
        </p>

        {/* Registry Rows */}
        <div className="flex flex-col gap-1.5 mt-1">
          {[
            {
              code: '100',
              name: '특허 청구항 검증 시스템',
              tag: '메인 시스템',
              tagStyle: 'bg-[#002113] text-[#4edea3]',
            },
            {
              code: '110',
              name: '입력 인터페이스부',
              tag: '하위 모듈',
              tagStyle: 'bg-[#d3e4fe] text-[#0b1c30]',
            },
            {
              code: '120',
              name: '실시간 선행사 매칭 엔진',
              tag: '핵심 처리부',
              tagStyle: 'bg-[#dae2fd] text-[#131b2e]',
            },
            {
              code: '130',
              name: '4-단계 순차 파이프라인부',
              tag: '처리 모듈',
              tagStyle: 'bg-[#dfe2ef] text-[#505f76]',
            },
            {
              code: '140',
              name: '청구범위-본문 동기화 DB',
              tag: '저장 매체',
              tagStyle: 'bg-[#dfe2ef] text-[#505f76]',
            },
          ].map((item) => (
            <div
              key={item.code}
              className="px-3 py-2 rounded-lg bg-[#f1f3ff] flex items-center justify-between hover:bg-[#ebedfb] transition-colors border border-[#ebedfb]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#181b25] w-8 shrink-0">
                  {item.code}
                </span>
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] truncate font-medium">
                  {item.name}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] shrink-0 font-semibold ${item.tagStyle}`}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="pt-2">
        {currentStep === 5 ? (
          <button
            type="button"
            onClick={handleProceedToEditor}
            className="w-full py-3.5 px-3 rounded-xl bg-[#131b2e] text-[#4edea3] font-['Public_Sans'] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#2c303a] transition-all active:scale-[0.98] shadow-lg border border-[#232a3d]"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>생성 완료! 스마트 에디터로 이동하여 결과 확인</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {apiError ? (
              streamedText && streamedText.trim().length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => executeResumeGeneration()}
                    className="flex-[2] py-3 px-3 rounded-xl bg-indigo-600 text-white font-['Public_Sans'] text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>끊긴 부분부터 이어서 생성하기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => executeGeneration()}
                    className="flex-1 py-3 px-3 rounded-xl bg-[#232a3d] text-[#e5e8f5] font-['Public_Sans'] text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#2c344a] transition-all active:scale-[0.98] border border-[#3b445e]"
                  >
                    <RefreshCw className="w-4 h-4 stroke-[3]" />
                    <span>처음부터</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => executeGeneration()}
                  className="flex-1 py-3 px-3 rounded-xl bg-indigo-600 text-white font-['Public_Sans'] text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md"
                >
                  <RefreshCw className="w-4 h-4 stroke-[3]" />
                  <span>다시 생성하기 (재시작)</span>
                </button>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={togglePause}
                  className={`flex-1 py-3 px-3 rounded-xl font-['Public_Sans'] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border border-[#e5e8f5] ${
                    isPaused
                      ? 'bg-[#d0e1fb] text-[#0b1c30]'
                      : 'bg-[#e5e8f5] text-[#181b25] hover:bg-[#dfe2ef]'
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>스트리밍 재개</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>일시정지</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="flex-1 py-3 px-3 rounded-xl bg-[#fff0f0] text-[#ef4444] border border-[#fecaca] hover:bg-[#ffe4e4] font-['Public_Sans'] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>생성 중지</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (isAutoContinuing || (completenessState && !completenessState.isComplete)) {
                  setShowContinuationModal(true);
                  onShowToast('현재 특허 명세서 무결성 연속 완결 작업이 진행 중입니다.', 'info');
                } else {
                  handleProceedToEditor();
                }
              }}
              className="flex-1 py-3 px-3 rounded-xl bg-[#181b25] text-white font-['Public_Sans'] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2c303a] transition-all active:scale-[0.98] shadow-md"
            >
              <span>스마트 에디터로 이동</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* KIPO 서식 무결성 검증 & 토큰 소진 자동 연장 안내 모달 */}
      {/* ========================================================================= */}
      {showContinuationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e1726] border border-[#2b354f] rounded-2xl max-w-xl w-full p-6 shadow-2xl text-white flex flex-col gap-5 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowContinuationModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#bec6e0] hover:text-white hover:bg-white/10 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 헤더 */}
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                continuationSuccess
                  ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {continuationSuccess ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex flex-col min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-['IBM_Plex_Serif'] text-lg font-bold text-white">
                    {continuationSuccess
                      ? '특허 명세서 법정 규격 완성 완료'
                      : '특허 명세서 완성도 보강 및 연속 생성 중'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-['JetBrains_Mono'] ${
                    continuationSuccess
                      ? 'bg-[#4edea3] text-[#002113]'
                      : 'bg-amber-400 text-[#002113]'
                  }`}>
                    {continuationSuccess ? '완료' : `연장 ${continuationRound}차`}
                  </span>
                </div>
                <p className="font-['Public_Sans'] text-xs text-[#94a3b8] mt-0.5">
                  {continuationSuccess
                    ? '특허청 법정 필수 서식(독립항/종속항, 요약서)이 결손 없이 모두 완비되었습니다.'
                    : '토큰 한도 소진으로 인한 미완성 문서 제출 방지 자동 복구 시스템 작동'}
                </p>
              </div>
            </div>

            {/* 안내 알림 박스 */}
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              continuationSuccess
                ? 'bg-[#0f2d1e] border-[#1e6f47] text-[#a7f3d0]'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                {continuationSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold mb-1">
                    {continuationSuccess
                      ? '모든 법정 필수 항목 완결'
                      : '미완성 결과물 제출 방지 보호 안내'}
                  </p>
                  <p className="text-slate-300">
                    {continuationSuccess
                      ? '독립항 1개, 종속항 최소 3개 및 요약서가 모두 완비되었습니다. 이제 완벽한 초안으로 에디터에서 검토하실 수 있습니다.'
                      : '본 발명의 내용과 기술 구성이 방대하여 1회 출력 토큰 한도에 도달했습니다. 특허청 규정상 청구항과 요약서가 결손된 미완성 초안은 거절되므로, 완벽한 최종 제출 문서가 완성될 때까지 자동으로 연속 작성합니다.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 법정 필수 항목 실시간 체크리스트 */}
            <div className="bg-[#141e33] border border-[#232f48] rounded-xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#bec6e0]">
                <span>KIPO 특허청 필수 서식 항목 점검 현황</span>
                <span className="font-['JetBrains_Mono'] text-[#4edea3]">
                  {completenessState?.isComplete ? '100% 충족' : '실시간 검증 및 보완 중'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e1726]/80 border border-[#2b354f]">
                  {completenessState?.hasTitle ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  )}
                  <span className={completenessState?.hasTitle ? 'text-slate-200' : 'text-slate-400'}>
                    【발명의 명칭】
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e1726]/80 border border-[#2b354f]">
                  {completenessState?.hasProblemAndSolution ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  )}
                  <span className={completenessState?.hasProblemAndSolution ? 'text-slate-200' : 'text-slate-400'}>
                    【발명의 내용】 (과제/수단/효과)
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e1726]/80 border border-[#2b354f]">
                  {completenessState?.hasDetailedDescription ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  )}
                  <span className={completenessState?.hasDetailedDescription ? 'text-slate-200' : 'text-slate-400'}>
                    【발명의 구체적인 내용】
                  </span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  completenessState?.hasClaims
                    ? 'bg-[#0e1726]/80 border-[#2b354f]'
                    : 'bg-amber-950/30 border-amber-500/50 shadow-sm shadow-amber-500/10'
                }`}>
                  {completenessState?.hasClaims ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  )}
                  <span className={completenessState?.hasClaims ? 'text-[#4edea3] font-semibold' : 'text-amber-300 font-bold'}>
                    【특허청구범위】 (독립항+종속항)
                  </span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all sm:col-span-2 ${
                  completenessState?.hasAbstract
                    ? 'bg-[#0e1726]/80 border-[#2b354f]'
                    : 'bg-[#0e1726]/50 border-[#2b354f]'
                }`}>
                  {completenessState?.hasAbstract ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
                  ) : (
                    <Hourglass className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className={completenessState?.hasAbstract ? 'text-[#4edea3] font-semibold' : 'text-slate-400'}>
                    【요약서】 및 【도면 대용 코드】
                  </span>
                </div>
              </div>
            </div>

            {/* 상태 메시지 및 프로그레스 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="truncate">{continuationStatusMessage}</span>
                <span className="font-['JetBrains_Mono'] text-white font-bold shrink-0 ml-2">
                  누적 토큰: {tokenCount.toLocaleString()}
                </span>
              </div>
              {!continuationSuccess && (
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-[#4edea3] rounded-full animate-pulse w-full" />
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              {continuationSuccess ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowContinuationModal(false);
                    handleProceedToEditor();
                  }}
                  className="w-full py-3 rounded-xl bg-[#4edea3] hover:bg-[#3ec48e] text-[#002113] font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
                >
                  <span>완성본 스마트 에디터에서 확인하기</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-xs text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>완전한 문서가 될 때까지 AI가 계속 작성 중입니다...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContinuationModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
                  >
                    배경에서 계속 진행
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

