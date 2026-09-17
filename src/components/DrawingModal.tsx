import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Check,
  Edit3,
  Wand2,
  Save,
  RotateCcw,
  AlertTriangle,
  FileCode,
  Eye,
} from 'lucide-react';
import { PatentProject } from '../types';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PatentProject;
  onUpdateProject: (updates: Partial<PatentProject>) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'download') => void;
}

interface DiagramItem {
  id: string;
  name: string;
  code: string;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onShowToast,
}) => {
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');

  // Extract diagrams from project.generatedSpec
  useEffect(() => {
    if (!isOpen) return;

    const specText = project.generatedSpec || '';
    const items: DiagramItem[] = [];
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
    let match;
    let idx = 1;

    while ((match = mermaidRegex.exec(specText)) !== null) {
      items.push({
        id: `fig${idx}`,
        name: `도 ${idx}`,
        code: match[1].trim(),
      });
      idx++;
    }

    if (items.length === 0) {
      items.push(
        {
          id: 'fig1',
          name: '도 1 (시스템 구성도)',
          code: 'graph TD\n  A["사용자 단말"] -->|입력| B["입력부 (110)"]\n  B --> C["제어부 (120)"]\n  C --> D["처리부 (130)"]\n  D --> E["출력부 (140)"]',
        },
        {
          id: 'fig2',
          name: '도 2 (블록도)',
          code: 'graph LR\n  A["데이터 수집부"] --> B["전처리부"]\n  B --> C["AI 분석 엔진"]\n  C --> D["결과 생성부"]\n  D --> E["문서 출력부"]',
        },
        {
          id: 'fig3',
          name: '도 3 (동작 순서도)',
          code: 'flowchart TD\n  Start(["시작"]) --> A["사용자 데이터 수신"]\n  A --> B{"입력 유효성 검증"}\n  B -->|유효| C["AI 분석 및 매칭 수행"]\n  B -->|무효| A\n  C --> D["명세서 및 도면 생성"]\n  D --> E["최종 출력"]\n  E --> End(["종료"])',
        }
      );
    }

    setDiagrams(items);
    setSelectedIdx(0);
    setIsEditing(false);
  }, [isOpen, project.generatedSpec]);

  // Sync edit buffer when selection changes
  useEffect(() => {
    if (diagrams[selectedIdx]) {
      setEditCode(diagrams[selectedIdx].code);
    }
  }, [selectedIdx, diagrams]);

  if (!isOpen) return null;

  const currentDiag = diagrams[selectedIdx];

  // AI syntax auto-fixer
  const handleAutoFixSyntax = () => {
    if (!currentDiag) return;

    let code = editCode.trim();
    if (!code.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i)) {
      code = 'graph TD\n' + code;
    }
    // Fix unquoted bracket content that causes "Syntax error in text"
    code = code.replace(/\[\s*([^"\]\n]+?)\s*\]/g, (_, inner) => {
      const clean = inner.replace(/"/g, "'").trim();
      return `["${clean}"]`;
    });

    setEditCode(code);
    onShowToast('특수문자 및 괄호 구문 오류가 KIPO 표준 형식 ["..."]으로 자동 교정되었습니다.', 'success');
  };

  // Save changes to current diagram & update generatedSpec
  const handleSaveDiagram = () => {
    if (!currentDiag) return;

    const updated = [...diagrams];
    updated[selectedIdx] = {
      ...currentDiag,
      code: editCode,
    };
    setDiagrams(updated);
    setIsEditing(false);

    // Reconstruct generatedSpec with updated mermaid blocks
    let spec = project.generatedSpec || '';
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
    let replaceIdx = 0;
    
    if (spec.includes('```mermaid')) {
      spec = spec.replace(mermaidRegex, () => {
        const replacement = updated[replaceIdx] ? updated[replaceIdx].code : editCode;
        replaceIdx++;
        return `\`\`\`mermaid\n${replacement}\n\`\`\``;
      });
    } else {
      spec += `\n\n【도면 대용 Mermaid 코드】\n\`\`\`mermaid\n${editCode}\n\`\`\``;
    }

    onUpdateProject({ generatedSpec: spec });
    onShowToast(`${currentDiag.name} 도면이 성공적으로 수정·저장되었습니다!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b25]/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5e8f5]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#f1f3ff] border-b border-[#ebedfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#131b2e] text-[#4edea3] flex items-center justify-center font-bold">
              📐
            </div>
            <div>
              <h4 className="font-['IBM_Plex_Serif'] text-[16px] font-semibold text-[#181b25]">
                특허 도면 즉시 뷰어 & 수정기
              </h4>
              <p className="font-['Public_Sans'] text-[11px] text-[#505f76]">
                에러가 발생한 자리에서 바로 도면 코드를 수정하고 AI로 자동 교정합니다.
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

        {/* Tab switcher */}
        <div className="flex border-b border-[#ebedfb] bg-[#faf9ff] px-4 pt-2 gap-2 overflow-x-auto">
          {diagrams.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedIdx(idx);
                setIsEditing(false);
              }}
              className={`px-3 py-2 text-[12px] font-['Public_Sans'] border-b-2 font-semibold transition-all shrink-0 ${
                selectedIdx === idx
                  ? 'border-[#131b2e] text-[#131b2e]'
                  : 'border-transparent text-[#505f76] hover:text-[#181b25]'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Action Toolbar on the active diagram */}
        <div className="p-3 bg-[#ffffff] border-b border-[#e5e8f5] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isEditing
                  ? 'bg-[#131b2e] text-white shadow-sm'
                  : 'bg-[#ebedfb] text-[#181b25] hover:bg-[#dfe2ef]'
              }`}
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditing ? '미리보기 보기' : '도면 코드 직접 수정'}</span>
            </button>

            <button
              type="button"
              onClick={handleAutoFixSyntax}
              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="특수문자 및 괄호로 인한 Mermaid 11 문법 에러 자동 교정"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-600" />
              <span>AI 문법 오류 자동 교정</span>
            </button>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleSaveDiagram}
              className="px-3.5 py-1.5 rounded-lg bg-[#009668] hover:bg-[#007f57] text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>수정사항 저장 및 반영</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 bg-[#f8fafc] min-h-[300px] flex flex-col justify-center">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-[#505f76]">
                <span className="font-semibold font-['JetBrains_Mono']">Mermaid 소스 코드 편집:</span>
                <span className="text-[11px] text-amber-700">
                  Tip: 노드 이름에 괄호나 특수문자가 있다면 ["..."] 로 감싸면 에러가 방지됩니다.
                </span>
              </div>
              <textarea
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                rows={10}
                className="w-full p-3 font-['JetBrains_Mono'] text-xs bg-white border border-[#cbd5e1] rounded-xl focus:ring-2 focus:ring-[#131b2e] focus:border-transparent outline-none leading-relaxed text-[#0f172a]"
                placeholder="graph TD 또는 flowchart TD 코드를 입력하세요..."
              />
            </div>
          ) : (
            <div className="w-full bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-['IBM_Plex_Serif'] text-sm font-semibold text-slate-800">
                  {currentDiag?.name || '도면'} 소스 구조
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-['JetBrains_Mono'] text-[10px] font-bold">
                  KIPO 표준
                </span>
              </div>
              <pre className="p-3 bg-slate-50 rounded-lg text-xs font-['JetBrains_Mono'] text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-200">
                {currentDiag?.code}
              </pre>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span>✓ HTML 다운로드 시 위 코드가 고화질 벡터 그래픽으로 자동 렌더링됩니다.</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-emerald-900 underline hover:text-emerald-700"
                >
                  지금 즉시 수정하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f1f3ff] border-t border-[#ebedfb] flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#505f76]">
            KIPO 특허 도면 전산 매핑 완료
          </span>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSaveDiagram}
                className="px-4 py-1.5 rounded-lg bg-[#131b2e] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a] shadow-sm"
              >
                저장하고 닫기
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#181b25] text-white font-['Public_Sans'] text-[12px] font-semibold hover:bg-[#2c303a]"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

