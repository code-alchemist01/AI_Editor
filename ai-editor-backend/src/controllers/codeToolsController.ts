import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';

const geminiService = new GeminiService();

export class CodeToolsController {
  async refactor(req: Request, res: Response) {
    try {
      const { codeContent, refactoringType, fileName } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generateModularRefactoring(
        codeContent,
        refactoringType || 'auto',
        fileName || ''
      );

      if (!success) {
        return res.status(500).json({ error: text });
      }

      res.json({ result: text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeArchitecture(req: Request, res: Response) {
    try {
      const { codeContent, analysisType, analysisDepth } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generateArchitectureAnalysis(
        codeContent,
        analysisType || 'full',
        analysisDepth || 'medium'
      );

      if (!success) {
        return res.status(500).json({ error: text });
      }

      res.json({ result: text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
