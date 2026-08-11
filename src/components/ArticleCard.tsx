import React from 'react';
import { Lock, Clock, MessageSquare } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onReadArticle: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadArticle }) => {
  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#dc2626]/50 transition-all flex flex-col justify-between h-full group">
      <div>
        {/* Card Header Image */}
        {article.coverImageUrl && (
          <div className="relative h-44 overflow-hidden border-b border-slate-200 cursor-pointer" onClick={() => onReadArticle(article)}>
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2 flex items-center space-x-1">
              <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[#dc2626] font-sans text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-xs">
                {article.category}
              </span>
              {article.paywallStatus === 'SUBSCRIBER_ONLY' && (
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-sans text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs border border-amber-400/30">
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span>Subscriber</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="text-[11px] font-sans text-slate-500 mb-1">
            {new Date(article.publishedAt).toLocaleDateString('hi-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>

          <h3 
            onClick={() => onReadArticle(article)}
            className="text-base font-bold font-serif text-slate-900 leading-snug hover:text-[#dc2626] transition-colors cursor-pointer mb-2 line-clamp-2"
          >
            {article.title}
          </h3>

          <p className="text-xs font-serif text-slate-600 leading-relaxed line-clamp-3 mb-3">
            {article.excerpt}
          </p>
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
        <div className="flex items-center space-x-2">
          {article.authorAvatar ? (
            <img src={article.authorAvatar} alt={article.authorName} className="w-5 h-5 rounded-full object-cover border border-[#dc2626]/30" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center">
              {article.authorName.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-slate-800 truncate max-w-[110px]">{article.authorName}</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>3 मिनट</span>
          </span>
          {(article.commentsCount || 0) > 0 && (
            <span className="flex items-center space-x-1 text-[#dc2626] font-bold">
              <MessageSquare className="w-3 h-3" />
              <span>{article.commentsCount}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

