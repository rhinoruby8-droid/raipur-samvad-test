import React, { useState, useEffect } from 'react';
import { PenTool, Sparkles, Plus, Trash2, Edit3, CheckCircle, BarChart3, Megaphone, Check, AlertCircle, RefreshCw, Layers, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { Article, User, CmsArticleInput, AdPlacement, AiOptimizeResult, Category } from '../types';

interface CmsStudioProps {
  currentUser: User;
  articles: Article[];
  onCreateArticle: (input: CmsArticleInput & { status?: string }) => Promise<void>;
  onUpdateArticle: (id: string, input: Partial<CmsArticleInput> & { status?: string }) => Promise<void>;
  onDeleteArticle: (id: string) => Promise<void>;
  onOptimizeWithAi: (content: string, title?: string) => Promise<AiOptimizeResult>;
  ads: AdPlacement[];
  onCreateAd: (ad: any) => Promise<void>;
  onUpdateAd: (id: string, ad: any) => Promise<void>;
  onDeleteAd: (id: string) => Promise<void>;
  onToggleAd: (id: string) => Promise<void>;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  users: User[];
  onCreateUser: (input: any) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateUserRole: (userId: string, role: string) => Promise<void>;
  onClose: () => void;
  allComments: any[];
  onDeleteComment: (commentId: string) => Promise<void>;
}


export const CmsStudio: React.FC<CmsStudioProps> = ({
  currentUser,
  articles,
  onCreateArticle,
  onUpdateArticle,
  onDeleteArticle,
  onOptimizeWithAi,
  ads,
  onCreateAd,
  onUpdateAd,
  onDeleteAd,
  onToggleAd,
  categories,
  onCreateCategory,
  onDeleteCategory,
  users,
  onCreateUser,
  onDeleteUser,
  onUpdateUserRole,
  onClose,
  allComments,
  onDeleteComment,
}) => {
  const [activeTab, setActiveTab] = useState<'ARTICLES' | 'NEW_ARTICLE' | 'COMMENTS' | 'SPONSORSHIPS' | 'CATEGORIES' | 'USERS' | 'ANALYTICS'>('ARTICLES');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [seoHeadlines, setSeoHeadlines] = useState<string[]>([]);
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED'>('PUBLISHED');

  // Dynamic Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');

  // User Manager Form State
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('password123');
  const [userRole, setUserRole] = useState<'READER' | 'JOURNALIST' | 'ADMIN'>('READER');
  const [userBio, setUserBio] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  // AI Assistant State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiOptimizeResult | null>(null);

  // Ad Form State
  const [adName, setAdName] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adBannerUrl, setAdBannerUrl] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('https://example.com/local-sponsor');
  const [adLocation, setAdLocation] = useState<'HEADER' | 'SIDEBAR' | 'IN_ARTICLE' | 'FOOTER'>('SIDEBAR');
  const [adMaxImpressions, setAdMaxImpressions] = useState('5000');

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories]);

  useEffect(() => {
    if (activeTab === 'ANALYTICS') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics/overview', {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCoverImageUrl(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle('');
    setCategory(categories.length > 0 ? categories[0].name : '');
    setCoverImageUrl('');
    setImagePreview(null);
    setContent('');
    setSeoHeadlines([]);
    setMetaDescription('');
    setTags([]);
    setStatus('PUBLISHED');
    setEditingArticleId(null);
    setAiResult(null);
  };

  const handleEditClick = (art: any) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setCategory(art.category);
    setCoverImageUrl(art.coverImageUrl || '');
    setImagePreview(art.coverImageUrl || null);
    setContent(art.content);
    setSeoHeadlines(art.seoHeadlines || []);
    setMetaDescription(art.metaDescription || '');
    setTags(art.tags || []);
    setStatus(art.status || 'DRAFT');
    setActiveTab('NEW_ARTICLE');
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    let articleStatus = status;
    if (currentUser.role === 'JOURNALIST' && status === 'PUBLISHED') {
      articleStatus = 'PENDING_REVIEW';
    }

    if (editingArticleId) {
      await onUpdateArticle(editingArticleId, {
        title,
        category,
        paywallStatus: 'FREE', // Paywall model removed
        coverImageUrl,
        content,
        seoHeadlines,
        metaDescription,
        tags,
        status: articleStatus,
      });
    } else {
      await onCreateArticle({
        title,
        category,
        paywallStatus: 'FREE', // Paywall model removed
        coverImageUrl,
        content,
        seoHeadlines,
        metaDescription,
        tags,
        status: articleStatus,
      });
    }

    resetForm();
    setActiveTab('ARTICLES');
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await onCreateCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userName || !userPassword) return;
    await onCreateUser({
      email: userEmail,
      name: userName,
      password: userPassword,
      role: userRole,
      bio: userBio || undefined,
      avatarUrl: userAvatar || undefined,
    });
    setUserEmail('');
    setUserName('');
    setUserPassword('password123');
    setUserRole('READER');
    setUserBio('');
    setUserAvatar('');
  };

  const handleRunAiAssistant = async () => {
    if (!content || content.trim().length < 10) return;
    setAiLoading(true);
    try {
      const res = await onOptimizeWithAi(content, title);
      setAiResult(res);
      setSeoHeadlines(res.seoHeadlines);
      setMetaDescription(res.metaDescription);
      setTags(res.tags);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(item => item !== t));
  };

  const handleCreateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName || !adTitle || !adTargetUrl) return;

    await onCreateAd({
      advertiserName: adName,
      title: adTitle,
      bannerUrl: adBannerUrl,
      targetUrl: adTargetUrl,
      location: adLocation,
      maxImpressions: Number(adMaxImpressions),
    });

    setAdName('');
    setAdTitle('');
    setAdBannerUrl('');
  };

  const getStatusBadgeColor = (stat: string) => {
    switch (stat) {
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-[#c3c6d6] rounded-xl shadow-lg overflow-hidden my-6">
      {/* CMS Header Bar */}
      <div className="bg-[#0f172a] text-white p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#dc2626] flex items-center justify-center shadow-md">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-playfair tracking-wide">Raipur Samvad CMS Studio</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Role Authenticated: <span className="text-rose-400 font-bold">{currentUser.name}</span> ({currentUser.role})
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Exit CMS Mode
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap scrollbar-none font-sans">
        <button
          onClick={() => setActiveTab('ARTICLES')}
          className={`px-4 py-3 text-xs font-bold shrink-0 flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
            activeTab === 'ARTICLES'
              ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Publish Queue</span>
        </button>

        <button
          onClick={() => {
            resetForm();
            setActiveTab('NEW_ARTICLE');
          }}
          className={`px-4 py-3 text-xs font-bold font-sans flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
            activeTab === 'NEW_ARTICLE'
              ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingArticleId ? 'Edit Article' : 'Draft Article'}</span>
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-3 text-xs font-bold font-sans flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
            activeTab === 'CATEGORIES'
              ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Manager</span>
        </button>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('COMMENTS')}
            className={`px-4 py-3 text-xs font-bold font-sans flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'COMMENTS'
                ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comments</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('SPONSORSHIPS')}
          className={`px-4 py-3 text-xs font-bold font-sans flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
            activeTab === 'SPONSORSHIPS'
              ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Sponsorships</span>
        </button>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-3 text-xs font-bold font-sans flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'USERS'
                ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Manager</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-3 text-xs font-bold font-sans flex items-center space-x-2 border-b-2 cursor-pointer transition-all ${
            activeTab === 'ANALYTICS'
              ? 'border-[#dc2626] text-[#dc2626] bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* TAB 1: ARTICLES MANAGEMENT */}
        {activeTab === 'ARTICLES' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold font-playfair text-slate-900">Publishing Workflow Queue</h3>
                <p className="text-xs text-slate-500">Monitor article statuses from draft to published.</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('NEW_ARTICLE');
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Story</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Title & Category</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Views</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {articles.map((art: any) => (
                    <tr key={art.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 line-clamp-1">{art.title}</div>
                        <span className="text-[10px] font-bold text-[#dc2626]">{art.category}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{art.authorName}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-wide ${getStatusBadgeColor(art.status)}`}>
                          {art.status || 'PUBLISHED'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{art.viewCount}</td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(art.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2.5">
                        <button
                          onClick={() => handleEditClick(art)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 transition-colors cursor-pointer border border-slate-200"
                          title="Edit Article"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {(currentUser.role === 'ADMIN' || currentUser.id === art.authorId) && (
                          <button
                            onClick={() => onDeleteArticle(art.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors cursor-pointer border border-rose-150"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE / EDIT ARTICLE WITH WORKFLOW & GEMINI AI */}
        {activeTab === 'NEW_ARTICLE' && (
          <form onSubmit={handleSaveArticle} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold font-playfair text-slate-900">
                  {editingArticleId ? 'Edit Article Document' : 'Draft New Investigation'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Use local file uploads for cover photos. All news is 100% free.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Article Fields */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Working Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., City Council Votes on Smart elevated corridor..."
                    className="w-full p-2.5 text-sm font-playfair font-bold rounded-lg border border-slate-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Category Desk</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Publishing Status Workflow</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-[#dc2626]"
                    >
                      <option value="DRAFT">DRAFT (Personal Sandbox)</option>
                      <option value="PENDING_REVIEW">PENDING_REVIEW (Submit to Admin)</option>
                      {currentUser.role === 'ADMIN' && (
                        <option value="PUBLISHED">PUBLISHED (Go Live)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Local Photo Upload & URL input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Cover Photo (Upload Local File or Paste URL)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUploadChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-[#dc2626] hover:file:bg-rose-100 transition-colors shrink-0"
                    />
                    <input
                      type="url"
                      value={coverImageUrl.startsWith('data:') ? '' : coverImageUrl}
                      onChange={(e) => {
                        setCoverImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="Or paste external image URL..."
                      className="flex-1 p-2.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-2.5 relative w-36 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImageUrl('');
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Article Body (Markdown or Plain Text) *</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write or paste full journalism draft here..."
                    rows={12}
                    className="w-full p-3 text-xs font-serif leading-relaxed rounded-lg border border-slate-300 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] focus:outline-none"
                    required
                  />
                </div>

                {/* Tags Management */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Topic Tags</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag (e.g. Transit)"
                      className="p-2 text-xs rounded-lg border border-slate-300 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-[#dc2626] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-[#b91c1c] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                        <span>#{t}</span>
                        <button type="button" onClick={() => handleRemoveTag(t)} className="text-rose-600 hover:font-extrabold cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: GEMINI AI COPILOT */}
              <div className="md:col-span-5 bg-rose-50/10 border border-rose-200 rounded-xl p-5 flex flex-col">
                <div className="flex items-center space-x-2 text-[#dc2626] mb-3">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h4 className="text-sm font-bold font-sans uppercase tracking-wider">Gemini SEO Copilot</h4>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-normal">
                  Send your article body to Google Gemini AI to auto-generate SEO optimized titles, an index summary, and metadata tags.
                </p>

                <button
                  type="button"
                  onClick={handleRunAiAssistant}
                  disabled={aiLoading || !content || content.trim().length < 10}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs mb-4"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini Analyzing Content...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Optimize with Gemini AI</span>
                    </>
                  )}
                </button>

                {/* AI Results Display */}
                {aiResult && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 flex-1 overflow-y-auto max-h-[400px]">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">SEO Headlines (Click to apply):</div>
                      <div className="space-y-1.5">
                        {aiResult.seoHeadlines.map((headline, idx) => (
                          <div
                            key={idx}
                            onClick={() => setTitle(headline)}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#dc2626] hover:bg-rose-50/10 text-xs font-playfair font-bold text-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <span>"{headline}"</span>
                            <Check className="w-3.5 h-3.5 text-[#dc2626] opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Meta Description (Click to apply):</div>
                      <div 
                        onClick={() => setMetaDescription(aiResult.metaDescription)}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#dc2626] text-xs font-serif text-slate-600 cursor-pointer"
                      >
                        {aiResult.metaDescription}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Suggested tags (Click to add):</div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              if (!tags.includes(t)) setTags([...tags, t]);
                            }}
                            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-[#dc2626] hover:bg-[#dc2626] hover:text-white text-[10px] font-bold text-slate-700 cursor-pointer transition-all"
                          >
                            + #{t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('ARTICLES')}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#dc2626] text-white font-bold text-xs hover:bg-[#b91c1c] cursor-pointer shadow-xs transition-colors"
              >
                {editingArticleId ? 'Save Changes' : 'Submit Draft'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: DYNAMIC CATEGORY MANAGER */}
        {activeTab === 'CATEGORIES' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-playfair text-slate-900 font-playfair">Dynamic Category Management</h3>
              <p className="text-xs text-slate-500">Create new categorizations that will immediately reflect on the home desk header navigation and composers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* List of categories */}
              <div className="md:col-span-8">
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Category Name</th>
                        <th className="p-3.5">Slug</th>
                        <th className="p-3.5">Date Created</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-950">{cat.name}</td>
                          <td className="p-3.5 font-mono text-slate-500">{cat.slug}</td>
                          <td className="p-3.5 text-slate-400">{new Date(cat.createdAt).toLocaleDateString()}</td>
                          <td className="p-3.5 text-right">
                            {currentUser.role === 'ADMIN' ? (
                              <button
                                onClick={() => onDeleteCategory(cat.id)}
                                className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Admin Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add category form */}
              <div className="md:col-span-4">
                <form onSubmit={handleCreateCategorySubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4 font-sans text-xs">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Create New Category</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Enter the name of the new section. A url-friendly slug will be automatically compiled.
                  </p>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Sports"
                      className="w-full p-2.5 rounded border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Register Category
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMMENTS MODERATION (ADMIN ONLY) */}
        {activeTab === 'COMMENTS' && currentUser.role === 'ADMIN' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-playfair text-slate-900">Comment Moderation Dashboard</h3>
              <p className="text-xs text-slate-500">Review, approve, or remove reader comments across all articles.</p>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Comment</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Article</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allComments.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No comments found.</td></tr>
                  ) : allComments.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <p className="text-slate-800 line-clamp-2">{c.content}</p>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{c.authorName}</div>
                        <span className="text-[10px] text-slate-400">{c.authorRole}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[#dc2626] font-bold line-clamp-1">{c.articleTitle || 'Unknown'}</span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteComment(c.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-150 transition-all cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SPONSORSHIPS & ADS */}
        {activeTab === 'SPONSORSHIPS' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-playfair text-slate-900">Direct Sponsorship & Click Metrics</h3>
              <p className="text-xs text-slate-500 font-sans">Enterprise ad targeting. Configure placements and monitor live CTR (Click-through rates).</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Advertiser</th>
                    <th className="p-3.5">Slot Slot</th>
                    <th className="p-3.5">Impressions</th>
                    <th className="p-3.5">Clicks</th>
                    <th className="p-3.5">CTR Rate</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ads.map((ad) => {
                    const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                    return (
                      <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{ad.advertiserName}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{ad.title}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-600 uppercase border border-slate-200">
                            {ad.location}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">{ad.impressions.toLocaleString()}</td>
                        <td className="p-3.5 font-mono text-rose-600 font-bold">{ad.clicks.toLocaleString()}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">{ctr}%</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ad.active ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            {ad.active ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => onToggleAd(ad.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${ad.active ? 'bg-amber-50 text-amber-600 border-amber-150 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-emerald-600 hover:text-white'}`}
                            title={ad.active ? 'Pause Ad' : 'Activate Ad'}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteAd(ad.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-150 transition-all cursor-pointer"
                            title="Delete Ad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Create New Ad Form */}
            <form onSubmit={handleCreateAdSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4 font-sans text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide">Register New Banner sponsorship</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Advertiser Name *</label>
                  <input
                    type="text"
                    value={adName}
                    onChange={(e) => setAdName(e.target.value)}
                    placeholder="e.g. Budha Talab Boats"
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ad Headline Title *</label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Monsoon Special tickets..."
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location Slot</label>
                  <select
                    value={adLocation}
                    onChange={(e) => setAdLocation(e.target.value as any)}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white font-bold"
                  >
                    <option value="HEADER">HEADER (Top Broad Banner)</option>
                    <option value="SIDEBAR">SIDEBAR (Right widgets)</option>
                    <option value="IN_ARTICLE">IN_ARTICLE (Reading Flow)</option>
                    <option value="FOOTER">FOOTER (Bottom Banner)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={adBannerUrl}
                    onChange={(e) => setAdBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Landing Page URL *</label>
                  <input
                    type="url"
                    value={adTargetUrl}
                    onChange={(e) => setAdTargetUrl(e.target.value)}
                    placeholder="https://budhatalab.cg.gov.in"
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Max Impressions Cap</label>
                  <input
                    type="number"
                    value={adMaxImpressions}
                    onChange={(e) => setAdMaxImpressions(e.target.value)}
                    placeholder="5000"
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
              >
                Register Sponsorship Banner
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: USER ROLE MANAGER & CRUD (ADMIN ONLY) */}
        {activeTab === 'USERS' && currentUser.role === 'ADMIN' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-playfair text-slate-900 font-playfair">User Account Management Directory</h3>
              <p className="text-xs text-slate-500">Register new staff members (Journalists/Admins) or delete reader accounts. Access controls will adapt instantly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
              {/* User list table */}
              <div className="md:col-span-8">
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">User Details</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 flex items-center space-x-3">
                            <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt={u.name} className="w-8 h-8 rounded-full border border-slate-250 object-cover" />
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{u.email}</td>
                          <td className="p-3.5">
                            {u.id === currentUser.id ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-purple-100 text-purple-800 border-purple-200">
                                {u.role} (YOU)
                              </span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => onUpdateUserRole(u.id, e.target.value)}
                                className="p-1.5 text-xs rounded-lg border border-slate-350 bg-white font-bold text-slate-800"
                              >
                                <option value="READER">READER</option>
                                <option value="JOURNALIST">JOURNALIST</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {u.id === currentUser.id ? (
                              <span className="text-[10px] text-slate-400">Active Session</span>
                            ) : (
                              <button
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-150 transition-all cursor-pointer"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add user form */}
              <div className="md:col-span-4">
                <form onSubmit={handleCreateUserSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4 text-xs font-sans">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide">Register New Newsroom User</h4>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Amitabh Sahu"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="amitabh.sahu@raipursamvad.com"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Security Password *</label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Minimum 6 characters..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">System Role *</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                    >
                      <option value="READER">READER (Standard Reader)</option>
                      <option value="JOURNALIST">JOURNALIST (Newsroom Reporter)</option>
                      <option value="ADMIN">ADMIN (Editor-in-Chief)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Avatar Image URL</label>
                    <input
                      type="url"
                      value={userAvatar}
                      onChange={(e) => setUserAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Bio / Designation</label>
                    <textarea
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      placeholder="Designation and background description..."
                      rows={3}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Register User Account
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ANALYTICS OVERVIEW */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-playfair text-slate-900">Broadsheet Performance Analytics</h3>
              <p className="text-xs text-slate-500">Live indicators compiled from database queries.</p>
            </div>

            {analyticsLoading || !analytics ? (
              <div className="py-20 text-center flex flex-col items-center justify-center font-sans">
                <RefreshCw className="w-8 h-8 text-[#dc2626] animate-spin mb-3" />
                <span className="text-xs font-bold text-slate-500">Compiling real-time statistics from sqlite tables...</span>
              </div>
            ) : (
              <div className="space-y-6 font-sans">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Story Reads</div>
                    <div className="text-2xl font-bold font-mono text-slate-950 mt-1">
                      {analytics.totalViews.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Sponsorships</div>
                    <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                      {analytics.activeAdsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total News Dispatches</div>
                    <div className="text-2xl font-bold font-mono text-slate-950 mt-1">
                      {analytics.totalArticlesCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Top Performing Stories */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-slate-900 border-b pb-2">
                    <TrendingUp className="w-4 h-4 text-[#dc2626]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Top 5 Performing Stories</h4>
                  </div>
                  <div className="overflow-hidden border border-slate-200 rounded-lg text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Rank & Article Title</th>
                          <th className="p-3">Category Desk</th>
                          <th className="p-3">Workflow State</th>
                          <th className="p-3 font-mono">View Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.topArticles.map((art: any, index: number) => (
                          <tr key={art.id} className="hover:bg-slate-50/50">
                            <td className="p-3 flex items-center space-x-3">
                              <span className="text-sm font-bold font-playfair text-slate-300">0{index + 1}</span>
                              <span className="font-bold text-slate-900 line-clamp-1">{art.title}</span>
                            </td>
                            <td className="p-3 font-semibold text-[#dc2626]">{art.category}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-wide ${getStatusBadgeColor(art.status)}`}>
                                {art.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-800 font-semibold">{art.viewCount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
