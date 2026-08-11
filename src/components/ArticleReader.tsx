import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Eye, Share2, Bookmark, Lock, Sparkles, MessageSquare, Send, Check, X, Copy, Mail, Link as LinkIcon, ExternalLink, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Article, User, Comment, AdPlacement } from '../types';
import { AdBanner } from './AdBanner';

interface ArticleReaderProps {
  article: Article;
  currentUser: User;
  onBack: () => void;
  onOpenSubscribe: () => void;
  comments: Comment[];
  onAddComment: (articleId: string, content: string, parentId?: string | null) => void;
  inArticleAd?: AdPlacement;
  onTrackAd: (id: string, type: 'impression' | 'click') => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  currentUser,
  onBack,
  onOpenSubscribe,
  comments,
  onAddComment,
  inArticleAd,
  onTrackAd,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Calculate reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      } else {
        setScrollProgress(0);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const hasAccess =
    article.paywallStatus === 'FREE' ||
    currentUser.role === 'SUBSCRIBER' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'JOURNALIST';

  const paragraphs = article.content.split('\n\n');
  const previewParagraphs = paragraphs.slice(0, 2);
  const remainingParagraphs = paragraphs.slice(2);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/article/${article.slug}`
    : `https://raipur-samvad.vercel.app/article/${article.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Native share dismissed', err);
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(article.id, commentText);
    setCommentText('');
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyText.trim()) return;
    onAddComment(article.id, replyText, parentId);
    setReplyText('');
    setReplyToId(null);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-16">
      {/* Fixed Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-[#e1e2ec]/60 z-50 backdrop-blur-2xs">
        <div
          className="h-full bg-gradient-to-r from-[#0056d2] via-[#0040a1] to-[#2563eb] transition-all duration-75 ease-out rounded-r-full shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button & Breadcrumb */}
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[#0056d2] hover:text-[#0040a1] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Front Page</span>
        </button>

        {/* Article Header */}
        <div className="mb-6 border-b border-[#c3c6d6] pb-6">
          <div className="flex items-center space-x-2 text-xs font-sans text-[#737785] mb-2">
            <span className="px-2 py-0.5 rounded bg-[#0056d2] text-white font-bold uppercase tracking-wider">
              {article.category}
            </span>
            <span>•</span>
            <span>Published {new Date(article.publishedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-playfair text-[#191b23] leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg font-serif text-[#424654] leading-relaxed mb-6 font-medium italic">
            {article.excerpt}
          </p>

          {/* Author Byline & Utility Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-[#e1e2ec]">
            <div className="flex items-center space-x-3">
              {article.authorAvatar ? (
                <img src={article.authorAvatar} alt={article.authorName} className="w-10 h-10 rounded-full object-cover border border-[#c3c6d6]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0056d2] text-white font-bold flex items-center justify-center text-sm">
                  {article.authorName.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-[#191b23] flex items-center space-x-2">
                  <span>{article.authorName}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#e7e7f2] text-[#0056d2] font-sans font-semibold">
                    {article.authorRole}
                  </span>
                </div>
                <div className="text-xs text-[#737785]">LocalGrid Beat Reporter</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center space-x-3 text-xs text-[#737785]">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-[#0056d2]" />
                <span>4 min read</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{article.viewCount} views</span>
              </span>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#f2f3fe] border border-[#c3c6d6] hover:border-[#0056d2] hover:bg-[#e7e7f2] text-[#191b23] font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#0056d2]" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Cover Image */}
        {article.coverImageUrl && (
          <div className="mb-8 rounded-md overflow-hidden border border-[#c3c6d6]">
            <img src={article.coverImageUrl} alt={article.title} className="w-full h-52 sm:h-80 md:h-[420px] object-cover" />
            <div className="bg-[#f2f3fe] p-2 text-[11px] font-sans text-[#737785] italic text-center border-t border-[#e1e2ec]">
              LocalGrid Photography • Archived Coverage for {article.category}
            </div>
          </div>
        )}

        {/* Article Body Content */}
        <div className="prose prose-lg max-w-none text-[#191b23] font-serif leading-relaxed text-lg space-y-6">
          {previewParagraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}

          {/* Embedded Sponsor Ad */}
          <AdBanner ad={inArticleAd} location="IN_ARTICLE" onTrackAd={onTrackAd} />

          {/* Full Content OR Paywall Gate */}
          {hasAccess ? (
            remainingParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))
          ) : (
            <div className="relative mt-6">
              {/* Fade Out Effect */}
              <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-[#faf8ff] to-transparent pointer-events-none" />

              {/* Paywall CTA Card */}
              <div className="bg-white border-2 border-[#a93802] rounded-lg p-8 text-center shadow-lg relative z-10 my-8">
                <div className="w-12 h-12 rounded-full bg-[#ffdbcf] text-[#822800] flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>

                <h3 className="text-2xl font-bold font-playfair text-[#191b23] mb-2">
                  This In-Depth Investigation is Reserved for Subscribers
                </h3>

                <p className="text-sm font-sans text-[#424654] max-w-lg mx-auto mb-6">
                  LocalGrid relies on reader support to keep local beat reporters in city hall hearings and investigative desks.
                  Unlock unlimited access to all stories for just $4/month.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onOpenSubscribe}
                    className="w-full sm:w-auto px-6 py-3 rounded bg-[#a93802] text-white font-sans font-bold hover:bg-[#822800] transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Become a Civic Subscriber ($4/mo)</span>
                  </button>

                  <button
                    onClick={() => onOpenSubscribe()}
                    className="w-full sm:w-auto px-6 py-3 rounded bg-[#f2f3fe] border border-[#c3c6d6] text-[#191b23] font-sans font-semibold hover:border-[#0056d2] transition-colors cursor-pointer"
                  >
                    View Subscription Plans
                  </button>
                </div>

                <div className="mt-4 text-xs font-sans text-[#737785]">
                  Already a subscriber? Switch your role pill in the top header to test Instant Subscriber View.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-4 border-t border-[#c3c6d6] flex flex-wrap items-center gap-2">
            <span className="text-xs font-sans font-bold text-[#737785] uppercase tracking-wider mr-1">Filed Under:</span>
            {article.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-[#f2f3fe] border border-[#c3c6d6] text-[#0056d2] text-xs font-sans font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Threaded Discussion Section */}
        <div className="mt-12 pt-8 border-t-2 border-[#191b23]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold font-playfair text-[#191b23] flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-[#0056d2]" />
              <span>Community Discussion ({comments.length})</span>
            </h3>
            <span className="text-xs text-[#737785] font-sans">Civil conversation standards strictly enforced</span>
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleCommentSubmit} className="bg-white border border-[#c3c6d6] rounded-md p-4 mb-8 shadow-2xs">
            <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-[#191b23]">
              <span>Comment as {currentUser.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-[#0056d2] text-white text-[10px] uppercase font-mono">
                {currentUser.role}
              </span>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your insight or ask a question regarding this story..."
              rows={3}
              className="w-full p-3 text-xs font-sans rounded border border-[#c3c6d6] focus:outline-none focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] mb-3"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex items-center space-x-1.5 px-4 py-2 rounded bg-[#0056d2] text-white font-sans font-semibold text-xs hover:bg-[#0040a1] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </div>
          </form>

          {/* Comment Tree */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 bg-white border border-dashed border-[#c3c6d6] rounded-md text-xs text-[#737785]">
                No comments yet. Be the first neighbor to join the discussion!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-white border border-[#c3c6d6] rounded-md p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {comment.authorAvatar ? (
                        <img src={comment.authorAvatar} alt={comment.authorName} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#0056d2] text-white font-bold text-[10px] flex items-center justify-center">
                          {comment.authorName.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-[#191b23]">{comment.authorName}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#f2f3fe] border border-[#c3c6d6] text-[#0056d2]">
                        {comment.authorRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#737785]">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-sans text-[#424654] leading-relaxed mb-3">{comment.content}</p>

                  <button
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="text-[11px] font-bold text-[#0056d2] hover:underline cursor-pointer"
                  >
                    Reply
                  </button>

                  {/* Inline Reply Form */}
                  {replyToId === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-[#0056d2]">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.authorName}...`}
                        rows={2}
                        className="w-full p-2 text-xs rounded border border-[#c3c6d6] focus:outline-none focus:border-[#0056d2] mb-2"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="px-3 py-1 bg-[#0056d2] text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Submit Reply
                        </button>
                        <button
                          onClick={() => setReplyToId(null)}
                          className="px-3 py-1 bg-[#f2f3fe] text-[#424654] rounded text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Threaded Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-[#e1e2ec] space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-[#f2f3fe] p-3 rounded border border-[#e1e2ec]">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-bold text-[#191b23]">{reply.authorName}</span>
                            <span className="text-[9px] uppercase font-bold px-1 rounded bg-white text-[#0056d2]">
                              {reply.authorRole}
                            </span>
                          </div>
                          <p className="text-xs font-sans text-[#424654]">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#c3c6d6] rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e1e2ec] pb-4 mb-4">
              <div className="flex items-center space-x-2 text-[#0056d2]">
                <Share2 className="w-5 h-5" />
                <h3 className="text-lg font-bold font-playfair text-[#191b23]">Share Story</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded bg-[#f2f3fe] hover:bg-[#e7e7f2] text-[#737785] hover:text-[#191b23] transition-colors cursor-pointer"
                title="Close Share Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Article Preview Card */}
            <div className="bg-[#faf8ff] border border-[#e1e2ec] rounded-lg p-3.5 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0056d2] font-sans">
                {article.category}
              </span>
              <h4 className="text-sm font-bold font-playfair text-[#191b23] line-clamp-2 my-1 leading-snug">
                {article.title}
              </h4>
              <p className="text-xs font-serif text-[#737785] line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            {/* Social Sharing Grid */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#424654] uppercase tracking-wider mb-3">
                Share directly via
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('*' + article.title + '*\n' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg border border-[#c3c6d6] bg-white hover:bg-[#e7fce9] hover:border-[#25D366] text-[#191b23] transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold font-sans">WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg border border-[#c3c6d6] bg-white hover:bg-[#f2f3fe] hover:border-[#1DA1F2] text-[#191b23] transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center group-hover:bg-[#1DA1F2] group-hover:text-white transition-colors">
                    <Twitter className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-bold font-sans">Twitter / X</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg border border-[#c3c6d6] bg-white hover:bg-[#f2f3fe] hover:border-[#1877F2] text-[#191b23] transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                    <Facebook className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-bold font-sans">Facebook</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg border border-[#c3c6d6] bg-white hover:bg-[#f2f3fe] hover:border-[#0A66C2] text-[#191b23] transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center group-hover:bg-[#0A66C2] group-hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-bold font-sans">LinkedIn</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent('Read on LocalGrid: ' + article.title)}&body=${encodeURIComponent(article.excerpt + '\n\nRead full story: ' + shareUrl)}`}
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg border border-[#c3c6d6] bg-white hover:bg-[#f2f3fe] hover:border-[#EA4335] text-[#191b23] transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center group-hover:bg-[#EA4335] group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold font-sans">Email Story</span>
                </a>
              </div>
            </div>

            {/* Native Web Share API if supported */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-full mb-4 py-2 px-3 rounded-lg bg-[#f2f3fe] hover:bg-[#e7e7f2] border border-[#c3c6d6] text-[#0056d2] font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Share via System Share Sheet</span>
              </button>
            )}

            {/* Copy Article Link Box */}
            <div>
              <label className="block text-xs font-bold text-[#424654] uppercase tracking-wider mb-2">
                Article Permalink
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#c3c6d6] bg-[#f2f3fe] text-[#424654] font-mono select-all focus:outline-none"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-[#737785] absolute left-2.5 top-2.5" />
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-sans font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs ${
                    copied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#0056d2] hover:bg-[#0040a1] text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
