import React, { useEffect } from 'react';

declare global {
  interface Window {
    ethicalads?: {
      load: () => void;
    };
  }
}

interface SponsorAdProps {
  publisherId?: string;
}

export const SponsorAd: React.FC<SponsorAdProps> = ({
  publisherId = 'ethical-ads', // Default official test publisher ID
}) => {
  useEffect(() => {
    // Refresh ad placement when component mounts
    if (typeof window !== 'undefined' && window.ethicalads) {
      window.ethicalads.load();
    }
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto my-6 p-4 rounded-xl border border-[#1e222d] bg-gradient-to-b from-[#11131a] to-[#0d0e14] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
          Developer Sponsor
        </span>
        <span className="text-[10px] font-mono text-stone-600">
          Privacy-friendly ad
        </span>
      </div>

      {/* EthicalAds Placement Container */}
      <div
        data-ea-publisher={publisherId}
        data-ea-type="text"
        data-ea-style="fixedfooter"
        className="dark text-xs text-stone-300 min-h-[50px] flex items-center justify-center font-sans"
      />
    </div>
  );
};
