// server.ts
import express from "express";
import path from "path";
import fs from "fs";

// server/db.ts
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient();
var DatabaseStore = class {
  // Helper to serialize array fields
  serializeJson(arr) {
    return arr ? JSON.stringify(arr) : "[]";
  }
  // Helper to deserialize array fields
  deserializeJson(str) {
    try {
      return str ? JSON.parse(str) : [];
    } catch {
      return [];
    }
  }
  // Helper to map Prisma User to Application User
  mapUser(u) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatarUrl || void 0,
      bio: u.bio || void 0,
      createdAt: u.createdAt.toISOString()
    };
  }
  // Helper to map Prisma Article to Application Article
  mapArticle(a) {
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      content: a.content,
      excerpt: a.excerpt || "",
      category: a.category,
      paywallStatus: a.paywallStatus,
      coverImageUrl: a.coverImageUrl || void 0,
      viewCount: a.viewCount,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt.toISOString(),
      authorId: a.authorId,
      authorName: a.author?.name || "Unknown",
      authorRole: a.author?.role || "READER",
      authorAvatar: a.author?.avatarUrl || void 0,
      seoHeadlines: this.deserializeJson(a.seoHeadlines),
      metaDescription: a.metaDescription || "",
      tags: this.deserializeJson(a.tags),
      commentsCount: a._count?.comments ?? void 0,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString()
    };
  }
  // --- Article CRUD Methods ---
  async getAllArticles(category, search, paywallFilter, includeDrafts = true) {
    const where = {};
    try {
      await prisma.article.updateMany({
        where: { status: { not: "PUBLISHED" } },
        data: { status: "PUBLISHED", isPublished: true }
      });
    } catch (e) {
    }
    if (category && category !== "All") {
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
        publishedAt: "desc"
      }
    });
    return list.map((a) => this.mapArticle(a));
  }
  async getArticleBySlug(slug) {
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
      await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } }
      });
      article.viewCount += 1;
      return this.mapArticle(article);
    }
    return void 0;
  }
  async getArticleById(id) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        _count: {
          select: { comments: true }
        }
      }
    });
    return article ? this.mapArticle(article) : void 0;
  }
  async createArticle(input, author) {
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const excerpt = input.content.slice(0, 180).replace(/\n/g, " ") + "...";
    const newArt = await prisma.article.create({
      data: {
        title: input.title,
        slug,
        content: input.content,
        excerpt,
        category: input.category || "City Hall",
        paywallStatus: "FREE",
        // Default to FREE as paywalls are removed
        coverImageUrl: input.coverImageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200",
        viewCount: 0,
        status: input.status || "PUBLISHED",
        isPublished: true,
        publishedAt: /* @__PURE__ */ new Date(),
        authorId: author.id,
        seoHeadlines: this.serializeJson(input.seoHeadlines),
        metaDescription: input.metaDescription || "",
        tags: this.serializeJson(input.tags)
      },
      include: {
        author: true
      }
    });
    return this.mapArticle(newArt);
  }
  async updateArticle(id, input) {
    const data = { ...input };
    if (input.title) {
      data.slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }
    if (input.content) {
      data.excerpt = input.content.slice(0, 180).replace(/\n/g, " ") + "...";
    }
    if (input.seoHeadlines) {
      data.seoHeadlines = this.serializeJson(input.seoHeadlines);
    }
    if (input.tags) {
      data.tags = this.serializeJson(input.tags);
    }
    if (input.status) {
      data.status = input.status;
      data.isPublished = input.status === "PUBLISHED";
    }
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
      return void 0;
    }
  }
  async deleteArticle(id) {
    try {
      await prisma.comment.deleteMany({ where: { articleId: id } });
      await prisma.article.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  // --- Comments Methods ---
  async getCommentsForArticle(articleId) {
    const list = await prisma.comment.findMany({
      where: { articleId },
      include: { author: true }
    });
    const parentMap = /* @__PURE__ */ new Map();
    const rootComments = [];
    list.forEach((c) => {
      parentMap.set(c.id, {
        id: c.id,
        content: c.content,
        articleId: c.articleId,
        authorId: c.authorId,
        authorName: c.author.name,
        authorRole: c.author.role,
        authorAvatar: c.author.avatarUrl || void 0,
        parentId: c.parentId,
        createdAt: c.createdAt.toISOString(),
        replies: []
      });
    });
    list.forEach((c) => {
      const mapped = parentMap.get(c.id);
      if (c.parentId && parentMap.has(c.parentId)) {
        parentMap.get(c.parentId).replies.push(mapped);
      } else {
        rootComments.push(mapped);
      }
    });
    return rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  async addComment(articleId, content, user, parentId) {
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
      authorRole: newComment.author.role,
      authorAvatar: newComment.author.avatarUrl || void 0,
      parentId: newComment.parentId,
      createdAt: newComment.createdAt.toISOString(),
      replies: []
    };
  }
  // --- Ad Placements Methods ---
  async getAds(location) {
    const where = { active: true };
    if (location) {
      where.location = location;
    }
    const list = await prisma.adPlacement.findMany({ where });
    return list.map((ad) => ({
      ...ad,
      location: ad.location,
      bannerUrl: ad.bannerUrl || void 0,
      maxImpressions: ad.maxImpressions || void 0,
      startDate: ad.startDate.toISOString(),
      endDate: ad.endDate?.toISOString() || void 0
    }));
  }
  async getAllAds() {
    const list = await prisma.adPlacement.findMany();
    return list.map((ad) => ({
      ...ad,
      location: ad.location,
      bannerUrl: ad.bannerUrl || void 0,
      maxImpressions: ad.maxImpressions || void 0,
      startDate: ad.startDate.toISOString(),
      endDate: ad.endDate?.toISOString() || void 0
    }));
  }
  async trackAdEvent(id, type) {
    const data = {};
    if (type === "impression") {
      data.impressions = { increment: 1 };
    } else if (type === "click") {
      data.clicks = { increment: 1 };
    }
    try {
      const updated = await prisma.adPlacement.update({
        where: { id },
        data
      });
      return {
        ...updated,
        location: updated.location,
        bannerUrl: updated.bannerUrl || void 0,
        maxImpressions: updated.maxImpressions || void 0,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || void 0
      };
    } catch {
      return void 0;
    }
  }
  async createAd(ad) {
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
        maxImpressions: ad.maxImpressions
      }
    });
    return {
      ...newAd,
      location: newAd.location,
      bannerUrl: newAd.bannerUrl || void 0,
      maxImpressions: newAd.maxImpressions || void 0,
      startDate: newAd.startDate.toISOString(),
      endDate: newAd.endDate?.toISOString() || void 0
    };
  }
  // --- Users CRUD Methods ---
  async getUserById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.mapUser(user) : void 0;
  }
  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? this.mapUser(user) : void 0;
  }
  async verifyUserLogin(email, passwordSecret) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password === passwordSecret) {
      return this.mapUser(user);
    }
    return void 0;
  }
  async getAllUsers() {
    const list = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    return list.map((u) => this.mapUser(u));
  }
  async createUser(input) {
    const created = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        avatarUrl: input.avatarUrl || null,
        bio: input.bio || null,
        password: input.password || "password123"
      }
    });
    return this.mapUser(created);
  }
  async deleteUser(userId) {
    try {
      await prisma.comment.deleteMany({ where: { authorId: userId } });
      const userArticles = await prisma.article.findMany({ where: { authorId: userId } });
      for (const art of userArticles) {
        await this.deleteArticle(art.id);
      }
      await prisma.user.delete({ where: { id: userId } });
      return true;
    } catch (err) {
      console.error("Failed to delete user:", err);
      return false;
    }
  }
  async updateUserRole(userId, role) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });
      return this.mapUser(updated);
    } catch {
      return void 0;
    }
  }
  // --- Category Methods ---
  async getAllCategories() {
    const list = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      createdAt: c.createdAt.toISOString()
    }));
  }
  async createCategory(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
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
  async deleteCategory(id) {
    try {
      await prisma.category.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  // --- Comment Management Methods ---
  async getAllComments() {
    const list = await prisma.comment.findMany({
      include: {
        author: true,
        article: { select: { title: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return list.map((c) => ({
      id: c.id,
      content: c.content,
      articleId: c.articleId,
      authorId: c.authorId,
      authorName: c.author.name,
      authorRole: c.author.role,
      authorAvatar: c.author.avatarUrl || void 0,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      articleTitle: c.article.title
    }));
  }
  async deleteComment(id) {
    try {
      await prisma.comment.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  // --- Ad Management Methods ---
  async updateAd(id, data) {
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
          startDate: data.startDate ? new Date(data.startDate) : void 0,
          endDate: data.endDate ? new Date(data.endDate) : void 0
        }
      });
      return {
        ...updated,
        location: updated.location,
        bannerUrl: updated.bannerUrl || void 0,
        maxImpressions: updated.maxImpressions || void 0,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || void 0
      };
    } catch {
      return void 0;
    }
  }
  async deleteAd(id) {
    try {
      await prisma.adPlacement.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  async toggleAdActive(id) {
    try {
      const current = await prisma.adPlacement.findUnique({ where: { id } });
      if (!current) return void 0;
      const updated = await prisma.adPlacement.update({
        where: { id },
        data: { active: !current.active }
      });
      return {
        ...updated,
        location: updated.location,
        bannerUrl: updated.bannerUrl || void 0,
        maxImpressions: updated.maxImpressions || void 0,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate?.toISOString() || void 0
      };
    } catch {
      return void 0;
    }
  }
  // --- Event Calendar & Public Holiday Methods ---
  async getAllEvents() {
    let list = await prisma.eventCalendar.findMany({
      orderBy: { createdAt: "asc" }
    });
    if (list.length === 0) {
      const defaultEvents = [
        { title: "\u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930\u0924\u093E \u0926\u093F\u0935\u0938 (Independence Day)", date: "Aug 15, 2026", timeLocation: "National Public Holiday \u2022 All India", type: "PUBLIC_HOLIDAY" },
        { title: "\u0939\u0930\u0947\u0932\u0940 \u0924\u093F\u0939\u093E\u0930 (Hareli Festival)", date: "Aug 24, 2026", timeLocation: "State Public Holiday \u2022 Chhattisgarh", type: "STATE_FESTIVAL" },
        { title: "\u0915\u0930\u092E\u093E \u092A\u0942\u091C\u093E (Karma Puja)", date: "Sep 20, 2026", timeLocation: "Regional Holiday \u2022 Chhattisgarh", type: "STATE_FESTIVAL" },
        { title: "\u0917\u093E\u0902\u0927\u0940 \u091C\u092F\u0902\u0924\u0940 (Gandhi Jayanti)", date: "Oct 02, 2026", timeLocation: "National Public Holiday \u2022 All India", type: "PUBLIC_HOLIDAY" },
        { title: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0930\u093E\u091C\u094D\u092F\u094B\u0924\u094D\u0938\u0935 (State Foundation Day)", date: "Nov 01, 2026", timeLocation: "State Foundation Day \u2022 Chhattisgarh", type: "STATE_FESTIVAL" },
        { title: "\u0926\u0940\u092A\u093E\u0935\u0932\u0940 (Diwali & Govardhan Puja)", date: "Nov 08, 2026", timeLocation: "Gazetted Public Holiday", type: "PUBLIC_HOLIDAY" },
        { title: "RMC City Council Public Hearing", date: "Thursday 5:00 PM", timeLocation: "Nagar Nigam Auditorium, Raipur", type: "CIVIC_HEARING" }
      ];
      for (const item of defaultEvents) {
        await prisma.eventCalendar.create({ data: item });
      }
      list = await prisma.eventCalendar.findMany({ orderBy: { createdAt: "asc" } });
    }
    return list.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      timeLocation: e.timeLocation,
      type: e.type,
      createdAt: e.createdAt.toISOString()
    }));
  }
  async createEvent(input) {
    const created = await prisma.eventCalendar.create({
      data: {
        title: input.title,
        date: input.date,
        timeLocation: input.timeLocation,
        type: input.type || "PUBLIC_HOLIDAY"
      }
    });
    return {
      id: created.id,
      title: created.title,
      date: created.date,
      timeLocation: created.timeLocation,
      type: created.type,
      createdAt: created.createdAt.toISOString()
    };
  }
  async updateEvent(id, input) {
    try {
      const updated = await prisma.eventCalendar.update({
        where: { id },
        data: input
      });
      return {
        id: updated.id,
        title: updated.title,
        date: updated.date,
        timeLocation: updated.timeLocation,
        type: updated.type,
        createdAt: updated.createdAt.toISOString()
      };
    } catch {
      return void 0;
    }
  }
  async deleteEvent(id) {
    try {
      await prisma.eventCalendar.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
};
var db = new DatabaseStore();

// server/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function optimizeArticleWithGemini(articleText, titleHint) {
  try {
    const ai = getGeminiClient();
    const prompt = `Review the following news article draft and produce SEO optimization metadata.

${titleHint ? `Proposed Working Title: "${titleHint}"
` : ""}
Article Draft:
"""
${articleText}
"""

Instructions:
1. Provide EXACTLY 3 compelling, punchy SEO headlines that capture different angles (e.g., action-oriented, civic impact, concise summary).
2. Write a clear, factual 2-sentence meta description suitable for Google Search snippets.
3. Provide an array of 5 to 7 relevant topic tags (e.g. "City Hall", "Transit", "Infrastructure", "Public Safety", "Local Business").`;
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        systemInstruction: "You are an award-winning managing editor and SEO strategist for a digital metropolitan news platform.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoHeadlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 3 suggested SEO headlines"
            },
            metaDescription: {
              type: Type.STRING,
              description: "A concise 2-sentence meta description"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of relevant topic tags"
            }
          },
          required: ["seoHeadlines", "metaDescription", "tags"]
        }
      }
    });
    if (!response.text) {
      throw new Error("No text returned from Gemini API");
    }
    const parsed = JSON.parse(response.text.trim());
    return parsed;
  } catch (error) {
    console.warn("Gemini API call failed or missing key, falling back to smart heuristic optimizer:", error);
    const words = articleText.split(/\s+/).slice(0, 30).join(" ");
    const title = titleHint || "Local News Update";
    return {
      seoHeadlines: [
        `${title}: Key Developments & Civic Impact`,
        `New Details Emerge: ${title}`,
        `Local Report: What You Need to Know About ${title}`
      ],
      metaDescription: `Read the latest report on ${title}. LocalGrid brings you independent, in-depth coverage of municipal updates and community stories.`,
      tags: ["Local News", "City Hall", "Community", "Public Governance", "LocalGrid"]
    };
  }
}

// server.ts
import { put } from "@vercel/blob";
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
var uploadsDir = path.join(process.cwd(), "uploads");
if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
  } catch (err) {
    console.warn("Could not create uploads directory:", err);
  }
}
app.use("/uploads", express.static(uploadsDir));
var checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.headers["x-user-role"] || "READER";
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: `Unauthorized: Action requires one of the following roles: ${allowedRoles.join(", ")}` });
      return;
    }
    next();
  };
};
var handleBase64Upload = async (coverImageUrl) => {
  if (coverImageUrl && coverImageUrl.startsWith("data:image/")) {
    try {
      const matches = coverImageUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return coverImageUrl;
      }
      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `photo_${Date.now()}.${ext}`;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(filename, buffer, {
          access: "public",
          contentType: `image/${ext}`
        });
        console.log("Successfully uploaded image to Vercel Blob:", blob.url);
        return blob.url;
      } else {
        const filePath = path.join(process.cwd(), "uploads", filename);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/${filename}`;
      }
    } catch (err) {
      console.error("File upload save error:", err);
      return coverImageUrl;
    }
  }
  return coverImageUrl;
};
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const user = await db.verifyUserLogin(email, password);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database connection failed. Please reload the page." });
  }
});
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully." });
});
app.get("/api/articles", async (req, res) => {
  try {
    const { category, search, paywall, includeDrafts } = req.query;
    const showDrafts = includeDrafts === "true";
    const articles = await db.getAllArticles(
      category,
      search,
      paywall,
      showDrafts
    );
    res.json({ articles });
  } catch (err) {
    console.error("Articles fetch error:", err);
    res.status(500).json({ error: "Database connection failed. Please reload the page." });
  }
});
app.get("/api/articles/:slug", async (req, res) => {
  try {
    const article = await db.getArticleBySlug(req.params.slug);
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json({ article });
  } catch (err) {
    console.error("Article fetch error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.post("/api/articles", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const { title, content, category, coverImageUrl, authorId, seoHeadlines, metaDescription, tags, status } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "Title and Content are required." });
      return;
    }
    const finalCoverImageUrl = await handleBase64Upload(coverImageUrl);
    const currentUserId = authorId || req.headers["x-user-id"] || "usr-journo-1";
    let author = await db.getUserById(currentUserId);
    if (!author) {
      author = await db.getUserById("usr-journo-1");
    }
    if (!author) {
      res.status(500).json({ error: "Author not found." });
      return;
    }
    const newArticle = await db.createArticle(
      {
        title,
        content,
        category: category || "City Hall",
        paywallStatus: "FREE",
        // Default paywallStatus to FREE as requested
        coverImageUrl: finalCoverImageUrl,
        seoHeadlines,
        metaDescription,
        tags,
        status: status || "DRAFT"
      },
      author
    );
    res.status(201).json({ article: newArticle });
  } catch (err) {
    console.error("Article create error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.put("/api/articles/:id", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    if (req.body.coverImageUrl) {
      req.body.coverImageUrl = await handleBase64Upload(req.body.coverImageUrl);
    }
    const updated = await db.updateArticle(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json({ article: updated });
  } catch (err) {
    console.error("Article update error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.delete("/api/articles/:id", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const success = await db.deleteArticle(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Article not found or already deleted" });
      return;
    }
    res.json({ success: true, message: "Article deleted successfully" });
  } catch (err) {
    console.error("Article delete error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.post("/api/ai/optimize", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content || content.trim().length < 10) {
      res.status(400).json({ error: "Article content must be at least 10 characters for AI optimization." });
      return;
    }
    const result = await optimizeArticleWithGemini(content, title);
    res.json(result);
  } catch (error) {
    console.error("AI Optimization error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI SEO suggestions." });
  }
});
app.get("/api/comments/:articleId", async (req, res) => {
  try {
    const comments = await db.getCommentsForArticle(req.params.articleId);
    res.json({ comments });
  } catch (err) {
    console.error("Comments fetch error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.post("/api/comments", async (req, res) => {
  try {
    const { articleId, content, parentId, userId } = req.body;
    if (!articleId || !content) {
      res.status(400).json({ error: "Article ID and Content are required." });
      return;
    }
    const currentUserId = userId || req.headers["x-user-id"] || "usr-reader-1";
    let user = await db.getUserById(currentUserId);
    if (!user) {
      user = await db.getUserById("usr-reader-1");
    }
    if (!user) {
      res.status(500).json({ error: "User not found." });
      return;
    }
    const newComment = await db.addComment(articleId, content, user, parentId);
    res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error("Comment create error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/comments", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const comments = await db.getAllComments();
    res.json({ comments });
  } catch (err) {
    console.error("Comments fetch error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.delete("/api/comments/:id", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const success = await db.deleteComment(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Comment not found." });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Comment delete error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/ads", async (req, res) => {
  try {
    const { location } = req.query;
    if (location) {
      res.json({ ads: await db.getAds(location) });
    } else {
      res.json({ ads: await db.getAllAds() });
    }
  } catch (err) {
    console.error("Ads fetch error:", err);
    res.status(500).json({ error: "Database connection failed. Please reload the page." });
  }
});
app.post("/api/ads/track", async (req, res) => {
  try {
    const { id, type } = req.body;
    if (!id || !type || !["impression", "click"].includes(type)) {
      res.status(400).json({ error: 'Valid Ad ID and type ("impression" | "click") are required.' });
      return;
    }
    const updatedAd = await db.trackAdEvent(id, type);
    res.json({ ad: updatedAd });
  } catch (err) {
    console.error("Ad tracking error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.post("/api/ads", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const { advertiserName, title, bannerUrl, targetUrl, location, maxImpressions } = req.body;
    if (!advertiserName || !title || !targetUrl) {
      res.status(400).json({ error: "Advertiser name, title, and target URL are required." });
      return;
    }
    const newAd = await db.createAd({
      advertiserName,
      title,
      bannerUrl,
      targetUrl,
      location: location || "SIDEBAR",
      maxImpressions: maxImpressions ? Number(maxImpressions) : void 0
    });
    res.status(201).json({ ad: newAd });
  } catch (err) {
    console.error("Ad create error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.put("/api/ads/:id", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const updated = await db.updateAd(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Ad not found." });
      return;
    }
    res.json({ ad: updated });
  } catch (err) {
    console.error("Ad update error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.delete("/api/ads/:id", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const success = await db.deleteAd(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Ad not found." });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Ad delete error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.put("/api/ads/:id/toggle", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const updated = await db.toggleAdActive(req.params.id);
    if (!updated) {
      res.status(404).json({ error: "Ad not found." });
      return;
    }
    res.json({ ad: updated });
  } catch (err) {
    console.error("Ad toggle error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/events", async (req, res) => {
  try {
    const events = await db.getAllEvents();
    res.json({ events });
  } catch (err) {
    console.error("Events fetch error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.post("/api/events", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const { title, date, timeLocation, type } = req.body;
    if (!title || !date || !timeLocation) {
      res.status(400).json({ error: "Title, Date, and Time/Location are required." });
      return;
    }
    const newEvent = await db.createEvent({ title, date, timeLocation, type });
    res.status(201).json({ event: newEvent });
  } catch (err) {
    console.error("Event create error:", err);
    res.status(500).json({ error: "Failed to create event." });
  }
});
app.put("/api/events/:id", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const updated = await db.updateEvent(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Event not found." });
      return;
    }
    res.json({ event: updated });
  } catch (err) {
    console.error("Event update error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.delete("/api/events/:id", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const success = await db.deleteEvent(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Event not found." });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Event delete error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/users", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.post("/api/users", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const { email, name, password, role, avatarUrl, bio } = req.body;
    if (!email || !name || !role) {
      res.status(400).json({ error: "Email, Name, and Role are required." });
      return;
    }
    const newUser = await db.createUser({ email, name, password, role, avatarUrl, bio });
    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("User create error:", err);
    res.status(400).json({ error: "Failed to create user. Email may already exist or DB is connection timed out." });
  }
});
app.delete("/api/users/:id", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const success = await db.deleteUser(req.params.id);
    if (!success) {
      res.status(404).json({ error: "User not found or failed to delete." });
      return;
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("User delete error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.put("/api/users/role", async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      res.status(400).json({ error: "User ID and Role are required." });
      return;
    }
    const user = await db.updateUserRole(userId, role);
    res.json({ user });
  } catch (err) {
    console.error("User role update error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.put("/api/users/:id/role", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      res.status(400).json({ error: "Role is required." });
      return;
    }
    const user = await db.updateUserRole(req.params.id, role);
    res.json({ user });
  } catch (err) {
    console.error("User role update error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.getAllCategories();
    res.json({ categories });
  } catch (err) {
    console.error("Categories fetch error:", err);
    res.status(500).json({ error: "Database connection failed. Please reload the page." });
  }
});
app.post("/api/categories", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Category name is required." });
      return;
    }
    const category = await db.createCategory(name.trim());
    res.status(201).json({ category });
  } catch (err) {
    console.error("Category create error:", err);
    res.status(400).json({ error: "Category already exists or database is unreachable." });
  }
});
app.delete("/api/categories/:id", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const success = await db.deleteCategory(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Category delete error:", err);
    res.status(500).json({ error: "Database connection failed." });
  }
});
app.get("/api/analytics/overview", checkRole(["ADMIN", "JOURNALIST"]), async (req, res) => {
  try {
    const articles = await db.getAllArticles(void 0, void 0, void 0, true);
    const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
    const topArticles = [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
    const ads = await db.getAllAds();
    const activeAds = ads.filter((ad) => ad.active);
    const users = await db.getAllUsers();
    const totalSubscribers = users.filter((u) => u.role === "SUBSCRIBER").length;
    res.json({
      totalViews,
      topArticles,
      activeAdsCount: activeAds.length,
      totalSubscribers,
      totalArticlesCount: articles.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics overview." });
  }
});
var DEFAULT_OG = {
  title: "Raipur Samvad \u2014 Har Khabar, Raipur Ke Sath",
  description: "Raipur's most trusted Hindi-English news portal covering City Hall, Politics, Sports, Culture, Business, and Technology.",
  image: "/logo.jpg",
  url: "/"
};
var injectOgTags = (html, og, baseUrl) => {
  const absoluteImage = og.image.startsWith("http") ? og.image : `${baseUrl}${og.image}`;
  const absoluteUrl = `${baseUrl}${og.url}`;
  return html.replace(/__OG_TITLE__/g, og.title.replace(/"/g, "&quot;")).replace(/__OG_DESCRIPTION__/g, og.description.replace(/"/g, "&quot;")).replace(/__OG_IMAGE__/g, absoluteImage).replace(/__OG_URL__/g, absoluteUrl);
};
app.get("/article/:slug", async (req, res) => {
  try {
    const article = await db.getArticleBySlug(req.params.slug);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    let html;
    if (process.env.VERCEL) {
      html = fs.readFileSync(path.join(process.cwd(), "dist", "index.html"), "utf-8");
    } else {
      html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
    }
    if (article) {
      const description = article.metaDescription || article.content.substring(0, 160).replace(/\n/g, " ") + "...";
      html = injectOgTags(html, {
        title: `${article.title} \u2014 Raipur Samvad`,
        description,
        image: article.coverImageUrl || "/logo.jpg",
        url: `/article/${article.slug}`
      }, baseUrl);
    } else {
      html = injectOgTags(html, { ...DEFAULT_OG, url: `/article/${req.params.slug}` }, baseUrl);
    }
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("OG injection error:", err);
    res.redirect("/");
  }
});
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  import("vite").then(({ createServer }) => {
    return createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
  }).then((vite) => {
    app.use(vite.middlewares);
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    let html = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    html = injectOgTags(html, DEFAULT_OG, baseUrl);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
}
if (!process.env.VERCEL) {
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LocalGrid Full Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}
var server_default = app;
export {
  server_default as default
};
