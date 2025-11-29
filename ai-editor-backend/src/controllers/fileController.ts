import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { FileService } from '../services/fileService';
import { GeminiService } from '../services/geminiService';

const dbService = new DatabaseService();
const fileService = new FileService();
const geminiService = new GeminiService();

export class FileController {
  async upload(req: Request, res: Response) {
    try {
      const { name, content, conversationId, metadata } = req.body;

      if (!name || !content) {
        return res.status(400).json({ error: 'Name and content are required' });
      }

      // Save to disk
      const filePath = await fileService.saveFileToDisk(name, content);
      
      // Detect language
      const language = fileService.detectLanguageFromFileName(name);

      // Save to database with metadata
      const fileRecord = await dbService.createFile({
        conversationId,
        name,
        path: filePath,
        content,
        language,
        metadata: metadata || {},
      } as any);

      res.json(fileRecord);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const { conversationId } = req.query;
      const files = await dbService.getFiles(conversationId as string);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if this is a folder ID (should not exist in database)
      if (id && id.startsWith('folder-')) {
        return res.status(400).json({ 
          error: 'Folder IDs are not valid file IDs. Use folder files instead.' 
        });
      }
      
      const file = await dbService.getFileById(id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json(file);
    } catch (error: any) {
      console.error('getById error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedFile = await dbService.updateFile(id, updates);
      res.json(updatedFile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const file = await dbService.getFileById(id);
      if (file?.path) {
        await fileService.deleteFileFromDisk(file.path);
      }
      
      await dbService.deleteFile(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeMultiple(req: Request, res: Response) {
    try {
      const { files, analysisDepth, errorFocus } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'Files array is required' });
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

      // Limit total content size to avoid API limits (roughly 1M characters = ~250k tokens)
      const MAX_TOTAL_CONTENT_LENGTH = 800000; // ~200k tokens
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

      const { success, text } = await geminiService.generateFileErrorPreviewAnalysis(
        filteredFiles,
        analysisDepth || 'Orta (Detaylı Analiz)',
        errorFocus || 'Tüm Hata Türleri'
      );

      if (!success) {
        console.error('Gemini service error:', text);
        return res.status(500).json({ error: text || 'Analysis failed' });
      }

      res.json({ analysis: text });
    } catch (error: any) {
      console.error('analyzeMultiple error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async analyzeSingle(req: Request, res: Response) {
    try {
      const { fileContent, fileName, programmingLanguage } = req.body;

      if (!fileContent || !fileName) {
        return res.status(400).json({ error: 'File content and name are required' });
      }

      const { success, text } = await geminiService.generateFileErrorAnalysis(
        fileContent,
        fileName,
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
}
