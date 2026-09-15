import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Check,
  Hourglass,
  Clock,
  Pause,
  Play,
  ArrowRight,
  GitFork,
} from 'lucide-react';

interface LiveGenerationPipelineProps {
  onGoToEditor: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const LiveGenerationPipeline: React.FC<LiveGenerationPipelineProps> = ({
  onGoToEditor,
  onShowToast,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progressPercent, setProgressPercent] = useState(78);
  const [elapsedSeconds, setElapsedSeconds] = useState(14.2);
  const [currentStep, setCurrentStep] = useState(3);
  const [step4Progress, setStep4Progress] = useState(0);
  const streamOutputRef = useRef<HTMLDivElement>(null);

  const baseStreamText =
    '본 발명의 일 실시예에 따른 특허 청구항 실시간 검증 시스템(100)은, 사용자 단말로부터 입력된 기초 발명 요약 정보를 수신하는 입력 인터페이스부(110); 및 상기 입력된 기초 발명 정보를 기반으로 도면부호 레지스트리를 추출하는 ';

  const extraTokens = [
    '실시간 선행사 매칭 엔진(120); ',
    '\n상기 추출된 도면부호 레지스트리와 청구항 간의 일치도를 산출하는 4-단계 순차 파이프라인부(130); 및 ',
    '\n상기 파이프라인에서 도출된 명세서 구문을 저장하는 청구범위-본문 동기화 DB(140)를 포함한다.',
    '\n\n이때, 상기 입력 인터페이스부(110)는 복수의 청구항에 등장하는 명사구를 구문 분석하여, ',
    '선행 기술과의 식별 차이를 지닌 독창적 특징 요소를 자동으로 계층 구조화하도록 구현된다.',
    '\n\n또한, 상기 실시간 선행사 매칭 엔진(120)은 Abstract Syntax Tree(AST) 구문 트리를 형성하여 ',
    '독립항 및 종속항의 문맥 의존성을 검증하며, 도면부호 100번대 내지 400번대의 부호 중복을 방지한다.',
  ];

  const [streamIndex, setStreamIndex] = useState(2);

  // Timer simulation
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Token streaming simulation (Step 3) - Optimized for Turbo Streaming
  useEffect(() => {
    if (isPaused || currentStep !== 3) return;
    const interval = setInterval(() => {
      setStreamIndex((prev) => {
        if (prev < extraTokens.length) {
          setProgressPercent((p) => {
            const nextP = Math.min(100, p + 15);
            if (nextP === 100 || prev === extraTokens.length - 1) {
              setTimeout(() => {
                setProgressPercent(100);
                setCurrentStep(4);
              }, 400);
            }
            return nextP;
          });
          return prev + 1;
        } else {
          setProgressPercent(100);
          setTimeout(() => setCurrentStep(4), 200);
        }
        return prev;
      });
    }, 150); // Speed up from 1500ms to 150ms
    return () => clearInterval(interval);
  }, [isPaused, currentStep]);

  // Step 4 progress simulation - Optimized
  useEffect(() => {
    if (isPaused || currentStep !== 4) return;
    const interval = setInterval(() => {
      setStep4Progress((prev) => {
        const next = Math.min(100, prev + 25);
        if (next === 100) {
          setTimeout(() => {
            onShowToast('도면 렌더링이 완료되었습니다.', 'success');
            setCurrentStep(5);
            setIsPaused(true);
          }, 300);
          clearInterval(interval);
        }
        return next;
      });
    }, 200); // Speed up from 1000ms to 200ms
    return () => clearInterval(interval);
  }, [isPaused, currentStep]);

  // Auto scroll stream box
  useEffect(() => {
    if (streamOutputRef.current) {
      streamOutputRef.current.scrollTop = streamOutputRef.current.scrollHeight;
    }
  }, [streamIndex]);

  const currentStreamText =
    baseStreamText + extraTokens.slice(0, streamIndex).join('');

  const togglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    if (nextState) {
      onShowToast('스트리밍이 일시정지되었습니다.', 'info');
    } else {
      onShowToast('스트리밍이 재개되었습니다.', 'success');
    }
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-8 xl:px-12 pt-4 pb-36 md:pb-12 space-y-4 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
      {/* Top Status Banner */}
      <div className="p-4 bg-[#ebedfb] rounded-xl border border-[#dfe2ef] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#131b2e] text-[#bec6e0] shrink-0">
            <RotateCcw className={`w-4 h-4 ${!isPaused ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-['IBM_Plex_Serif'] text-[17px] font-semibold text-[#181b25] truncate">
                특허 명세서 자동 생성 중
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#4edea3] text-[#002113] font-['JetBrains_Mono'] text-[10px] font-bold">
                SSE LIVE
              </span>
            </div>
            <p className="font-['Public_Sans'] text-[12px] text-[#505f76] truncate">
              KIPO 특허청 서식 표준 규격 준수 엔진 가동 중
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 bg-[#dfe2ef] px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#181b25] font-bold">
            {elapsedSeconds.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* 4-Step Pipeline Stepper */}
      <div className="bg-white p-4 rounded-xl border border-[#e5e8f5] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-['Public_Sans'] text-[11px] text-[#505f76] uppercase tracking-wider font-semibold">
            파이프라인 진행 상태
          </span>
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#4edea3] bg-[#131b2e] px-2.5 py-1 rounded-full font-bold shadow-sm">
            총 4단계 중 {Math.min(currentStep, 4)}단계 진행
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Step 1: Completed */}
          <div className="p-3 bg-[#f1f3ff] rounded-lg flex items-center justify-between border border-[#ebedfb]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#4edea3] text-[#002113] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-semibold truncate">
                  Step 1. 요약서 및 100번대 도면부호 등록
                </span>
                <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                  100% 완료 · 412자 요약 및 식별자 매핑 완료
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#181b25] font-['JetBrains_Mono'] text-[10px] font-bold border border-[#e5e8f5]">
              완료
            </span>
          </div>

          {/* Step 2: Completed */}
          <div className="p-3 bg-[#f1f3ff] rounded-lg flex items-center justify-between border border-[#ebedfb]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#4edea3] text-[#002113] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-semibold truncate">
                  Step 2. 특허청구범위 (Claims)
                </span>
                <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                  독립항 1건 + 종속항 5건 생성 완료 (선행사 검증 통과)
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#181b25] font-['JetBrains_Mono'] text-[10px] font-bold border border-[#e5e8f5]">
              완료
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
                      Step 3. KIPO 표준 서식 명세서 본문 실시간 스트리밍
                    </span>
                    <span className="font-['Public_Sans'] text-[11px] text-[#bec6e0] truncate">
                      발명을 실시하기 위한 구체적인 내용 토큰 인출 중
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
            <div className="p-3 bg-[#f1f3ff] rounded-lg flex items-center justify-between border border-[#ebedfb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#4edea3] text-[#002113] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Public_Sans'] text-[13px] text-[#181b25] font-semibold truncate">
                    Step 3. KIPO 표준 서식 명세서 본문 실시간 스트리밍
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    100% 완료 · 명세서 본문 생성 완료
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#181b25] font-['JetBrains_Mono'] text-[10px] font-bold border border-[#e5e8f5]">
                완료
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
                    Step 4. Mermaid.js 기반 도면 코드 생성
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    100% 완료 · 도면 시각화 코드 렌더링 완료
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
                      Step 4. Mermaid.js 기반 도면 코드 생성
                    </span>
                    <span className="font-['Public_Sans'] text-[11px] text-[#bec6e0] truncate">
                      도면 시각화 코드 렌더링 중...
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#4edea3] text-[#002113] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0">
                  {step4Progress}%
                </span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-[#4edea3] rounded-full transition-all duration-300 ease-out" style={{ width: `${step4Progress}%` }} />
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
                    Step 4. Mermaid.js 기반 도면 코드 생성
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76] truncate">
                    도 1, 도 2, 도 3 블록도 및 시퀀스 다이어그램 렌더링 예정
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
              🚀 380 tok/s (Turbo)
            </span>
            <span>•</span>
            <span>진행: {elapsedSeconds.toFixed(1)}s</span>
            <span>•</span>
            <span>남은 시간: 약 4s</span>
          </div>
        </div>

        {/* Legal Stream Area */}
        <div
          ref={streamOutputRef}
          className="p-4 bg-[#f1f3ff] flex flex-col gap-1 max-h-60 overflow-y-auto font-['IBM_Plex_Serif'] text-[13px] text-[#181b25] leading-relaxed border-t border-b border-[#ebedfb]"
        >
          <div className="font-bold text-[#181b25]">
            【발명을 실시하기 위한 구체적인 내용】
          </div>
          <div className="leading-relaxed whitespace-pre-wrap">
            {currentStreamText}
            <span className="inline-block w-2 h-4 bg-[#181b25] ml-0.5 animate-pulse align-middle" />
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
            onClick={onGoToEditor}
            className="w-full py-3.5 px-3 rounded-xl bg-[#131b2e] text-[#4edea3] font-['Public_Sans'] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#2c303a] transition-all active:scale-[0.98] shadow-lg border border-[#232a3d]"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>생성 완료! 스마트 에디터로 이동하여 결과 확인</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
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
                  <span>스트리밍 일시정지</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onGoToEditor}
              className="flex-1 py-3 px-3 rounded-xl bg-[#181b25] text-white font-['Public_Sans'] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2c303a] transition-all active:scale-[0.98] shadow-md"
            >
              <span>스마트 에디터로 이동</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
