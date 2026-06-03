import api, { handleApiError } from './api';
import {
  Validation,
  ValidationRequest,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from '@/types';

const VALIDATION_ENDPOINTS = {
  GET_ALL: '/validations',
  GET_BY_ID: '/validations/:id',
  CREATE: '/validations',
  UPDATE: '/validations/:id',
  DELETE: '/validations/:id',
  APPROVE: '/validations/:id/approve',
  REJECT: '/validations/:id/reject',
  REQUEST_CHANGES: '/validations/:id/request-changes',
  GET_BY_POST: '/validations/post/:postId',
  GET_PENDING_MY: '/validations/pending/my',
};

export const validationService = {
  // Get all validations
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Validation>> {
    try {
      const response = await api.get<PaginatedResponse<Validation>>(
        VALIDATION_ENDPOINTS.GET_ALL,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single validation
  async getById(id: string): Promise<Validation> {
    try {
      const response = await api.get<ApiResponse<Validation>>(
        VALIDATION_ENDPOINTS.GET_BY_ID.replace(':id', id)
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create validation request
  async create(data: ValidationRequest): Promise<Validation> {
    try {
      const response = await api.post<ApiResponse<Validation>>(
        VALIDATION_ENDPOINTS.CREATE,
        data
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update validation
  async update(id: string, data: Partial<ValidationRequest>): Promise<Validation> {
    try {
      const response = await api.put<ApiResponse<Validation>>(
        VALIDATION_ENDPOINTS.UPDATE.replace(':id', id),
        data
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Delete validation
  async delete(id: string): Promise<void> {
    try {
      await api.delete(VALIDATION_ENDPOINTS.DELETE.replace(':id', id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Approve validation
  async approve(id: string, comments: string): Promise<Validation> {
    try {
      const response = await api.patch<ApiResponse<Validation>>(
        VALIDATION_ENDPOINTS.APPROVE.replace(':id', id),
        { comments }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Reject validation
  async reject(id: string, comments: string, changesRequested?: string[]): Promise<Validation> {
    try {
      const response = await api.patch<ApiResponse<Validation>>(
        VALIDATION_ENDPOINTS.REJECT.replace(':id', id),
        { comments, changesRequested }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Request changes
  async requestChanges(id: string, comments: string, changesRequested: string[]): Promise<Validation> {
    try {
      const response = await api.patch<ApiResponse<Validation>>(
        VALIDATION_ENDPOINTS.REQUEST_CHANGES.replace(':id', id),
        { comments, changesRequested }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get validations by post
  async getByPost(postId: string): Promise<Validation[]> {
    try {
      const response = await api.get<ApiResponse<Validation[]>>(
        VALIDATION_ENDPOINTS.GET_BY_POST.replace(':postId', postId)
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get pending validations for current user
  async getPendingMy(): Promise<Validation[]> {
    try {
      const response = await api.get<ApiResponse<Validation[]>>(
        VALIDATION_ENDPOINTS.GET_PENDING_MY
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default validationService;
