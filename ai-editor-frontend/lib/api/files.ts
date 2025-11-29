import apiClient from './client';
import { FileRecord } from '@/types';

export const filesApi = {
  upload: async (file: { name: string; content: string; conversationId?: string; metadata?: any }) => {
    const response = await apiClient.post<FileRecord>('/files', file);
    return response.data;
  },

  getAll: async (conversationId?: string) => {
    const params = conversationId ? { conversationId } : {};
    const response = await apiClient.get<FileRecord[]>('/files', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<FileRecord>(`/files/${id}`);
    return response.data;
  },

  update: async (id: string, updates: Partial<FileRecord>) => {
    const response = await apiClient.put<FileRecord>(`/files/${id}`, updates);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/files/${id}`);
  },

  analyzeMultiple: async (files: Array<{ name: string; content: string }>, analysisDepth?: string, errorFocus?: string) => {
    const response = await apiClient.post('/files/analyze/multiple', {
      files,
      analysisDepth: analysisDepth || 'Orta (Detaylı Analiz)',
      errorFocus: errorFocus || 'Tüm Hata Türleri',
    });
    return response.data;
  },

  analyzeSingle: async (fileContent: string, fileName: string, programmingLanguage?: string) => {
    const response = await apiClient.post('/files/analyze/single', {
      fileContent,
      fileName,
      programmingLanguage: programmingLanguage || 'auto',
    });
    return response.data;
  },
};
