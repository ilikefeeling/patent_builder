import React from 'react';
import { FileEdit, Radio, CheckSquare, History } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  claimIssueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  claimIssueCount = 1,
}) => {
  const tabs = [
    {
      id: 'input' as AppTab,
      label: '입력',
      icon: FileEdit,
    },
    {
      id: 'stream' as AppTab,
      label: '실시간생성',
      icon: Radio,
    },
    {
      id: 'editor' as AppTab,
      label: '에디터·검증',
      icon: CheckSquare,
      badge: claimIssueCount > 0 ? claimIssueCount : undefined,
    },
    {
      id: 'export' as AppTab,
      label: '내보내기',
      icon: History,
    },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#faf9ff]/90 backdrop-blur-xl border-t border-[#e5e8f5] shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      {/* Top Disclaimer Line */}
      <div className="px-4 py-1.5 bg-[#f1f3ff]/95 backdrop-blur-sm text-center border-b border-[#ebedfb]">
        <p className="font-['JetBrains_Mono'] text-[10px] text-[#505f76] leading-tight max-w-2xl mx-auto">
          본 문서는 AI 기반 출원 준비용 초안이며 법적 자문이 아닙니다. 선행기술조사 및 전문 변리사 검토 후 출원하시기 바랍니다. (API 키는 서버에 저장되지 않습니다)
        </p>
      </div>

      {/* Nav Buttons */}
      <nav className="max-w-2xl mx-auto h-16 px-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-lg transition-colors ${
                isActive
                  ? 'text-[#181b25] font-semibold'
                  : 'text-[#505f76] hover:text-[#181b25]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className="font-['Public_Sans'] text-[12px] mt-1 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1 rounded-full bg-[#181b25] absolute bottom-1" />
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
