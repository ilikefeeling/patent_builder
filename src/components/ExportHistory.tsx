import React, { useState } from 'react';
import {
  FileText,
  FileDown,
  Archive,
  Download,
  History,
  GitCompare,
  RotateCcw,
  CheckCircle2,
  Handshake,
  Lock,
  Send,
  Loader2,
  ExternalLink,
  FilePlus,
} from 'lucide-react';
import { PatentProject } from '../types';

interface ExportHistoryProps {
  project: PatentProject;
  onOpenDiff: () => void;
  onOpenConsult: () => void;
  onRestoreVersion: (v: string) => void;
  onResetProject: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({
  project,
  onOpenDiff,
  onOpenConsult,
  onRestoreVersion,
  onResetProject,
  onShowToast,
}) => {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownload = (fileName: string) => {
    setDownloadingFile(fileName);
    setTimeout(() => {
      setDownloadingFile(null);
      // Create actual download blob for mock files
      const blob = new Blob(
        [
          `[대한민국 특허청 KIPO 표준 서식]\n발명의 명칭: ${project.title}\n출원인: ${project.applicant}\n분류: ${project.ipcClass}\n버전: ${project.version}\n\n【특허청구범위】\n【청구항 1】 사용자의 기초 발명 데이터를 입력받는 입력부(110)...`,
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowToast(`${fileName} 파일이 안전하게 다운로드되었습니다.`, 'download');
    }, 800);
  };

  return (
    <div className="flex flex-col w-full px-4 pt-4 pb-36 space-y-4 max-w-2xl mx-auto">
      {/* Top Export Summary Card */}
      <section className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009668] animate-ping"></span>
                출원 준비 완료
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#131b2e] text-[#bec6e0] font-['JetBrains_Mono'] text-[10px] font-bold">
                PRO Unlimited
              </span>
            </div>
            <h2 className="font-['IBM_Plex_Serif'] text-[17px] font-semibold text-[#181b25] truncate">
              {project.title}
            </h2>
            <p className="font-['Public_Sans'] text-[12px] text-[#505f76]">
              출원인: {project.applicant} · 분류: {project.ipcClass}
            </p>
          </div>

          {/* Score Ring Indicator */}
          <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-xl bg-[#f1f3ff] p-1 relative border border-[#ebedfb]">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#dfe2ef]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-[#009668] stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray={`${project.kipoScore}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-['JetBrains_Mono'] text-[13px] font-bold text-[#181b25] leading-none">
                {project.kipoScore}
              </span>
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#505f76] scale-90">
                KIPO점
              </span>
            </div>
          </div>
        </div>

        {/* Micro Metadata bar */}
        <div className="mt-3 pt-2 flex items-center justify-between rounded-lg bg-[#f1f3ff] px-3 py-1.5 border border-[#ebedfb]">
          <div className="flex items-center gap-1.5 text-[#505f76]">
            <CheckCircle2 className="w-4 h-4 text-[#009668]" />
            <span className="font-['Public_Sans'] text-[12px]">
              특허청 출원 전자서식 형식 검사 완료 (워터마크 미포함)
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76] font-bold shrink-0">
            {project.version}
          </span>
        </div>
      </section>

      {/* Primary KIPO Download Cards */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-[#181b25]" />
            <h3 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
              공식 출원서식 다운로드
            </h3>
          </div>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            최종 갱신 14:28:10
          </span>
        </div>

        {/* Card 1: DOCX KIPO */}
        <div className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm space-y-2.5 transition-all hover:shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#d0e1fb] flex items-center justify-center shrink-0 text-[#0b1c30]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-['Public_Sans'] text-[14px] font-semibold text-[#181b25] truncate">
                  DOCX (KIPO 특허청 표준 서식)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold">
                  전자출원 호환
                </span>
              </div>
              <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5 leading-normal">
                대한민국 특허청 전자출원 소프트웨어(K-PION, 특허로 S/W) 필수 구분 기호인 【발명의 명칭】, 【특허청구범위】 표준 메타태그 적용 Word 파일입니다.
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
              용량: 245 KB · DOCX
            </span>
            <button
              type="button"
              disabled={downloadingFile === 'KIPO_Patent_Draft_Final.docx'}
              onClick={() => handleDownload('KIPO_Patent_Draft_Final.docx')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] transition-all active:scale-95 shadow-sm"
            >
              {downloadingFile === 'KIPO_Patent_Draft_Final.docx' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>.DOCX 다운로드</span>
            </button>
          </div>
        </div>

        {/* Card 2: PDF Official Print */}
        <div className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm space-y-2.5 transition-all hover:shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ffdad6] flex items-center justify-center shrink-0 text-[#93000a]">
              <FileDown className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-['Public_Sans'] text-[14px] font-semibold text-[#181b25] truncate">
                  PDF 정식 서면 인쇄본
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#ebedfb] text-[#505f76] font-['JetBrains_Mono'] text-[10px] font-bold">
                  A4 여백 규격 준수
                </span>
              </div>
              <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5 leading-normal">
                특허법 시행규칙 제16조 규정 서식 폰트(명조 계열 12pt, 장평 100%), 여백(좌우상하 20mm), 행간격을 100% 반영한 서명 날인용 고해상도 PDF입니다.
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
              용량: 1.2 MB · PDF/A-1b
            </span>
            <button
              type="button"
              disabled={downloadingFile === 'KIPO_Patent_Draft_Print.pdf'}
              onClick={() => handleDownload('KIPO_Patent_Draft_Print.pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] transition-all active:scale-95 shadow-sm"
            >
              {downloadingFile === 'KIPO_Patent_Draft_Print.pdf' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>.PDF 다운로드</span>
            </button>
          </div>
        </div>

        {/* Card 3: Diagram Bundle SVG/Mermaid */}
        <div className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm space-y-2.5 transition-all hover:shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ebedfb] flex items-center justify-center shrink-0 text-[#181b25]">
              <Archive className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-['Public_Sans'] text-[14px] font-semibold text-[#181b25] truncate">
                  도면 Mermaid / SVG 고해상도 번들
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#002113] text-[#4edea3] font-['JetBrains_Mono'] text-[10px] font-bold">
                  SVG + 소스코드
                </span>
              </div>
              <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5 leading-normal">
                도면부호 100~300번대 전산화 마킹이 반영된 벡터 이미지 및 특허 도면 수정용 다이어그램 원본 파일이 포함되어 있습니다.
              </p>
            </div>
          </div>

          {/* Thumbnail Previews */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Drawing 1 */}
            <div className="flex flex-col rounded-lg bg-[#f1f3ff] p-1.5 overflow-hidden border border-[#ebedfb]">
              <div className="w-full h-16 rounded bg-white flex items-center justify-center relative overflow-hidden border border-[#e5e8f5]">
                <svg className="w-full h-full p-2 text-[#181b25]" fill="none" viewBox="0 0 100 60">
                  <rect x="5" y="8" width="40" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
                  <text x="12" y="21" className="font-['JetBrains_Mono']" fontSize="7" fill="currentColor">서버[100]</text>
                  <rect x="55" y="8" width="40" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
                  <text x="60" y="21" className="font-['JetBrains_Mono']" fontSize="7" fill="currentColor">센서[120]</text>
                  <path d="M45 18 H55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                  <rect x="30" y="36" width="40" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
                  <text x="35" y="48" className="font-['JetBrains_Mono']" fontSize="7" fill="currentColor">모니터[140]</text>
                  <path d="M50 28 V36" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76] text-center mt-1 truncate">
                도 1 (시스템)
              </span>
            </div>

            {/* Drawing 2 */}
            <div className="flex flex-col rounded-lg bg-[#f1f3ff] p-1.5 overflow-hidden border border-[#ebedfb]">
              <div className="w-full h-16 rounded bg-white flex items-center justify-center relative overflow-hidden border border-[#e5e8f5]">
                <svg className="w-full h-full p-2 text-[#181b25]" fill="none" viewBox="0 0 100 60">
                  <rect x="8" y="6" width="84" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
                  <text x="25" y="16" className="font-['JetBrains_Mono']" fontSize="7" fill="currentColor">제어부 [210]</text>
                  <rect x="8" y="24" width="38" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
                  <text x="14" y="34" className="font-['JetBrains_Mono']" fontSize="6.5" fill="currentColor">압력센서[220]</text>
                  <rect x="54" y="24" width="38" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
                  <text x="60" y="34" className="font-['JetBrains_Mono']" fontSize="6.5" fill="currentColor">AI분석기[230]</text>
                  <rect x="25" y="42" width="50" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
                  <text x="32" y="51" className="font-['JetBrains_Mono']" fontSize="6.5" fill="currentColor">송수신부[240]</text>
                </svg>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76] text-center mt-1 truncate">
                도 2 (블록도)
              </span>
            </div>

            {/* Drawing 3 */}
            <div className="flex flex-col rounded-lg bg-[#f1f3ff] p-1.5 overflow-hidden border border-[#ebedfb]">
              <div className="w-full h-16 rounded bg-white flex items-center justify-center relative overflow-hidden border border-[#e5e8f5]">
                <svg className="w-full h-full p-2 text-[#181b25]" fill="none" viewBox="0 0 100 60">
                  <path d="M50 4 L75 14 L50 24 L25 14 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
                  <text x="38" y="16" className="font-['JetBrains_Mono']" fontSize="6" fill="currentColor">S310</text>
                  <line x1="50" y1="24" x2="50" y2="34" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="28" y="34" width="44" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
                  <text x="36" y="45" className="font-['JetBrains_Mono']" fontSize="6" fill="currentColor">S320</text>
                </svg>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#505f76] text-center mt-1 truncate">
                도 3 (순서도)
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
              포함: SVG 3건 + MMD 파일
            </span>
            <button
              type="button"
              disabled={downloadingFile === 'Patent_Drawings_Bundle.zip'}
              onClick={() => handleDownload('Patent_Drawings_Bundle.zip')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] transition-all active:scale-95 shadow-sm"
            >
              {downloadingFile === 'Patent_Drawings_Bundle.zip' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              <span>.ZIP 다운로드</span>
            </button>
          </div>
        </div>
      </section>

      {/* Patent Application Guide */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#181b25]" />
            <h3 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
              특허청 전자출원 가이드
            </h3>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#ebedfb] text-[#181b25] font-bold">
            본인 직접 출원(셀프 출원) 안내
          </span>
        </div>
        
        <div className="flex flex-col rounded-xl bg-[#f8f9ff] p-4 border border-[#e5e8f5] space-y-3">
          <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mb-1">
            다운로드하신 DOCX 파일을 이용해 <span className="font-semibold text-[#181b25]">출원인이 직접 특허청에 출원</span>하는 방법입니다. 변리사 대리를 원하시면 하단의 파트너 네트워크를 이용해 주세요.
          </p>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#181b25] text-white flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold shrink-0">1</div>
              <div>
                <h5 className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">최종 검토 및 도면 삽입</h5>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5 leading-relaxed">다운로드한 DOCX 파일을 MS Word로 열어 내용을 최종 점검하고, 필요한 경우 문서 하단 【도면】 섹션에 도면 이미지를 삽입하세요.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#181b25] text-white flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold shrink-0">2</div>
              <div>
                <h5 className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">특허문서작성기(KEAPS) 불러오기</h5>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5 leading-relaxed"><a href="https://patent.go.kr" target="_blank" rel="noreferrer" className="text-[#009668] hover:underline">특허로(patent.go.kr)</a>에서 제공하는 특허문서작성기를 실행한 후, 해당 DOCX 파일을 그대로 불러오면 표준 태그가 자동 인식됩니다.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#181b25] text-white flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold shrink-0">3</div>
              <div>
                <h5 className="font-['Public_Sans'] text-[13px] font-semibold text-[#181b25]">전자문서 제출 및 수수료 납부</h5>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5 leading-relaxed">문서 오류 검사를 진행한 뒤 공동인증서로 전자서명하여 제출하고 출원 수수료를 납부하면 완료됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Version History Diff & Restore */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#181b25]" />
            <h3 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
              버전 이력 및 Diff 비교
            </h3>
          </div>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            총 3개 스냅샷
          </span>
        </div>

        <div className="flex flex-col space-y-2">
          {/* Version 3 (Active) */}
          <div className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm relative pl-6 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#009668]"></div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#181b25]">
                    v3.2
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#d0e1fb] text-[#0b1c30] font-['JetBrains_Mono'] text-[10px] font-bold">
                    현재 작업본
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76]">
                    · 10분 전
                  </span>
                </div>
                <p className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium mt-1">
                  청구항 2 압력센서부 명세서 본문 뒷받침 보강 완료
                </p>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  단락 [0045] 세부 보정 완료, KIPO 기재불비 선행 제거 완료
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#009668] shrink-0" />
            </div>
          </div>

          {/* Version 2 */}
          <div className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#181b25]">
                    v2.0
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76]">
                    · 2시간 전
                  </span>
                </div>
                <p className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium mt-1">
                  보강 질문 Q1, Q2 반영 및 100번대 부호 재정렬
                </p>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  단락 [0021]~[0038] 일괄 치환 및 독립항 청구항 1 한정어구 추가
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenDiff}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[12px] font-medium hover:bg-[#dfe2ef] transition-colors"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Diff 비교</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRestoreVersion('v2.0')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[12px] font-medium hover:bg-[#ebedfb] transition-colors"
                >
                  복원
                </button>
              </div>
            </div>
          </div>

          {/* Version 1 */}
          <div className="flex flex-col rounded-xl bg-white p-4 border border-[#e5e8f5] shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#181b25]">
                    v1.0
                  </span>
                  <span className="font-['Public_Sans'] text-[11px] text-[#505f76]">
                    · 어제 18:42
                  </span>
                </div>
                <p className="font-['Public_Sans'] text-[13px] text-[#181b25] font-medium mt-1">
                  초기 기초 발명신고서 입력 및 초안 생성
                </p>
                <p className="font-['Public_Sans'] text-[12px] text-[#505f76] mt-0.5">
                  핵심 메커니즘 3건 정의 및 최초 청구항 7건 생성
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onRestoreVersion('v1.0')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#f1f3ff] text-[#181b25] font-['Public_Sans'] text-[12px] font-medium hover:bg-[#ebedfb] transition-colors"
                >
                  복원
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Legal Consultation Hand-off Banner */}
      <section className="flex flex-col rounded-xl bg-gradient-to-br from-[#131b2e] to-[#181b25] text-white p-4 shadow-lg space-y-3 border border-[#232a3d]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#4edea3]">
            <Handshake className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded-full bg-[#002113] text-[#4edea3] font-bold uppercase">
                Partner Legal Network
              </span>
            </div>
            <h4 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-white mt-1">
              특허법인/전문 변리사 원클릭 검토 의뢰
            </h4>
            <p className="font-['Public_Sans'] text-[12px] text-[#bec6e0] mt-1 leading-relaxed">
              AI 초안을 전담 변리사에게 비공개로 이관하여 전문가의 검토를 통해 등록 가능성을 높이세요. 검증 로그와 클레임 트리가 패키징되어 즉시 인계됩니다.
            </p>
          </div>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-[#bec6e0] text-[12px] font-['Public_Sans']">
            <Lock className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Zero Data Retention 및 비밀유지서약(NDA) 자동 적용</span>
          </div>

          <button
            type="button"
            onClick={onOpenConsult}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#131b2e] font-['Public_Sans'] text-[13px] font-bold hover:bg-[#ebedfb] transition-all active:scale-95 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>변리사 매칭 및 데이터 전송</span>
          </button>
        </div>
      </section>

      {/* Reset Project Button */}
      <section className="pt-2">
        <button
          type="button"
          onClick={onResetProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white border border-[#e5e8f5] text-[#181b25] font-['Public_Sans'] text-[14px] font-bold hover:bg-[#f1f3ff] hover:border-[#131b2e] transition-all shadow-sm"
        >
          <FilePlus className="w-4 h-4 text-[#505f76]" />
          <span>신규 특허 문서 작성하기</span>
        </button>
      </section>
    </div>
  );
};
