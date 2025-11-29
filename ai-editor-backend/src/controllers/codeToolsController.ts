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

  async codeReview(req: Request, res: Response) {
    try {
      const { codeContent, fileName } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generateCodeReview(
        codeContent,
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

  async performanceAnalysis(req: Request, res: Response) {
    try {
      const { codeContent, fileName } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generatePerformanceAnalysis(
        codeContent,
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

  async securityScan(req: Request, res: Response) {
    try {
      const { codeContent, fileName } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generateSecurityScan(
        codeContent,
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

  async generateTests(req: Request, res: Response) {
    try {
      const { codeContent, fileName, testType } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generateTestCases(
        codeContent,
        fileName || '',
        testType || 'unit'
      );

      if (!success) {
        return res.status(500).json({ error: text });
      }

      res.json({ result: text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateDocumentation(req: Request, res: Response) {
    try {
      const { codeContent, fileName, docType } = req.body;

      if (!codeContent) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      const { success, text } = await geminiService.generateDocumentation(
        codeContent,
        fileName || '',
        docType || 'api'
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
