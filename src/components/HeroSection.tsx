import React from 'react';
import { Clock, Eye, Lock, ArrowRight, Flame } from 'lucide-react';
import { Article } from '../types';

interface HeroSectionProps {
  article: Article;
  onReadArticle: (article: Article) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ article, onReadArticle }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 mb-8 hover:border-[#dc2626]/50 transition-all">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Cover Image */}
        <div className="lg:col-span-7 relative group overflow-hidden rounded-lg border border-slate-200">
          <img
            src={article.coverImageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200'}
            alt={article.title}
            className="w-full h-72 md:h-96 object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="px-3 py-1 rounded-md bg-[#dc2626] text-white text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-md">
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>मुख्य समाचार • {article.category}</span>
            </span>
            {article.paywallStatus === 'SUBSCRIBER_ONLY' && (
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-amber-300 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-md border border-amber-400/30">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Subscriber Exclusive</span>
              </span>
            )}
          </div>
        </div>

        {/* Lead Story Content */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full py-1">
          <div>
            <div className="flex items-center space-x-2 text-xs font-sans text-slate-500 mb-2">
              <span className="font-bold text-[#dc2626] uppercase tracking-wider">{article.category}</span>
              <span>•</span>
              <span>{new Date(article.publishedAt).toLocaleDateString('hi-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <h2 
              onClick={() => onReadArticle(article)}
              className="text-2xl md:text-3xl font-extrabold font-serif text-slate-900 leading-snug hover:text-[#dc2626] transition-colors cursor-pointer mb-3"
            >
              {article.title}
            </h2>

            <p className="text-sm font-serif text-slate-600 leading-relaxed mb-4 line-clamp-4">
              {article.excerpt}
            </p>
          </div>

          <div>
            {/* Byline */}
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-200 mb-4">
              {article.authorAvatar ? (
                <img src={article.authorAvatar} alt={article.authorName} className="w-8 h-8 rounded-full object-cover border border-[#dc2626]/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#dc2626] text-white font-bold flex items-center justify-center text-xs">
                  {article.authorName.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">{article.authorName}</div>
                <div className="text-[11px] text-slate-500 font-sans">{article.authorRole} • रायपुर संवाद रिपोर्टर</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-slate-500 font-sans">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#dc2626]" />
                  <span>4 मिनट पढ़ें</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{article.viewCount} बार देखा गया</span>
                </span>
              </div>

              <button
                onClick={() => onReadArticle(article)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white transition-colors text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>पूरी ख़बर पढ़ें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

