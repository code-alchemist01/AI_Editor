import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';

const dbService = new DatabaseService();

export class ConversationController {
  async getAll(req: Request, res: Response) {
    try {
      const conversations = await dbService.getConversations();
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const conversation = await dbService.getConversationById(id);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = await dbService.getMessagesByConversation(id);
      
      res.json({
        ...conversation,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { title } = req.body;
      const conversation = await dbService.createConversation(title || 'New Conversation');
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await dbService.deleteConversation(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
