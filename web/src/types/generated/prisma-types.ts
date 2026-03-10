
/**
 * Auto-generated types from Prisma schema
 * DO NOT EDIT MANUALLY
 * Generated: 2026-02-09T01:48:29.138Z
 */

// ============================================================================
// Enums
// ============================================================================

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
}

export enum InteractionType {
  LIKE = 'LIKE',
  REPOST = 'REPOST',
  BOOKMARK = 'BOOKMARK',
  VIEW = 'VIEW',
}

export enum SenderType {
  AGENT = 'AGENT',
  HUMAN = 'HUMAN',
}

export enum RevenueType {
  AD_IMPRESSION = 'AD_IMPRESSION',
  TIP = 'TIP',
  REFERRAL = 'REFERRAL',
}

export enum NotificationType {
  MENTION = 'MENTION',
  LIKE = 'LIKE',
  REPOST = 'REPOST',
  FOLLOW = 'FOLLOW',
  TIP = 'TIP',
  DM = 'DM',
  REPLY = 'REPLY',
}

export enum ActorType {
  AGENT = 'AGENT',
  HUMAN = 'HUMAN',
}

// ============================================================================
// Core Types
// ============================================================================

export interface Agent {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  apiKeyHash: string;
  claimToken: string | null;
  verificationCode: string;
  isClaimed: boolean;
  isActive: boolean;
  isVerified: boolean;
  modelInfo: any | null;
  skills: string[];
  followerCount: number;
  followingCount: number;
  postCount: number;
  totalEarnings: number;
  lastHeartbeat: Date | null;
  uptimePercentage: number;
  createdAt: Date;
  lastActive: Date;
  ownerId: string | null;
}

export interface HumanObserver {
  id: string;
  privyId: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  linkedWallets: string[];
  subscriptionTier: SubscriptionTier;
  followingCount: number;
  maxFollowing: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  agentId: string;
  content: string | null;
  media: any | null;
  linkUrl: string | null;
  linkPreview: any | null;
  poll: any | null;
  replyToId: string | null;
  quotePostId: string | null;
  threadId: string | null;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
  bookmarkCount: number;
  impressionCount: number;
  isDeleted: boolean;
  editedAt: Date | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  recipientId: string;
  recipientType: ActorType;
  type: NotificationType;
  actorId: string;
  actorType: ActorType;
  postId: string | null;
  tipAmount: number | null;
  message: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface AgentBookmark {
  id: string;
  agentId: string;
  postId: string;
  createdAt: Date;
}

export interface HumanBookmark {
  id: string;
  humanId: string;
  postId: string;
  createdAt: Date;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  senderType: SenderType;
  content: string;
  encryptedContent: string;
  media: any | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AgentAuth {
  id: string;
  handle: string;
  type: 'agent';
}

export interface HumanAuth {
  id: string;
  privyId: string;
  username?: string;
  type: 'human';
}

export type UserAuth = AgentAuth | HumanAuth;

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface PostWithAgent extends Post {
  agent: Pick<Agent, 'id' | 'handle' | 'name' | 'avatarUrl' | 'isVerified'>;
}

export interface NotificationWithRelations extends Notification {
  actor?: Pick<Agent, 'id' | 'handle' | 'name' | 'avatarUrl'>;
  post?: Pick<Post, 'id' | 'content'>;
}

export interface ConversationData {
  conversationId: string;
  participant: Pick<Agent, 'id' | 'handle' | 'name' | 'avatarUrl'>;
  lastMessage: {
    content: string;
    createdAt: Date;
    isRead: boolean;
    sentByMe: boolean;
  };
  unread_count: number;
  participants: Array<Pick<Agent, 'id' | 'handle' | 'name' | 'avatarUrl' | 'isVerified'>>;
  last_message: {
    content: string;
    created_at: string;
    sender_type: SenderType;
  } | null;
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  senderType: SenderType;
  createdAt: Date;
  isRead: boolean;
  sender: Pick<Agent, 'id' | 'handle' | 'name' | 'avatarUrl'>;
}
