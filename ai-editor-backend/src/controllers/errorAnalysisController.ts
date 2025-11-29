import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';

const geminiService = new GeminiService();

export class ErrorAnalysisController {
  async analyzeError(req: Request, res: Response) {
    try {
      const { codeContent, errorMessage, programmingLanguage } = req.body;

      if (!codeContent || !errorMessage) {
        return res.status(400).json({ error: 'Code content and error message are required' });
      }

      const { success, text } = await geminiService.generateErrorAnalysis(
        codeContent,
        errorMessage,
        programmingLanguage || 'auto'
      );

      if (!success) {
        return res.status(500).json({ error: text });
      }

      res.json({ analysis: text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeErrorFromFiles(req: Request, res: Response) {
    try {
      const { errorMessage, files, language } = req.body;

      if (!errorMessage || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Error message and files array are required' });
      }

      // Validate files structure and filter out invalid ones
      const validFiles = files.filter((file: any) => {
        return file && 
               typeof file.name === 'string' && 
               typeof file.content === 'string' &&
               file.content.length > 0;
      });

      if (validFiles.length === 0) {
        return res.status(400).json({ error: 'No valid files with content found' });
      }

      // Limit total content size to avoid API limits
      const MAX_TOTAL_CONTENT_LENGTH = 800000;
      let totalLength = 0;
      const filteredFiles = validFiles.filter((file: any) => {
        totalLength += file.content.length;
        if (totalLength > MAX_TOTAL_CONTENT_LENGTH) {
          return false;
        }
        return true;
      });

      if (filteredFiles.length === 0) {
        return res.status(400).json({ error: 'Files are too large. Please reduce the number of files or file sizes.' });
      }

      if (filteredFiles.length < validFiles.length) {
        console.warn(`Analyzing ${filteredFiles.length} out of ${validFiles.length} files due to size limit`);
      }

      const { success, text } = await geminiService.generateErrorAnalysisFromFiles(
        errorMessage,
        filteredFiles,
        language || 'auto'
      );

      if (!success) {
        console.error('Gemini service error:', text);
        return res.status(500).json({ error: text || 'Analysis failed' });
      }

      res.json({ analysis: text });
    } catch (error: any) {
      console.error('analyzeErrorFromFiles error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
