/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ArticleCard } from './components/ArticleCard';
import { AdBanner } from './components/AdBanner';
import { ArticleReader } from './components/ArticleReader';
import { CmsStudio } from './components/CmsStudio';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';
import { Article, User, Role, Comment, AdPlacement, CmsArticleInput, AiOptimizeResult, Category } from './types';
import { Calendar, TrendingUp, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Active User State - Defaults to Guest Reader
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-guest-1',
    email: 'guest@raipursamvad.com',
    name: 'Guest Reader',
    role: 'READER',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString(),
  });

  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [isCmsOpen, setIsCmsOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem('rs_session_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    }
  }, []);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch Users (Admin Only)
  const fetchUsers = async () => {
    if (currentUser.role !== 'ADMIN') return;
    try {
      const res = await fetch('/api/users', {
        headers: {
          'x-user-role': currentUser.role,
        }
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Fetch Articles
  const fetchArticles = async () => {
    try {
      let url = `/api/articles?`;
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      
      const isEditorial = currentUser.role === 'ADMIN' || currentUser.role === 'JOURNALIST';
      if (isEditorial) {
        url += `includeDrafts=true&`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  // Fetch Ads
  const fetchAds = async () => {
    try {
      const res = await fetch('/api/ads');
      const data = await res.json();
      if (data.ads) {
        setAds(data.ads);
      }
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    }
  };

  // Fetch Comments
  const fetchComments = async (articleId: string) => {
    try {
      const res = await fetch(`/api/comments/${articleId}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchArticles(), fetchAds(), fetchCategories()]);
      if (currentUser.role === 'ADMIN') {
        await fetchUsers();
      }
      setLoading(false);
    };
    init();
  }, [selectedCategory, searchQuery, currentUser]);

  // Handle Authentication Logs
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('rs_session_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    const guestUser: User = {
      id: 'usr-guest-1',
      email: 'guest@raipursamvad.com',
      name: 'Guest Reader',
      role: 'READER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(guestUser);
    localStorage.removeItem('rs_session_user');
    setIsCmsOpen(false);
    setSelectedArticle(null);
  };

  // Handle Article Selection
  const handleReadArticle = async (article: Article) => {
    setSelectedArticle(article);
    await fetchComments(article.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CMS CRUD Actions
  const handleCreateArticle = async (input: CmsArticleInput & { status?: string }) => {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ ...input, authorId: currentUser.id }),
    });
    if (res.ok) {
      await fetchArticles();
    }
  };

  const handleUpdateArticle = async (id: string, input: Partial<CmsArticleInput> & { status?: string }) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      await fetchArticles();
    }
  };

  const handleDeleteArticle = async (id: string) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': currentUser.role,
      },
    });
    if (res.ok) {
      await fetchArticles();
    }
  };

  // Category Management Actions
  const handleCreateCategory = async (name: string) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      await fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': currentUser.role,
      }
    });
    if (res.ok) {
      await fetchCategories();
    }
  };

  // User Administration
  const handleCreateUser = async (userInput: any) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify(userInput)
    });
    if (res.ok) {
      await fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) return;
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': currentUser.role,
      }
    });
    if (res.ok) {
      await fetchUsers();
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      await fetchUsers();
      // If promoting self, update local session
      if (userId === currentUser.id) {
        const updatedSelf = { ...currentUser, role: role as Role };
        setCurrentUser(updatedSelf);
        localStorage.setItem('rs_session_user', JSON.stringify(updatedSelf));
      }
    }
  };

  // Gemini AI SEO Assistant Service Call
  const handleOptimizeWithAi = async (content: string, title?: string): Promise<AiOptimizeResult> => {
    const res = await fetch('/api/ai/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ content, title }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed AI optimization');
    }
    return await res.json();
  };

  // Comment Creation Action
  const handleAddComment = async (articleId: string, contentStr: string, parentId?: string | null) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({
        articleId,
        content: contentStr,
        parentId,
        userId: currentUser.id,
      }),
    });
    if (res.ok) {
      await fetchComments(articleId);
      await fetchArticles();
    }
  };

  // Sponsorship Creation Action
  const handleCreateAd = async (adData: any) => {
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify(adData),
    });
    if (res.ok) {
      await fetchAds();
    }
  };

  // Track Ad Impressions/Clicks
  const handleTrackAd = async (id: string, type: 'impression' | 'click') => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });
    } catch (err) {
      console.error('Ad tracking error:', err);
    }
  };

  const headerAd = ads.find((a) => a.location === 'HEADER');
  const sidebarAd = ads.find((a) => a.location === 'SIDEBAR');
  const inArticleAd = ads.find((a) => a.location === 'IN_ARTICLE');

  const leadArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b23] flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCms={() => {
          setIsCmsOpen(true);
          setSelectedArticle(null);
        }}
        isCmsOpen={isCmsOpen}
        onHomeClick={() => {
          setIsCmsOpen(false);
          setSelectedArticle(null);
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Top Header Sponsorship Placement */}
        {!selectedArticle && !isCmsOpen && (
          <AdBanner ad={headerAd} location="HEADER" onTrackAd={handleTrackAd} />
        )}

        {/* VIEW 1: CMS STUDIO */}
        {isCmsOpen ? (
          <CmsStudio
            currentUser={currentUser}
            articles={articles}
            onCreateArticle={handleCreateArticle}
            onUpdateArticle={handleUpdateArticle}
            onDeleteArticle={handleDeleteArticle}
            onOptimizeWithAi={handleOptimizeWithAi}
            ads={ads}
            onCreateAd={handleCreateAd}
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDeleteCategory}
            users={users}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUserRole={handleUpdateUserRole}
            onClose={() => setIsCmsOpen(false)}
          />
        ) : selectedArticle ? (
          /* VIEW 2: SINGLE ARTICLE READER */
          <ArticleReader
            article={selectedArticle}
            currentUser={currentUser}
            onBack={() => setSelectedArticle(null)}
            onOpenSubscribe={() => {}}
            comments={comments}
            onAddComment={handleAddComment}
            inArticleAd={inArticleAd}
            onTrackAd={handleTrackAd}
          />
        ) : (
          /* VIEW 3: FRONT PAGE BROADSHEET FEED */
          <div>
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-[#dc2626] animate-spin mb-3" />
                <span className="text-sm font-bold text-slate-500 font-sans">
                  Fetching latest news dispatch from Raipur Samvad newsroom...
                </span>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-16 text-center bg-white border border-slate-200 rounded-lg p-8 my-6">
                <AlertCircle className="w-10 h-10 text-[#dc2626] mx-auto mb-3" />
                <h3 className="text-xl font-bold font-playfair text-[#191b23] mb-1">No articles found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No published stories match your search query or category filter. Try clearing filters or signing in to create a story in the CMS.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div>
                {/* Hero Lead Story (Stage Layout) */}
                {leadArticle && (
                  <HeroSection article={leadArticle} onReadArticle={handleReadArticle} />
                )}

                {/* Broadsheet 3-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left & Center Main Feed (8 Columns) */}
                  <div className="lg:col-span-8">
                    <div className="flex items-center justify-between border-b-2 border-[#191b23] pb-2 mb-6">
                      <h3 className="text-xl font-extrabold font-playfair text-[#191b23]">
                        {selectedCategory === 'All' ? 'Latest Regional Coverage' : `${selectedCategory} Desk`}
                      </h3>
                      <span className="text-xs font-sans text-slate-500">{gridArticles.length + (leadArticle ? 1 : 0)} stories</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {gridArticles.map((art) => (
                        <ArticleCard key={art.id} article={art} onReadArticle={handleReadArticle} />
                      ))}
                    </div>
                  </div>

                  {/* Right Sidebar Column (4 Columns) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Sidebar Sponsor Ad */}
                    <AdBanner ad={sidebarAd} location="SIDEBAR" onTrackAd={handleTrackAd} />

                    {/* Trending Headlines Widget */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3 text-[#dc2626]">
                        <TrendingUp className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Most Read Headlines
                        </h4>
                      </div>
                      <div className="space-y-3 divide-y divide-slate-100">
                        {articles.slice(0, 4).map((art, idx) => (
                          <div
                            key={art.id}
                            onClick={() => handleReadArticle(art)}
                            className="pt-2 cursor-pointer group"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-xl font-extrabold font-playfair text-slate-200 group-hover:text-[#dc2626] transition-colors">
                                0{idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold font-playfair text-slate-900 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                                  {art.title}
                                </h5>
                                <div className="text-[10px] text-slate-400 mt-1 font-sans">
                                  {art.category} • {art.viewCount} reads
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Civic Calendar & Public Notices Widget */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-2xs">
                      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-3 text-slate-900">
                        <Calendar className="w-4 h-4 text-[#dc2626]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Local Public Calendar</h4>
                      </div>
                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="font-bold text-slate-900">City Council Public Hearing</div>
                          <div className="text-[11px] text-slate-400">Tonight at 6:30 PM • Municipal Chambers</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="font-bold text-slate-900">Riverfront Farmers Market</div>
                          <div className="text-[11px] text-slate-400">Saturday 8:00 AM • Riverfront Park</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="font-bold text-slate-900">School Board Budget Session</div>
                          <div className="text-[11px] text-slate-400">Thursday 5:00 PM • Westside High Auditorium</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
