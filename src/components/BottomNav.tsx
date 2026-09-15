import React from 'react';
import { FileEdit, Radio, CheckSquare, History, Gavel, ExternalLink, Landmark, BookOpen } from 'lucide-react';
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
    <footer className="fixed bottom-0 left-0 right-0 w-full md:w-64 md:h-screen md:top-0 z-50 bg-[#faf9ff]/90 backdrop-blur-xl border-t md:border-t-0 md:border-r border-[#e5e8f5] shadow-[0_-1px_8px_rgba(0,0,0,0.04)] md:shadow-none flex flex-col justify-end md:justify-start">
      
      {/* Brand area for Desktop only */}
      <div className="hidden md:flex flex-col px-6 py-6 border-b border-[#ebedfb] bg-[#131b2e] text-white">
        <div className="flex items-center gap-2.5 mb-1">
          <Gavel className="w-5 h-5 text-[#4edea3]" />
          <h1 className="font-['IBM_Plex_Serif'] font-bold text-[18px] tracking-tight">
            특허초안 생성기
          </h1>
        </div>
        <span className="inline-block w-fit px-2 py-0.5 mt-1 rounded bg-white/10 text-[#dae2fd] font-['JetBrains_Mono'] text-[10px] tracking-wider uppercase font-bold">
          PRO Unlimited
        </span>
      </div>

      {/* Official Links & Disclaimer (Mobile top, Desktop bottom) */}
      <div className="md:order-last px-4 py-1.5 md:py-6 md:px-6 bg-[#f1f3ff]/95 md:bg-transparent backdrop-blur-sm border-b border-[#ebedfb] md:border-b-0 md:border-t mt-auto flex flex-col">
        
        {/* Desktop Only: Official Links */}
        <div className="hidden md:flex flex-col gap-2.5 mb-5">
          <a href="https://www.patent.go.kr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl border border-[#d2d6ea] bg-white hover:bg-[#f8f9ff] hover:border-[#b4bcd9] transition-all group shadow-sm">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#f1f3ff] text-[#131b2e]">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-['Public_Sans'] text-[12px] font-bold text-[#181b25] transition-colors flex items-center gap-1">
                특허로 (PatentRo) <ExternalLink className="w-3 h-3 text-[#505f76]" />
              </span>
              <span className="font-['JetBrains_Mono'] text-[9.5px] text-[#505f76] tracking-tight">특허청 전자출원 시스템</span>
            </div>
          </a>
          
          <a href="http://www.kipris.or.kr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl border border-[#d2d6ea] bg-white hover:bg-[#f8f9ff] hover:border-[#b4bcd9] transition-all group shadow-sm">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#f1f3ff] text-[#131b2e]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-['Public_Sans'] text-[12px] font-bold text-[#181b25] transition-colors flex items-center gap-1">
                키프리스 (KIPRIS) <ExternalLink className="w-3 h-3 text-[#505f76]" />
              </span>
              <span className="font-['JetBrains_Mono'] text-[9.5px] text-[#505f76] tracking-tight">특허정보 검색서비스</span>
            </div>
          </a>
        </div>

        <p className="font-['JetBrains_Mono'] text-[10px] md:text-[11px] text-[#505f76] leading-tight max-w-2xl mx-auto md:mx-0 break-keep text-center md:text-left">
          본 문서는 AI 기반 출원 준비용 초안이며 법적 자문이 아닙니다. 선행기술조사 및 전문 변리사 검토 후 출원하시기 바랍니다.
        </p>

        {/* Mobile Only: Simple Links */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-2.5">
          <a href="https://www.patent.go.kr" target="_blank" rel="noopener noreferrer" className="font-['Public_Sans'] text-[11px] font-bold text-[#505f76] hover:text-[#181b25] transition-colors flex items-center gap-1">
            특허로 <ExternalLink className="w-3 h-3" />
          </a>
          <a href="http://www.kipris.or.kr" target="_blank" rel="noopener noreferrer" className="font-['Public_Sans'] text-[11px] font-bold text-[#505f76] hover:text-[#181b25] transition-colors flex items-center gap-1">
            키프리스 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Nav Buttons */}
      <nav className="max-w-2xl w-full mx-auto md:max-w-none h-16 md:h-auto px-2 md:px-4 md:py-6 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start md:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col md:flex-row items-center md:justify-start min-w-[64px] min-h-[48px] md:min-h-0 md:h-12 md:px-4 rounded-lg md:rounded-xl transition-all ${
                isActive
                  ? 'text-[#181b25] font-semibold md:bg-[#181b25] md:text-white md:shadow-md'
                  : 'text-[#505f76] hover:text-[#181b25] md:hover:bg-[#f1f3ff]'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2] md:stroke-[2.0]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 md:right-auto md:-left-1 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className={`font-['Public_Sans'] text-[12px] md:text-[14px] mt-1 md:mt-0 md:ml-3 tracking-tight ${isActive ? 'md:font-bold' : 'md:font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1 rounded-full bg-[#181b25] absolute bottom-1 md:hidden" />
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
