import apiClient from './client';
import { Message, CreatorMode } from '@/types';

export const chatApi = {
  sendMessage: async (conversationId: string | null, content: string, mode: CreatorMode) => {
    const response = await apiClient.post('/chat/message', {
      conversationId,
      content,
      mode,
    });
    return response.data;
  },

  streamMessage: async (
    content: string,
    mode: CreatorMode,
    onChunk: (chunk: string) => void
  ) => {
    const response = await fetch(`${apiClient.defaults.baseURL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, mode }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  },
};
