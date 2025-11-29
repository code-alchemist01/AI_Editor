import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { DatabaseService } from '../services/databaseService';
import { CreatorMode } from '../types';

const geminiService = new GeminiService();
const dbService = new DatabaseService();

export class ChatController {
  async sendMessage(req: Request, res: Response) {
    try {
      const { conversationId, content, mode } = req.body;
      const creatorMode = (mode as CreatorMode) || CreatorMode.CHAT;

      // Save user message
      const userMessage = await dbService.createMessage({
        conversationId,
        role: 'user',
        content,
        mode: creatorMode,
      });

      // Generate AI response
      const { success, text } = await geminiService.generateCodeResponse(content, creatorMode);

      if (!success) {
        return res.status(500).json({ error: text });
      }

      // Save assistant message
      const assistantMessage = await dbService.createMessage({
        conversationId,
        role: 'assistant',
        content: text,
        mode: creatorMode,
      });

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async streamMessage(req: Request, res: Response) {
    try {
      const { content, mode } = req.body;
      const creatorMode = (mode as CreatorMode) || CreatorMode.CHAT;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await geminiService.generateStreaming(content, creatorMode);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
