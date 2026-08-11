import React, { useEffect, useRef } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { AdPlacement, AdLocation } from '../types';

interface AdBannerProps {
  ad?: AdPlacement;
  location: AdLocation;
  onTrackAd: (id: string, type: 'impression' | 'click') => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad, location, onTrackAd }) => {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (ad && !trackedRef.current) {
      trackedRef.current = true;
      onTrackAd(ad.id, 'impression');
    }
  }, [ad, onTrackAd]);

  if (!ad) {
    return (
      <div className="bg-rose-50/50 border border-dashed border-[#dc2626]/30 rounded-xl p-4 text-center my-4">
        <span className="text-xs font-sans text-slate-600 block font-medium">Local Business Sponsorship Space Available</span>
        <span className="text-[11px] text-[#dc2626] font-bold hover:underline cursor-pointer">
          Sponsor Raipur Samvad & Reach 50,000+ Readers Across Chhattisgarh →
        </span>
      </div>
    );
  }

  const handleClick = () => {
    onTrackAd(ad.id, 'click');
  };

  if (location === 'HEADER') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="text-[9px] uppercase tracking-wider font-bold bg-[#dc2626]/10 text-[#dc2626] px-2 py-0.5 rounded-md border border-[#dc2626]/20">
            प्रायोजित (Sponsor)
          </span>
          {ad.bannerUrl && (
            <img src={ad.bannerUrl} alt={ad.advertiserName} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
          )}
          <div>
            <div className="text-xs font-bold text-slate-900">{ad.advertiserName}</div>
            <div className="text-xs font-serif text-slate-600">{ad.title}</div>
          </div>
        </div>
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white transition-colors text-xs font-bold whitespace-nowrap"
        >
          <span>Visit Sponsor</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (location === 'IN_ARTICLE') {
    return (
      <div className="my-8 p-4 bg-slate-900 text-white rounded-xl shadow-sm relative border border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-amber-300 uppercase tracking-wider font-bold mb-2">
          <span className="flex items-center space-x-1">
            <Info className="w-3 h-3 text-[#dc2626]" />
            <span>Direct Community Partner</span>
          </span>
          <span>{ad.advertiserName}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {ad.bannerUrl && (
            <img src={ad.bannerUrl} alt={ad.advertiserName} className="w-full sm:w-32 h-20 object-cover rounded-lg border border-slate-700" />
          )}
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white mb-1 font-serif">{ad.title}</h4>
            <p className="text-xs text-slate-300 mb-2 font-sans">Support local independent journalism in Raipur by connecting with local partners.</p>
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="inline-flex items-center space-x-1 text-xs font-bold text-rose-300 hover:text-white transition-colors"
            >
              <span>Explore {ad.advertiserName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Default SIDEBAR or FOOTER location
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs">
      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
        <span>Sponsorship</span>
        <span className="text-[#dc2626] font-semibold">{ad.advertiserName}</span>
      </div>
      {ad.bannerUrl && (
        <img src={ad.bannerUrl} alt={ad.advertiserName} className="w-full h-32 object-cover rounded-lg mb-3 border border-slate-200" />
      )}
      <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">{ad.title}</h4>
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center space-x-1 text-xs font-bold text-[#dc2626] hover:underline mt-2"
      >
        <span>Learn More</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

