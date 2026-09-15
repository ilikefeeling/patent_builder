import React from 'react';
import { Gavel } from 'lucide-react';

interface HeaderProps {
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full md:left-64 md:w-[calc(100%-16rem)] z-40 bg-[#faf9ff]/85 backdrop-blur-xl border-b border-[#e5e8f5] shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto h-16 px-4 md:px-8 xl:px-12 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#131b2e] text-white shrink-0 shadow-sm">
            <Gavel className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-['IBM_Plex_Serif'] font-semibold text-[17px] text-[#181b25] tracking-tight truncate">
                특허초안 생성기
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#131b2e] text-[#bec6e0] font-['JetBrains_Mono'] text-[10px] tracking-wider uppercase shrink-0 font-bold">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] shrink-0"></span>
              <span className="font-['Public_Sans'] text-[12px] text-[#505f76] truncate">
                AI 기반 스마트 센서 IoT
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onProfileClick}
            className="w-8 h-8 rounded-full ring-2 ring-[#e5e8f5] overflow-hidden hover:opacity-90 active:scale-95 transition-all focus:outline-none bg-[#dfe2ef] flex items-center justify-center"
            title="사용자 프로필"
          >
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VDAxbVbTiRYNUCxyjOjx-jHqrysuF0BsiGWQXfGm6tTbpJy5M50fyyPCfAPMp63FMx718A2qdSDNCN9i_Qxrrct19MytyBhAs75dfR3KX-xAgqHEGkdeFKVQgtS2txWwOnYzMlSpisRwabCacx-lMaRat5M_iVZr_Et5znIG10m0xNU47CfDkoHIyNylKGRckK3HuUSxUbXHJ8C3pQ1Ays06XXEto5cnMlYZNKU95lQtiDDBGDKU8E6ksI"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#505f76] absolute">IP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
