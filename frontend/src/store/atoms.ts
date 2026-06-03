import { atom } from 'recoil';
import { User, Post, Translation, Validation, AppSettings } from '@/types';

// Auth State
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
});

// Posts State
export interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  filters: Record<string, unknown>;
  selectedPost: Post | null;
}

export const postsState = atom<PostsState>({
  key: 'postsState',
  default: {
    posts: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    limit: 10,
    filters: {},
    selectedPost: null,
  },
});

// Translations State
export interface TranslationsState {
  translations: Translation[];
  loading: boolean;
  error: string | null;
  selectedTranslation: Translation | null;
}

export const translationsState = atom<TranslationsState>({
  key: 'translationsState',
  default: {
    translations: [],
    loading: false,
    error: null,
    selectedTranslation: null,
  },
});

// Validations State
export interface ValidationsState {
  validations: Validation[];
  loading: boolean;
  error: string | null;
  pendingValidations: Validation[];
  selectedValidation: Validation | null;
}

export const validationsState = atom<ValidationsState>({
  key: 'validationsState',
  default: {
    validations: [],
    loading: false,
    error: null,
    pendingValidations: [],
    selectedValidation: null,
  },
});

// UI State
export interface UIState {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  isDarkMode: boolean;
  language: string;
  notifications: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }[];
  isLoading: boolean;
  currentTheme: 'light' | 'dark' | 'system';
}

export const uiState = atom<UIState>({
  key: 'uiState',
  default: {
    isSidebarOpen: true,
    isModalOpen: false,
    modalContent: null,
    isDarkMode: false,
    language: 'fr',
    notifications: [],
    isLoading: false,
    currentTheme: 'system',
  },
});

// Settings State
export const settingsState = atom<AppSettings>({
  key: 'settingsState',
  default: {
    defaultLanguage: 'fr',
    defaultPlatform: 'linkedin',
    defaultPriority: 'medium',
    autoSave: true,
    autoTranslate: false,
    notifications: {
      email: true,
      push: true,
      desktop: true,
    },
    integrations: {
      asana: false,
      buffer: false,
      mistralVibe: true,
    },
  },
});

// Editor State
export interface EditorState {
  content: string;
  title: string;
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  suggestions: string[];
  wordCount: number;
  characterCount: number;
  selectedLanguage: string;
  targetLanguages: string[];
}

export const editorState = atom<EditorState>({
  key: 'editorState',
  default: {
    content: '',
    title: '',
    isSaving: false,
    lastSaved: null,
    isDirty: false,
    suggestions: [],
    wordCount: 0,
    characterCount: 0,
    selectedLanguage: 'fr',
    targetLanguages: [],
  },
});

// Collaboration State
export interface CollaborationState {
  onlineUsers: User[];
  activeEditors: {
    user: User;
    postId: string;
    lastActivity: Date;
  }[];
  cursorPositions: {
    userId: string;
    postId: string;
    position: number;
    selection: { start: number; end: number } | null;
  }[];
  isConnected: boolean;
}

export const collaborationState = atom<CollaborationState>({
  key: 'collaborationState',
  default: {
    onlineUsers: [],
    activeEditors: [],
    cursorPositions: [],
    isConnected: false,
  },
});

// Dashboard Stats State
export interface DashboardStatsState {
  totalPosts: number;
  postsByStatus: Record<string, number>;
  postsByPlatform: Record<string, number>;
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
  loading: boolean;
  error: string | null;
}

export const dashboardStatsState = atom<DashboardStatsState>({
  key: 'dashboardStatsState',
  default: {
    totalPosts: 0,
    postsByStatus: {},
    postsByPlatform: {},
    recentActivity: {
      created: 0,
      approved: 0,
      published: 0,
    },
    teamActivity: {
      activeUsers: 0,
      pendingValidations: 0,
      pendingTranslations: 0,
    },
    loading: false,
    error: null,
  },
});

// Search State
export interface SearchState {
  query: string;
  results: Post[];
  loading: boolean;
  error: string | null;
  recentSearches: string[];
}

export const searchState = atom<SearchState>({
  key: 'searchState',
  default: {
    query: '',
    results: [],
    loading: false,
    error: null,
    recentSearches: [],
  },
});

// Notifications State
export interface NotificationState {
  notifications: {
    _id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: string;
  }[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const notificationState = atom<NotificationState>({
  key: 'notificationState',
  default: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
});
