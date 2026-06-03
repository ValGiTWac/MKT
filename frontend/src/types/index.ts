// User Types
export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  asanaUserId?: string;
  bufferProfileId?: string;
  preferences?: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

export interface UserProfile extends User {
  token: string;
  refreshToken: string;
}

// Post Types
export type PostStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'rejected' | 'scheduled';
export type PostPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
export type PostPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Post {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: User;
  status: PostStatus;
  platform: PostPlatform;
  scheduledAt?: string;
  publishedAt?: string;
  media: string[];
  thumbnail?: string;
  tags: string[];
  category: string;
  priority: PostPriority;
  metadata?: {
    hashtags: string[];
    mentions: string[];
    links: string[];
    characterCount: number;
    wordCount: number;
  };
  settings?: {
    autoPublish: boolean;
    notifyTeam: boolean;
    createAsanaTask: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostCreateInput {
  title: string;
  content: string;
  excerpt?: string;
  platform: PostPlatform;
  scheduledAt?: string;
  media?: string[];
  thumbnail?: string;
  tags?: string[];
  category?: string;
  priority?: PostPriority;
  settings?: {
    autoPublish?: boolean;
    notifyTeam?: boolean;
    createAsanaTask?: boolean;
  };
}

export interface PostUpdateInput extends Partial<PostCreateInput> {
  status?: PostStatus;
}

// Translation Types
export type TranslationStatus = 'pending' | 'completed' | 'needs_review' | 'failed';

export interface Translation {
  _id: string;
  post: Post | string;
  language: string;
  content: string;
  status: TranslationStatus;
  translator?: User | string;
  sourceLanguage?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationRequest {
  postId: string;
  targetLanguages: string[];
  sourceLanguage?: string;
}

// Validation Types
export type ValidationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface Validation {
  _id: string;
  post: Post | string;
  validator: User | string;
  status: ValidationStatus;
  comments?: string;
  visualPreview?: string;
  changesRequested?: string[];
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRequest {
  postId: string;
  comments?: string;
  visualPreview?: string;
}

// Asana Types
export interface AsanaTask {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
  projectId?: string;
  sectionId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AsanaSyncRequest {
  postId: string;
  projectId?: string;
  assigneeId?: string;
  dueDate?: string;
}

// Buffer Types
export interface BufferProfile {
  id: string;
  service: string;
  serviceId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface BufferPost {
  id: string;
  text: string;
  media?: string[];
  profileIds: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: 'scheduled' | 'published' | 'failed' | 'sent';
}

export interface BufferPublishRequest {
  postId: string;
  profileIds: string[];
  scheduledAt?: string;
  publishNow?: boolean;
}

// Mistral Vibe Types
export interface MistralVibeRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
}

export interface MistralVibeResponse {
  id: string;
  choices: {
    text: string;
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface MistralGenerationRequest {
  type: 'post' | 'translation' | 'correction' | 'optimization';
  content: string;
  options?: {
    tone?: 'professional' | 'casual' | 'friendly' | 'formal';
    length?: 'short' | 'medium' | 'long';
    style?: string;
    targetAudience?: string;
  };
}

// Comment Types
export interface Comment {
  _id: string;
  post: Post | string;
  author: User | string;
  content: string;
  parent?: Comment | string;
  replies: Comment[];
  mentions: User[] | string[];
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 'post_created' | 'post_updated' | 'post_approved' | 'post_rejected' | 'translation_completed' | 'validation_requested' | 'comment_added' | 'mention';

export interface Notification {
  _id: string;
  user: User | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and Sort Types
export interface PostFilter {
  status?: PostStatus[];
  platform?: PostPlatform[];
  priority?: PostPriority[];
  author?: string[];
  tags?: string[];
  category?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface QueryParams {
  page?: number;
  limit?: number;
  filter?: PostFilter;
  sort?: SortOptions;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalPosts: number;
  postsByStatus: Record<PostStatus, number>;
  postsByPlatform: Record<PostPlatform, number>;
  recentActivity: {
    created: number;
    approved: number;
    published: number;
  };
  teamActivity: {
    activeUsers: number;
    pendingValidations: number;
    pendingTranslations: number;
  };
}

// WebSocket Events
export type SocketEvent = 
  | 'post:created'
  | 'post:updated'
  | 'post:deleted'
  | 'translation:completed'
  | 'validation:requested'
  | 'validation:completed'
  | 'comment:added'
  | 'user:online'
  | 'user:offline';

export interface SocketMessage<T = unknown> {
  event: SocketEvent;
  data: T;
  timestamp: string;
}

// File Upload Types
export interface UploadResponse {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
}

// Settings Types
export interface AppSettings {
  defaultLanguage: string;
  defaultPlatform: PostPlatform;
  defaultPriority: PostPriority;
  autoSave: boolean;
  autoTranslate: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  integrations: {
    asana: boolean;
    buffer: boolean;
    mistralVibe: boolean;
  };
}
