// User Roles
export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer';

// User Interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Social Media Platforms
export type SocialPlatform = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok';

// Post Status
export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected';

// Post Interface
export interface Post {
  id: string;
  title: string;
  content: string;
  translatedContent?: Record<string, string>;
  status: PostStatus;
  authorId: string;
  author: User;
  platforms: SocialPlatform[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  tags?: string[];
  metadata?: {
    characterCount: number;
    wordCount: number;
    readabilityScore?: number;
  };
}

// Asana Types
export interface AsanaProject {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AsanaTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Buffer Types
export interface BufferProfile {
  id: string;
  platform: SocialPlatform;
  platformUsername: string;
  name?: string;
  avatar?: string;
  connectedAt?: string;
}

export interface BufferPost {
  text: string;
  mediaUrls?: string[];
  platform?: SocialPlatform;
}

// Mistral Vibe Request/Response
export interface MistralGenerationRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

export interface MistralGenerationResponse {
  id: string;
  choices: {
    text: string;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MistralTranslationRequest {
  text: string;
  target_language: string;
  source_language?: string;
}

export interface MistralTranslationResponse {
  translated_text: string;
  detected_language?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalPosts: number;
  draftPosts: number;
  pendingPosts: number;
  publishedPosts: number;
  totalUsers: number;
  activeIntegrations: {
    asana: boolean;
    buffer: boolean;
    mistral: boolean;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
