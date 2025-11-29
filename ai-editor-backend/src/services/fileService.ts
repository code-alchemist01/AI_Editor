import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileRecord } from '../types';

export class FileService {
  private filesDirectory: string;

  constructor() {
    this.filesDirectory = path.join(process.cwd(), 'files');
    // Ensure files directory exists
    if (!fs.existsSync(this.filesDirectory)) {
      fs.mkdirSync(this.filesDirectory, { recursive: true });
    }
  }

  async saveFileToDisk(fileName: string, content: string): Promise<string> {
    const fileId = uuidv4();
    const filePath = path.join(this.filesDirectory, `${fileId}_${fileName}`);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    
    return filePath;
  }

  async readFileFromDisk(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    return fs.readFileSync(filePath, 'utf-8');
  }

  async deleteFileFromDisk(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  detectLanguageFromFileName(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const extMap: Record<string, string> = {
      '.py': 'python',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.jsx': 'jsx',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.html': 'html',
      '.css': 'css',
      '.sql': 'sql',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.txt': 'text',
      '.vue': 'vue',
    };

    return extMap[ext] || 'text';
  }
}
