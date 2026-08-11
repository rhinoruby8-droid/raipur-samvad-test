import { PrismaClient } from '@prisma/client';
import { Article, User, Comment, AdPlacement, CmsArticleInput, Role, PaywallStatus, AdLocation } from '../src/types.js';

const prisma = new PrismaClient();

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

class DatabaseStore {
  // Helper to serialize array fields
  private serializeJson(arr?: string[]): string {
    return arr ? JSON.stringify(arr) : '[]';
  }

  // Helper to deserialize array fields
  private deserializeJson(str?: string | null): string[] {
    try {
      return str ? JSON.parse(str) : [];
    } catch {
      return [];
    }
  }

  // Helper to map Prisma User to Application User
  private mapUser(u: any): User {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as Role,
      avatarUrl: u.avatarUrl || undefined,
      bio: u.bio || undefined,
      createdAt: u.createdAt.toISOString(),
    };
  }

  // Helper to map Prisma Article to Application Article
  private mapArticle(a: any): Article {
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      content: a.content,
      excerpt: a.excerpt || '',
      category: a.category,
      paywallStatus: a.paywallStatus as PaywallStatus,
      coverImageUrl: a.coverImageUrl || undefined,
      viewCount: a.viewCount,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt.toISOString(),
      authorId: a.authorId,
      authorName: a.author?.name || 'Unknown',
      authorRole: (a.author?.role as Role) || 'READER',
      authorAvatar: a.author?.avatarUrl || undefined,
      seoHeadlines: this.deserializeJson(a.seoHeadlines),
      metaDescription: a.metaDescription || '',
      tags: this.deserializeJson(a.tags),
      commentsCount: a._count?.comments ?? undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  // --- Article CRUD Methods ---
  async getAllArticles(category?: string, search?: string, paywallFilter?: PaywallStatus, includeDrafts = true): Promise<Article[]> {
    const where: any = {};
    
    // Ensure existing DB articles with non-PUBLISHED status are also auto-updated to PUBLISHED
    try {
      await prisma.article.updateMany({
        where: { status: { not: 'PUBLISHED' } },
        data: { status: 'PUBLISHED', isPublished: true }
      });
    } catch (e) {
      // Ignore if updateMany fails on read-only transactions
    }
    
    if (category && category !== 'All') {
      where.category = category;
    }
    
    if (paywallFilter) {
      where.paywallStatus = paywallFilter;
    }
    
    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { excerpt: { contains: q } },
        { tags: { contains: q } }
      ];
    }

    const list = await prisma.article.findMany({
      where,
      include: {
        author: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return list.map(a => this.mapArticle(a));
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    if (article) {
      // Increment view count
      await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } }
      });
      article.viewCount += 1;
      return this.mapArticle(article);
    }
    return undefined;
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        _count: {
          select: { comments: true }
        }
      }
    });
    return article ? this.mapArticle(article) : undefined;
  }

  async createArticle(input: CmsArticleInput & { status?: string }, author: User): Promise<Article> {
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const excerpt = input.content.slice(0, 180).replace(/\n/g, ' ') + '...';
    
    const newArt = await prisma.article.create({
      data: {
        title: input.title,
        slug,
        content: input.content,
        excerpt,
        category: input.category || 'City Hall',
        paywallStatus: 'FREE', // Default to FREE as paywalls are removed
        coverImageUrl: input.coverImageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
        viewCount: 0,
        status: input.status || 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
        authorId: author.id,
        seoHeadlines: this.serializeJson(input.seoHeadlines),
        metaDescription: input.metaDescription || '',
        tags: this.serializeJson(input.tags),
      },
      include: {
        author: true,
      }
    });

    return this.mapArticle(newArt);
  }

  async updateArticle(id: string, input: Partial<CmsArticleInput> & { status?: string }): Promise<Article | undefined> {
    const data: any = { ...input };
    
    if (input.title) {
      data.slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    if (input.content) {
      data.excerpt = input.content.slice(0, 180).replace(/\n/g, ' ') + '...';
    }
    
    if (input.seoHeadlines) {
      data.seoHeadlines = this.serializeJson(input.seoHeadlines);
    }
    
    if (input.tags) {
      data.tags = this.serializeJson(input.tags);
    }

    if (input.status) {
      data.status = input.status;
      data.isPublished = input.status === 'PUBLISHED';
    }

    // Clean CmsArticleInput properties that aren't database fields
    delete data.authorId;

    try {
      const updated = await prisma.article.update({
        where: { id },
        data,
        include: {
          author: true,
          _count: {
            select: { comments: true }
          }
        }
      });
      return this.mapArticle(updated);
    } catch {
      return undefined;
    }
  }

  async deleteArticle(id: string): Promise<boolean> {
    try {
      await prisma.comment.deleteMany({ where: { articleId: id } });
      await prisma.article.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Comments Methods ---
  async getCommentsForArticle(articleId: string): Promise<Comment[]> {
    const list = await prisma.comment.findMany({
      where: { articleId },
      include: { author: true }
    });

    // Group into threaded parent-child structure
    const parentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    list.forEach(c => {
      parentMap.set(c.id, {
        id: c.id,
        content: c.content,
        articleId: c.articleId,
        authorId: c.authorId,
        authorName: c.author.name,
        authorRole: c.author.role as Role,
        authorAvatar: c.author.avatarUrl || undefined,
        parentId: c.parentId,
        createdAt: c.createdAt.toISOString(),
        replies: []
      });
    });

    list.forEach(c => {
      const mapped = parentMap.get(c.id)!;
      if (c.parentId && parentMap.has(c.parentId)) {
        parentMap.get(c.parentId)!.replies!.push(mapped);
      } else {
        rootComments.push(mapped);
      }
    });

    return rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async addComment(articleId: string, content: string, user: User, parentId?: string | null): Promise<Comment> {
    const newComment = await prisma.comment.create({
      data: {
        content,
        articleId,
        authorId: user.id,
        parentId: parentId || null
      },
      include: {
        author: true
      }
    });

    return {
      id: newComment.id,
      content: newComment.content,
      articleId: newComment.articleId,
      authorId: newComment.authorId,
      authorName: newComment.author.name,
      authorRole: newComment.author.role as Role,
      authorAvatar: newComment.author.avatarUrl || undefined,
      parentId: newComment.parentId,
      createdAt: newComment.createdAt.toISOString(),
      replies: []
    };
  }

  // --- Ad Placements Methods ---
  async getAds(location?: AdLocation): Promise<AdPlacement[]> {
    const where: any = { active: true };
    if (location) {
      where.location = location;
    }
    const list = await prisma.adPlacement.findMany({ where });
    return list.map(ad => ({
      ...ad,
      location: ad.location as AdLocation,
      bannerUrl: ad.bannerUrl || undefined,
      maxImpressions: ad.maxImpressions || undefined,
      startDate: ad.startDate.toISOString(),
      endDate: ad.endDate?.toISOString() || undefined
    }));
  }

  async getAllAds(): Promise<AdPlacement[]> {
    const list = await prisma.adPlacement.findMany();
    return list.map(ad => ({
      ...ad,
      location: ad.location as AdLocation,
      bannerUrl: ad.bannerUrl || undefined,
      maxImpressions: ad.maxImpressions || undefined,
      startDate: ad.startDate.toISOString(),
      endDate: ad.endDate?.toISOString() || undefined
    }));
  }

  async trackAdEvent(id: string, type: 'impression' | 'click'): Promise<AdPlacement | undefined> {
    const data: any = {};
    if (type === 'impression') {
      data.impressions = { increment: 1 };
    } else if (type === 'click') {
      data.clicks = { increment: 1 };
    }

    try {
      const updated = await prisma.adPlacement.update({
        where: { id },
        data
      });
      return {
        ...updated,
        location: updated.location as AdLocation,
        bannerUrl: updated.bannerUrl || undefined,
        maxImpressions: updated.maxImpressions || undefined,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || undefined
      };
    } catch {
      return undefined;
    }
  }

  async createAd(ad: Omit<AdPlacement, 'id' | 'impressions' | 'clicks' | 'active'>): Promise<AdPlacement> {
    const newAd = await prisma.adPlacement.create({
      data: {
        advertiserName: ad.advertiserName,
        title: ad.title,
        bannerUrl: ad.bannerUrl,
        targetUrl: ad.targetUrl,
        location: ad.location,
        active: true,
        impressions: 0,
        clicks: 0,
        maxImpressions: ad.maxImpressions,
      }
    });

    return {
      ...newAd,
      location: newAd.location as AdLocation,
      bannerUrl: newAd.bannerUrl || undefined,
      maxImpressions: newAd.maxImpressions || undefined,
      startDate: newAd.startDate.toISOString(),
      endDate: newAd.endDate?.toISOString() || undefined
    };
  }

  // --- Users CRUD Methods ---
  async getUserById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? this.mapUser(user) : undefined;
  }

  async verifyUserLogin(email: string, passwordSecret: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password === passwordSecret) {
      return this.mapUser(user);
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const list = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return list.map(u => this.mapUser(u));
  }

  async createUser(input: Omit<User, 'id' | 'createdAt'> & { password?: string }): Promise<User> {
    const created = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        avatarUrl: input.avatarUrl || null,
        bio: input.bio || null,
        password: input.password || 'password123',
      }
    });
    return this.mapUser(created);
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Clean up relations first to avoid foreign key violations
      await prisma.comment.deleteMany({ where: { authorId: userId } });
      
      // Delete articles written by the user
      const userArticles = await prisma.article.findMany({ where: { authorId: userId } });
      for (const art of userArticles) {
        await this.deleteArticle(art.id);
      }

      await prisma.user.delete({ where: { id: userId } });
      return true;
    } catch (err) {
      console.error('Failed to delete user:', err);
      return false;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });
      return this.mapUser(updated);
    } catch {
      return undefined;
    }
  }

  // --- Category Methods ---
  async getAllCategories(): Promise<Category[]> {
    const list = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return list.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      createdAt: c.createdAt.toISOString()
    }));
  }

  async createCategory(name: string): Promise<Category> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const created = await prisma.category.create({
      data: { name, slug }
    });
    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      createdAt: created.createdAt.toISOString()
    };
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await prisma.category.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Comment Management Methods ---
  async getAllComments(): Promise<(Comment & { articleTitle: string })[]> {
    const list = await prisma.comment.findMany({
      include: {
        author: true,
        article: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return list.map(c => ({
      id: c.id,
      content: c.content,
      articleId: c.articleId,
      authorId: c.authorId,
      authorName: c.author.name,
      authorRole: c.author.role as any,
      authorAvatar: c.author.avatarUrl || undefined,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      articleTitle: c.article.title
    }));
  }

  async deleteComment(id: string): Promise<boolean> {
    try {
      await prisma.comment.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Ad Management Methods ---
  async updateAd(id: string, data: Partial<AdPlacement>): Promise<AdPlacement | undefined> {
    try {
      const updated = await prisma.adPlacement.update({
        where: { id },
        data: {
          advertiserName: data.advertiserName,
          title: data.title,
          bannerUrl: data.bannerUrl,
          targetUrl: data.targetUrl,
          location: data.location,
          maxImpressions: data.maxImpressions,
          active: data.active,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        }
      });
      return {
        ...updated,
        location: updated.location as any,
        bannerUrl: updated.bannerUrl || undefined,
        maxImpressions: updated.maxImpressions || undefined,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || undefined
      };
    } catch {
      return undefined;
    }
  }

  async deleteAd(id: string): Promise<boolean> {
    try {
      await prisma.adPlacement.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async toggleAdActive(id: string): Promise<AdPlacement | undefined> {
    try {
      const current = await prisma.adPlacement.findUnique({ where: { id } });
      if (!current) return undefined;
      
      const updated = await prisma.adPlacement.update({
        where: { id },
        data: { active: !current.active }
      });
      
      return {
        ...updated,
        location: updated.location as any,
        bannerUrl: updated.bannerUrl || undefined,
        maxImpressions: updated.maxImpressions || undefined,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || undefined
      };
    } catch {
      return undefined;
    }
  }
}

export const db = new DatabaseStore();
