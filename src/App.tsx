/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppTab, PatentProject } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastContainer, ToastData } from './components/Toast';
import { InputWorkspace } from './components/InputWorkspace';
import { LiveGenerationPipeline } from './components/LiveGenerationPipeline';
import { SmartEditorValidation } from './components/SmartEditorValidation';
import { ExportHistory } from './components/ExportHistory';
import { DiffModal } from './components/DiffModal';
import { DrawingModal } from './components/DrawingModal';
import { ReportModal } from './components/ReportModal';
import { ConsultModal } from './components/ConsultModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('input');

  const [project, setProject] = useState<PatentProject>({
    docId: 'DOC-KR-2025-0489',
    title: '생성형 AI 기반 특허 청구항 자동 생성 및 뒷받침 실시간 검증 시스템',
    applicant: '주식회사 센서랩스',
    ipcClass: 'G06F 40/00',
    kipoScore: 98,
    version: 'v3.2',
    lastSavedText: '방금 전',
    problemPurpose:
      '종래 특허 출원서 작성 시 청구항과 명세서 본문 간의 용어 불일치로 인한 거절이유 통지(특허법 제42조 제4항 위반)가 빈번하게 발생하는 문제점을 해결하고, 청구항 간 종속 관계 및 도면부호 매핑 결함을 실시간으로 파악하여 출원 지연 비용을 최소화함.',
    techField:
      'Legaltech SaaS, 변리사 실무 보조 도구, 기업 R&D 연구원의 신규 직무발명신고서 작성 및 청구범위 시뮬레이터',
    keyComponents:
      '도면부호 자동 레지스트리 생성부(110), 실시간 선행사 매칭 엔진(120), 4-단계 순차 파이프라인(130), 클레임 트리 그래프 렌더러(140)',
    priorArt: '공개특허 10-2022-XXXXXXX (자연어 처리 기반 명세서 분석기)',
    q1Answer: '클라이언트 측 WebWorker에서 실시간 AST 파싱 수행',
    q2Selected: 'SVG 렌더링 + PlantUML 다중 지원',
    q2Custom: 'PlantUML 및 SVG 벡터 출력 동시 지원 (청구항 구조도 시각화용)',
    isClaim2Fixed: false,
    aiModel: 'Claude 3.5 Sonnet (Pro)',
    apiKey: '',
  });

  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isConsultOpen, setIsConsultOpen] = useState(false);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'download' = 'success'
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateProject = (updates: Partial<PatentProject>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };

  const handleRestoreVersion = (ver: string) => {
    if (ver === 'v2.0') {
      setProject((prev) => ({
        ...prev,
        version: 'v2.0 (복원됨)',
        isClaim2Fixed: false,
        kipoScore: 84,
      }));
      showToast('명세서가 v2.0 상태로 복원되었습니다.', 'info');
    } else if (ver === 'v1.0') {
      setProject((prev) => ({
        ...prev,
        version: 'v1.0 (복원됨)',
        isClaim2Fixed: false,
        kipoScore: 72,
      }));
      showToast('명세서가 v1.0 상태로 복원되었습니다.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#181b25] flex flex-col font-['Public_Sans'] selection:bg-[#d0e1fb] selection:text-[#0b1c30]">
      {/* Universal Header */}
      <Header
        onProfileClick={() =>
          showToast('주식회사 센서랩스 IP 전담 계정 (ilikefeeling@gmail.com)', 'info')
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 pb-20">
        {currentTab === 'input' && (
          <InputWorkspace
            project={project}
            onUpdateProject={handleUpdateProject}
            onStartPipeline={() => {
              const key = project.apiKey?.trim() || '';
              if (key.length < 10) {
                showToast('API 키가 입력되지 않았거나 올바르지 않습니다. 1번 항목에서 API 키를 입력해 주세요.', 'warning');
                return;
              }
              
              // 모델과 API 키 형식 교차 검증 (Prefix validation)
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
                showToast(`선택한 모델(${model.split(' ')[0]})과 API 키 형식이 일치하지 않습니다. (예상 접두사: ${expectedPrefix})`, 'warning');
                return;
              }

              setCurrentTab('stream');
              showToast('특허 명세서 자동 생성 파이프라인이 시작되었습니다.', 'success');
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'stream' && (
          <LiveGenerationPipeline
            onGoToEditor={() => {
              setCurrentTab('editor');
              showToast('청구항 실시간 검증 에디터로 이동했습니다.', 'info');
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'editor' && (
          <SmartEditorValidation
            project={project}
            onUpdateProject={handleUpdateProject}
            onGoToExport={() => {
              setCurrentTab('export');
              showToast('검토 완료: 공식 출원 서식 내보내기로 이동했습니다.', 'success');
            }}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenDrawing={() => setIsDrawingOpen(true)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'export' && (
          <ExportHistory
            project={project}
            onOpenDiff={() => setIsDiffOpen(true)}
            onOpenConsult={() => setIsConsultOpen(true)}
            onRestoreVersion={handleRestoreVersion}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Persistent Universal Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        claimIssueCount={project.isClaim2Fixed ? 0 : 1}
      />

      {/* Interactive Floating Modals */}
      <DiffModal isOpen={isDiffOpen} onClose={() => setIsDiffOpen(false)} />

      <DrawingModal
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onShowToast={showToast}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        project={project}
        onShowToast={showToast}
      />

      <ConsultModal
        isOpen={isConsultOpen}
        onClose={() => setIsConsultOpen(false)}
        project={project}
        onShowToast={showToast}
      />

      {/* Dynamic Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
