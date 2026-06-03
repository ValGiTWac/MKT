import api, { handleApiError } from './api';
import {
  Translation,
  TranslationRequest,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from '@/types';

const TRANSLATION_ENDPOINTS = {
  GET_ALL: '/translations',
  GET_BY_ID: '/translations/:id',
  CREATE: '/translations',
  UPDATE: '/translations/:id',
  DELETE: '/translations/:id',
  GET_BY_POST: '/translations/post/:postId',
  TRANSLATE_WITH_AI: '/translations/translate-with-ai',
  UPDATE_STATUS: '/translations/:id/status',
};

export const translationService = {
  // Get all translations
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Translation>> {
    try {
      const response = await api.get<PaginatedResponse<Translation>>(
        TRANSLATION_ENDPOINTS.GET_ALL,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single translation
  async getById(id: string): Promise<Translation> {
    try {
      const response = await api.get<ApiResponse<Translation>>(
        TRANSLATION_ENDPOINTS.GET_BY_ID.replace(':id', id)
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create translation
  async create(data: TranslationRequest): Promise<Translation> {
    try {
      const response = await api.post<ApiResponse<Translation>>(
        TRANSLATION_ENDPOINTS.CREATE,
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update translation
  async update(id: string, data: Partial<TranslationRequest>): Promise<Translation> {
    try {
      const response = await api.put<ApiResponse<Translation>>(
        TRANSLATION_ENDPOINTS.UPDATE.replace(':id', id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Delete translation
  async delete(id: string): Promise<void> {
    try {
      await api.delete(TRANSLATION_ENDPOINTS.DELETE.replace(':id', id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get translations by post
  async getByPost(postId: string): Promise<Translation[]> {
    try {
      const response = await api.get<ApiResponse<Translation[]>>(
        TRANSLATION_ENDPOINTS.GET_BY_POST.replace(':postId', postId)
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Translate with AI
  async translateWithAI(data: {
    postId: string;
    targetLanguage: string;
    sourceLanguage?: string;
  }): Promise<Translation> {
    try {
      const response = await api.post<ApiResponse<Translation>>(
        TRANSLATION_ENDPOINTS.TRANSLATE_WITH_AI,
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update translation status
  async updateStatus(id: string, status: string): Promise<Translation> {
    try {
      const response = await api.patch<ApiResponse<Translation>>(
        TRANSLATION_ENDPOINTS.UPDATE_STATUS.replace(':id', id),
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default translationService;
