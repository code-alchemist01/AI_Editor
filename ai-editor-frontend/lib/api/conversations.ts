import apiClient from './client';
import { Conversation } from '@/types';

export const conversationsApi = {
  getAll: async () => {
    const response = await apiClient.get<Conversation[]>('/conversations');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  create: async (title: string) => {
    const response = await apiClient.post<Conversation>('/conversations', { title });
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/conversations/${id}`);
  },
};
