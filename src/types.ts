export type Role = 'ADMIN' | 'JOURNALIST' | 'READER' | 'SUBSCRIBER';

export type PaywallStatus = 'FREE' | 'SUBSCRIBER_ONLY' | 'MEMBER_EXCLUSIVE';

export type AdLocation = 'HEADER' | 'SIDEBAR' | 'IN_ARTICLE' | 'FOOTER';

export type PlanType = 'MONTHLY_NEIGHBOR' | 'ANNUAL_CIVIC_PATRON';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED';

export interface User {
  id: string;
  firebaseUid?: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  paywallStatus: PaywallStatus;
  coverImageUrl?: string;
  viewCount: number;
  isPublished: boolean;
  publishedAt: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorAvatar?: string;
  seoHeadlines?: string[];
  metaDescription?: string;
  tags?: string[];
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorAvatar?: string;
  parentId?: string | null;
  replies?: Comment[];
  createdAt: string;
}

export interface AdPlacement {
  id: string;
  advertiserName: string;
  title: string;
  bannerUrl?: string;
  targetUrl: string;
  location: AdLocation;
  active: boolean;
  impressions: number;
  clicks: number;
  maxImpressions?: number;
  startDate?: string;
  endDate?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface AiOptimizeResult {
  seoHeadlines: string[];
  metaDescription: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface CmsArticleInput {
  title: string;
  content: string;
  category: string;
  paywallStatus: PaywallStatus;
  coverImageUrl?: string;
  authorId?: string;
  seoHeadlines?: string[];
  metaDescription?: string;
  tags?: string[];
  status?: string;
}

export type EventType = 'PUBLIC_HOLIDAY' | 'STATE_FESTIVAL' | 'CIVIC_HEARING';

export interface EventCalendarItem {
  id: string;
  title: string;
  date: string;
  timeLocation: string;
  type: EventType;
  createdAt?: string;
}

