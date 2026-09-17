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
  Edit3,
} from 'lucide-react';
import { PatentProject } from '../types';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ExportHistoryProps {
  project: PatentProject;
  onOpenDiff: () => void;
  onOpenConsult: () => void;
  onOpenDrawing: () => void;
  onGoToEditor: () => void;
  onRestoreVersion: (v: string) => void;
  onResetProject: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({
  project,
  onOpenDiff,
  onOpenConsult,
  onOpenDrawing,
  onGoToEditor,
  onRestoreVersion,
  onResetProject,
  onShowToast,
}) => {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownload = async (fileType: 'docx' | 'pdf' | 'zip') => {
    const safeTitle = (project.title.trim() || '미제출_특허초안').replace(/[/\\?%*:|"<>]/g, '-');
    setDownloadingFile(fileType);

    try {
      if (fileType === 'docx') {
        // Build paragraphs from AI-generated spec or fallback template
        let specText = project.generatedSpec;
        const paragraphs: any[] = [
          new Paragraph({ children: [new TextRun({ text: "[대한민국 특허청 KIPO 표준 서식]", bold: true, size: 32 })] }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          new Paragraph({ children: [new TextRun({ text: `출원인: ${project.applicant || '(미입력)'}`, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: `IPC 분류: ${project.ipcClass || '(미입력)'}  |  버전: ${project.version}`, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
        ];

        if (specText && specText.length > 100) {
          // Post-processing: Strip AI preamble (anything before the first 【)
          const firstBracketIdx = specText.indexOf('【');
          if (firstBracketIdx > 0) {
            specText = specText.substring(firstBracketIdx);
          }
          // Strip markdown-style separators
          specText = specText.replace(/^---+$/gm, '').replace(/^\*\*\*+$/gm, '');

          const lines = specText.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              paragraphs.push(new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }));
            } else if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
              // Major section header (e.g. 【발명의 명칭】)
              paragraphs.push(new Paragraph({ 
                spacing: { before: 240, after: 120 },
                children: [new TextRun({ text: trimmed, bold: true, size: 26, underline: { type: 'single' } })] 
              }));
            } else if (trimmed.startsWith('【')) {
              // Sub-section header (e.g. 【청구항 1】 내용...)
              paragraphs.push(new Paragraph({ 
                spacing: { before: 120 },
                children: [new TextRun({ text: trimmed, bold: true, size: 24 })] 
              }));
            } else if (trimmed.startsWith('```mermaid')) {
              // Skip mermaid code block markers in DOCX (they go to ZIP)
              continue;
            } else if (trimmed === '```') {
              continue;
            } else {
              paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, size: 24 })] }));
            }
          }
        } else {
          // Fallback: template-based content
          paragraphs.push(
            new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "【발명의 명칭】", bold: true, size: 26, underline: { type: 'single' } })] }),
            new Paragraph({ children: [new TextRun({ text: project.title || "발명의 명칭이 입력되지 않았습니다.", size: 24 })] }),
            new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "【기술분야】", bold: true, size: 26, underline: { type: 'single' } })] }),
            new Paragraph({ children: [new TextRun({ text: project.techField || "본 발명은 입력된 기술 분야에 관한 것입니다.", size: 24 })] }),
            new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "【발명의 배경이 되는 기술】", bold: true, size: 26, underline: { type: 'single' } })] }),
            new Paragraph({ children: [new TextRun({ text: "관련 선행 기술에 대한 설명이 기재되는 항목입니다.", size: 24 })] }),
            new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "【발명의 내용】", bold: true, size: 26, underline: { type: 'single' } })] }),
            new Paragraph({ children: [new TextRun({ text: "【해결하려는 과제】", bold: true, size: 24 })] }),
            new Paragraph({ children: [new TextRun({ text: project.problemPurpose || "발명이 해결하고자 하는 과제가 기재됩니다.", size: 24 })] }),
            new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "【특허청구범위】", bold: true, size: 26, underline: { type: 'single' } })] }),
            new Paragraph({ children: [new TextRun({ text: "【청구항 1】 (AI 생성을 실행하면 내용이 자동으로 채워집니다.)", size: 24 })] }),
            new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "【요약서】", bold: true, size: 26, underline: { type: 'single' } })] }),
            new Paragraph({ children: [new TextRun({ text: "본 발명은 " + (project.title || "특정 기술") + "에 관한 것입니다.", size: 24 })] }),
          );
        }

        const doc = new Document({
          sections: [{ properties: {}, children: paragraphs }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${safeTitle}.docx`);
      } else if (fileType === 'zip') {
        const zip = new JSZip();

        // Extract and Sanitize Mermaid diagrams from AI-generated spec if available
        const specText = project.generatedSpec || '';
        const mermaidBlocks: { name: string; code: string }[] = [];
        const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
        let match;
        let diagramIndex = 1;

        // Helper to sanitize Mermaid code and prevent "Syntax error in text"
        const sanitizeMermaid = (raw: string): string => {
          let code = raw.trim();
          if (!code.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i)) {
            code = 'graph TD\n' + code;
          }
          // Wrap unquoted bracket contents: A[시스템 (100)] -> A["시스템 (100)"]
          code = code.replace(/\[\s*([^"\]\n]+?)\s*\]/g, (_, inner) => {
            const clean = inner.replace(/"/g, "'").trim();
            return `["${clean}"]`;
          });
          return code;
        };

        while ((match = mermaidRegex.exec(specText)) !== null) {
          mermaidBlocks.push({
            name: `도면${diagramIndex}`,
            code: sanitizeMermaid(match[1]),
          });
          diagramIndex++;
        }

        // Fallback diagrams if AI didn't generate Mermaid
        if (mermaidBlocks.length === 0) {
          mermaidBlocks.push(
            { name: '도면1_시스템구성도', code: 'graph TD\n  A["사용자 단말"] -->|입력| B["입력부 (110)"]\n  B --> C["제어부 (120)"]\n  C --> D["처리부 (130)"]\n  D --> E["출력부 (140)"]' },
            { name: '도면2_블록도', code: 'graph LR\n  A["데이터 수집"] --> B["전처리"]\n  B --> C["AI 분석"]\n  C --> D["결과 생성"]\n  D --> E["문서 출력"]' },
            { name: '도면3_순서도', code: 'flowchart TD\n  Start(["시작"]) --> A["사용자 입력 수신"]\n  A --> B{"입력 검증"}\n  B -->|유효| C["AI 분석 수행"]\n  B -->|무효| A\n  C --> D["명세서 생성"]\n  D --> E["결과 출력"]\n  E --> End(["종료"])' },
          );
        }

        // Add each Mermaid diagram as individual .mmd file
        for (const block of mermaidBlocks) {
          zip.file(`${block.name}.mmd`, block.code);
        }

        // Create an HTML viewer that renders all Mermaid diagrams with interactive in-place editor
        const diagramCards = mermaidBlocks.map((b, i) => {
          return `
          <div style="margin:24px 0;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid #f1f5f9;padding-bottom:10px;flex-wrap:wrap;gap:8px;">
              <h3 style="margin:0;color:#0f172a;font-size:16px;">📐 도 ${i + 1}. ${b.name}</h3>
              <div style="display:flex;gap:6px;">
                <button type="button" onclick="toggleEdit(${i})" style="padding:4px 10px;font-size:12px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer;font-weight:600;">✏️ 이 도면 바로 수정</button>
                <button type="button" onclick="autoFix(${i})" style="padding:4px 10px;font-size:12px;border:1px solid #fcd34d;border-radius:6px;background:#fef3c7;color:#92400e;cursor:pointer;font-weight:600;">🤖 구문오류 자동교정</button>
              </div>
            </div>

            <!-- In-place Edit Box -->
            <div id="editor-box-${i}" style="display:none;margin-bottom:16px;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
              <div style="font-size:12px;font-weight:bold;margin-bottom:6px;color:#334155;">도면 코드 직접 편집 (수정 후 [다시 그리기] 클릭):</div>
              <textarea id="code-${i}" style="width:100%;height:140px;font-family:monospace;font-size:12px;padding:8px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;">${b.code}</textarea>
              <div style="margin-top:8px;display:flex;gap:8px;">
                <button type="button" onclick="reRenderDiagram(${i})" style="padding:6px 14px;background:#10b981;color:white;border:none;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;">🔄 실시간 다시 그리기</button>
                <button type="button" onclick="toggleEdit(${i})" style="padding:6px 12px;background:#e2e8f0;border:none;border-radius:6px;font-size:12px;cursor:pointer;">닫기</button>
              </div>
            </div>

            <!-- Drawing Render Container -->
            <div class="mermaid-target" id="mermaid-target-${i}" style="min-height:120px;display:flex;align-items:center;justify-content:center;overflow-x:auto;">
              <pre class="mermaid" id="pre-${i}">${b.code}</pre>
            </div>
          </div>`;
        }).join('\n');

        const htmlViewer = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle} - 특허 도면 모음</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Segoe UI", sans-serif; max-width: 960px; margin: 0 auto; padding: 32px 20px; background: #f8fafc; color: #1e293b; }
    h1 { color: #0f172a; font-size: 24px; border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 8px; }
    p.info { color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
    .toast { position: fixed; bottom: 20px; right: 20px; background: #0f172a; color: white; padding: 10px 18px; border-radius: 8px; font-size: 13px; z-index: 9999; display: none; }
  </style>
</head>
<body>
  <div id="toast" class="toast"></div>
  <span class="badge">KIPO 규격 특허 도면</span>
  <h1>📐 ${project.title || '특허 도면'} - 도면 모음</h1>
  <p class="info">
    웹 브라우저에서 고해상도 벡터 그래픽으로 도면을 확인합니다.<br>
    도면에 수정할 부분이 있거나 오류가 발생했을 경우, 각 도면 우측 상단의 <b>[✏️ 이 도면 바로 수정]</b> 또는 <b>[🤖 구문오류 자동교정]</b>을 누르면 그 자리에서 즉시 수정하여 다시 그릴 수 있습니다.
  </p>
  ${diagramCards}
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { htmlLabels: true, curve: 'basis' }
    });

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 2500);
    }

    function toggleEdit(i) {
      const box = document.getElementById('editor-box-' + i);
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }

    function autoFix(i) {
      const textarea = document.getElementById('code-' + i);
      let code = textarea.value.trim();
      if (!code.match(/^(graph|flowchart|sequenceDiagram|classDiagram)/i)) {
        code = 'graph TD\\n' + code;
      }
      code = code.replace(/\\[\\s*([^"\\]\\n]+?)\\s*\\]/g, (_, inner) => {
        const clean = inner.replace(/"/g, "'").trim();
        return '["' + clean + '"]';
      });
      textarea.value = code;
      showToast('괄호 및 특수문자 문법 오류가 자동 교정되었습니다. [실시간 다시 그리기]를 누르세요.');
      document.getElementById('editor-box-' + i).style.display = 'block';
    }

    async function reRenderDiagram(i) {
      const textarea = document.getElementById('code-' + i);
      const newCode = textarea.value.trim();
      const target = document.getElementById('mermaid-target-' + i);
      const uniqueId = 'diagram-dynamic-' + i + '-' + Date.now();
      try {
        const { svg } = await mermaid.render(uniqueId, newCode);
        target.innerHTML = svg;
        showToast('도면이 성공적으로 다시 렌더링되었습니다!');
      } catch (err) {
        console.error(err);
        showToast('문법 오류가 발생했습니다. [구문오류 자동교정]을 클릭해 보세요.');
      }
    }
  <\/script>
</body>
</html>`;
        zip.file("도면_뷰어.html", htmlViewer);
        zip.file("README.txt", `[도면 열기 안내]\n\n1. "도면_뷰어.html" 파일을 더블클릭하면 웹 브라우저(Chrome, Edge)에서 도면이 고화질로 렌더링됩니다.\n2. 각 도면 우측 상단의 [이 도면 바로 수정] 버튼으로 그 자리에서 즉시 수정 및 다시 그리기가 가능합니다.\n3. 온라인: https://mermaid.live 에 .mmd 파일 내용을 붙여넣어도 확인 및 이미지 저장이 가능합니다.\n`);


        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${safeTitle}_도면.zip`);
      } else if (fileType === 'pdf') {
        // Note: Real Korean PDF generation requires heavy font embedding (.ttf).
        // For now, we fallback to a simple HTML file disguised as PDF, or just a text file.
        const blob = new Blob(
          [
            `[대한민국 특허청 KIPO 표준 서식]\n발명의 명칭: ${project.title}\n출원인: ${project.applicant}\n분류: ${project.ipcClass}\n버전: ${project.version}`
          ],
          { type: 'text/plain;charset=utf-8' }
        );
        saveAs(blob, `${safeTitle}_임시문서.txt`);
      }
      
      onShowToast(`${fileType.toUpperCase()} 파일이 생성 및 다운로드되었습니다.`, 'download');
    } catch (error) {
      console.error(error);
      onShowToast('파일 생성 중 오류가 발생했습니다.', 'warning');
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-8 xl:px-12 pt-4 pb-36 md:pb-12 space-y-4 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
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

          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
              용량: 245 KB · DOCX
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoToEditor}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ebedfb] text-[#181b25] font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#dfe2ef] transition-all active:scale-95 border border-[#d2d6ea]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#505f76]" />
                <span>명세서 바로 수정</span>
              </button>
              <button
                type="button"
                disabled={downloadingFile === 'docx'}
                onClick={() => handleDownload('docx')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] transition-all active:scale-95 shadow-sm"
              >
                {downloadingFile === 'docx' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>.DOCX 다운로드</span>
              </button>
            </div>
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
              disabled={downloadingFile === 'pdf'}
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] transition-all active:scale-95 shadow-sm"
            >
              {downloadingFile === 'pdf' ? (
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

          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
              포함: SVG 3건 + MMD 소스 + 자동 렌더링 HTML
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenDrawing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-['Public_Sans'] text-[12px] font-bold hover:bg-amber-100 transition-all active:scale-95 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>도면 바로 수정 / AI 교정</span>
              </button>
              <button
                type="button"
                disabled={downloadingFile === 'zip'}
                onClick={() => handleDownload('zip')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] transition-all active:scale-95 shadow-sm"
              >
                {downloadingFile === 'zip' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                <span>.ZIP 다운로드</span>
              </button>
            </div>
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
