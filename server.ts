import express from 'express';
import path from 'path';
import fs from 'fs';
import { db } from './server/db.js';
import { optimizeArticleWithGemini } from './server/gemini.js';
import { Role } from './src/types.js';
import { put } from '@vercel/blob';

const app = express();

// Max payload set to 10MB to accommodate large base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configure uploads folder static middleware safely (only in writable local environments)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
  } catch (err) {
    console.warn('Could not create uploads directory:', err);
  }
}
app.use('/uploads', express.static(uploadsDir));

// Helper middleware for mock Role Authorization
const checkRole = (allowedRoles: Role[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = (req.headers['x-user-role'] as Role) || 'READER';
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: `Unauthorized: Action requires one of the following roles: ${allowedRoles.join(', ')}` });
      return;
    }
    next();
  };
};

// Helper to handle local uploads or upload to Vercel Blob CDN if token is available
const handleBase64Upload = async (coverImageUrl: string | undefined): Promise<string | undefined> => {
  if (coverImageUrl && coverImageUrl.startsWith('data:image/')) {
    try {
      const matches = coverImageUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return coverImageUrl;
      }
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `photo_${Date.now()}.${ext}`;

      // If Vercel Blob storage is connected, upload to Vercel global CDN
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: `image/${ext}`
        });
        console.log('Successfully uploaded image to Vercel Blob:', blob.url);
        return blob.url;
      } else {
        // Fallback to local files for local dev
        const filePath = path.join(process.cwd(), 'uploads', filename);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/${filename}`;
      }
    } catch (err) {
      console.error('File upload save error:', err);
      return coverImageUrl;
    }
  }
  return coverImageUrl;
};

// --- API ROUTES ---

// 1. Authentication API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.verifyUserLogin(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database connection failed. Please reload the page.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 2. Articles API
app.get('/api/articles', async (req, res) => {
  try {
    const { category, search, paywall, includeDrafts } = req.query;
    const showDrafts = includeDrafts === 'true';
    
    const articles = await db.getAllArticles(
      category as string,
      search as string,
      paywall as any,
      showDrafts
    );
    res.json({ articles });
  } catch (err: any) {
    console.error('Articles fetch error:', err);
    res.status(500).json({ error: 'Database connection failed. Please reload the page.' });
  }
});

app.get('/api/articles/:slug', async (req, res) => {
  try {
    const article = await db.getArticleBySlug(req.params.slug);
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json({ article });
  } catch (err: any) {
    console.error('Article fetch error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// CMS Route: Create Article (Admin or Journalist only)
app.post('/api/articles', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    const { title, content, category, coverImageUrl, authorId, seoHeadlines, metaDescription, tags, status } = req.body;
    
    if (!title || !content) {
      res.status(400).json({ error: 'Title and Content are required.' });
      return;
    }

    const finalCoverImageUrl = await handleBase64Upload(coverImageUrl);

    const currentUserId = authorId || (req.headers['x-user-id'] as string) || 'usr-journo-1';
    let author = await db.getUserById(currentUserId);
    if (!author) {
      author = await db.getUserById('usr-journo-1');
    }

    if (!author) {
      res.status(500).json({ error: 'Author not found.' });
      return;
    }

    const newArticle = await db.createArticle(
      {
        title,
        content,
        category: category || 'City Hall',
        paywallStatus: 'FREE', // Default paywallStatus to FREE as requested
        coverImageUrl: finalCoverImageUrl,
        seoHeadlines,
        metaDescription,
        tags,
        status: status || 'DRAFT',
      },
      author
    );

    res.status(201).json({ article: newArticle });
  } catch (err: any) {
    console.error('Article create error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// CMS Route: Update Article (Admin or Journalist only)
app.put('/api/articles/:id', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    if (req.body.coverImageUrl) {
      req.body.coverImageUrl = await handleBase64Upload(req.body.coverImageUrl);
    }
    const updated = await db.updateArticle(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json({ article: updated });
  } catch (err: any) {
    console.error('Article update error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// CMS Route: Delete Article (Admin or Journalist only)
app.delete('/api/articles/:id', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    const success = await db.deleteArticle(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Article not found or already deleted' });
      return;
    }
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err: any) {
    console.error('Article delete error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// 3. Gemini AI Optimization Route
app.post('/api/ai/optimize', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content || content.trim().length < 10) {
      res.status(400).json({ error: 'Article content must be at least 10 characters for AI optimization.' });
      return;
    }

    const result = await optimizeArticleWithGemini(content, title);
    res.json(result);
  } catch (error: any) {
    console.error('AI Optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI SEO suggestions.' });
  }
});

// 4. Threaded Comments API
app.get('/api/comments/:articleId', async (req, res) => {
  try {
    const comments = await db.getCommentsForArticle(req.params.articleId);
    res.json({ comments });
  } catch (err: any) {
    console.error('Comments fetch error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { articleId, content, parentId, userId } = req.body;
    if (!articleId || !content) {
      res.status(400).json({ error: 'Article ID and Content are required.' });
      return;
    }

    const currentUserId = userId || (req.headers['x-user-id'] as string) || 'usr-reader-1';
    let user = await db.getUserById(currentUserId);
    if (!user) {
      user = await db.getUserById('usr-reader-1');
    }

    if (!user) {
      res.status(500).json({ error: 'User not found.' });
      return;
    }

    const newComment = await db.addComment(articleId, content, user, parentId);
    res.status(201).json({ comment: newComment });
  } catch (err: any) {
    console.error('Comment create error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.get('/api/comments', checkRole(['ADMIN']), async (req, res) => {
  try {
    const comments = await db.getAllComments();
    res.json({ comments });
  } catch (err: any) {
    console.error('Comments fetch error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.delete('/api/comments/:id', checkRole(['ADMIN']), async (req, res) => {
  try {
    const success = await db.deleteComment(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Comment delete error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// 5. Sponsorships & Ad Placements API
app.get('/api/ads', async (req, res) => {
  try {
    const { location } = req.query;
    if (location) {
      res.json({ ads: await db.getAds(location as any) });
    } else {
      res.json({ ads: await db.getAllAds() });
    }
  } catch (err: any) {
    console.error('Ads fetch error:', err);
    res.status(500).json({ error: 'Database connection failed. Please reload the page.' });
  }
});

app.post('/api/ads/track', async (req, res) => {
  try {
    const { id, type } = req.body;
    if (!id || !type || !['impression', 'click'].includes(type)) {
      res.status(400).json({ error: 'Valid Ad ID and type ("impression" | "click") are required.' });
      return;
    }
    const updatedAd = await db.trackAdEvent(id, type);
    res.json({ ad: updatedAd });
  } catch (err: any) {
    console.error('Ad tracking error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.post('/api/ads', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    const { advertiserName, title, bannerUrl, targetUrl, location, maxImpressions } = req.body;
    if (!advertiserName || !title || !targetUrl) {
      res.status(400).json({ error: 'Advertiser name, title, and target URL are required.' });
      return;
    }
    const newAd = await db.createAd({
      advertiserName,
      title,
      bannerUrl,
      targetUrl,
      location: location || 'SIDEBAR',
      maxImpressions: maxImpressions ? Number(maxImpressions) : undefined,
    });
    res.status(201).json({ ad: newAd });
  } catch (err: any) {
    console.error('Ad create error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.put('/api/ads/:id', checkRole(['ADMIN']), async (req, res) => {
  try {
    const updated = await db.updateAd(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Ad not found.' });
      return;
    }
    res.json({ ad: updated });
  } catch (err: any) {
    console.error('Ad update error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.delete('/api/ads/:id', checkRole(['ADMIN']), async (req, res) => {
  try {
    const success = await db.deleteAd(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Ad not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Ad delete error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.put('/api/ads/:id/toggle', checkRole(['ADMIN']), async (req, res) => {
  try {
    const updated = await db.toggleAdActive(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Ad not found.' });
      return;
    }
    res.json({ ad: updated });
  } catch (err: any) {
    console.error('Ad toggle error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// 6. User Management API (Admin only for full CRUD)
app.get('/api/users', checkRole(['ADMIN']), async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err: any) {
    console.error('Users fetch error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.post('/api/users', checkRole(['ADMIN']), async (req, res) => {
  try {
    const { email, name, password, role, avatarUrl, bio } = req.body;
    if (!email || !name || !role) {
      res.status(400).json({ error: 'Email, Name, and Role are required.' });
      return;
    }

    const newUser = await db.createUser({ email, name, password, role, avatarUrl, bio });
    res.status(201).json({ user: newUser });
  } catch (err: any) {
    console.error('User create error:', err);
    res.status(400).json({ error: 'Failed to create user. Email may already exist or DB is connection timed out.' });
  }
});

app.delete('/api/users/:id', checkRole(['ADMIN']), async (req, res) => {
  try {
    const success = await db.deleteUser(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'User not found or failed to delete.' });
      return;
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('User delete error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.put('/api/users/role', async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      res.status(400).json({ error: 'User ID and Role are required.' });
      return;
    }
    const user = await db.updateUserRole(userId, role);
    res.json({ user });
  } catch (err: any) {
    console.error('User role update error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.put('/api/users/:id/role', checkRole(['ADMIN']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      res.status(400).json({ error: 'Role is required.' });
      return;
    }
    const user = await db.updateUserRole(req.params.id, role);
    res.json({ user });
  } catch (err: any) {
    console.error('User role update error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// 7. Dynamic Category API
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getAllCategories();
    res.json({ categories });
  } catch (err: any) {
    console.error('Categories fetch error:', err);
    res.status(500).json({ error: 'Database connection failed. Please reload the page.' });
  }
});

app.post('/api/categories', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const category = await db.createCategory(name.trim());
    res.status(201).json({ category });
  } catch (err: any) {
    console.error('Category create error:', err);
    res.status(400).json({ error: 'Category already exists or database is unreachable.' });
  }
});

app.delete('/api/categories/:id', checkRole(['ADMIN']), async (req, res) => {
  try {
    const success = await db.deleteCategory(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err: any) {
    console.error('Category delete error:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// 8. Analytics Overview API
app.get('/api/analytics/overview', checkRole(['ADMIN', 'JOURNALIST']), async (req, res) => {
  try {
    const articles = await db.getAllArticles(undefined, undefined, undefined, true);
    const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
    const topArticles = [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
    
    const ads = await db.getAllAds();
    const activeAds = ads.filter(ad => ad.active);
    
    const users = await db.getAllUsers();
    const totalSubscribers = users.filter(u => u.role === 'SUBSCRIBER').length;
    
    res.json({
      totalViews,
      topArticles,
      activeAdsCount: activeAds.length,
      totalSubscribers,
      totalArticlesCount: articles.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics overview.' });
  }
});

// --- VITE / SERVING FRONTEND (Development & Local Standalone Production only) ---
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  // Start Vite dev server in middleware mode locally (dynamic import to avoid loading rollup on Vercel)
  import('vite').then(({ createServer }) => {
    return createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }).then((vite) => {
    app.use(vite.middlewares);
  });
} else if (!process.env.VERCEL) {
  // Serve statically locally in production build
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start listener only when NOT running on Vercel Serverless environment
if (!process.env.VERCEL) {
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LocalGrid Full Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Export app for Vercel Serverless Function handler
export default app;
