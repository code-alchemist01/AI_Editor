import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, FileRecord, Project } from '../types';

export class DatabaseService {
  // Conversations
  async createConversation(title: string): Promise<Conversation> {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO conversations (id, title) VALUES ($1, $2) RETURNING *',
      [id, title]
    );
    return result.rows[0];
  }

  async getConversations(): Promise<Conversation[]> {
    const result = await pool.query(
      'SELECT * FROM conversations ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const result = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async deleteConversation(id: string): Promise<void> {
    await pool.query('DELETE FROM conversations WHERE id = $1', [id]);
  }

  // Messages
  async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO messages (id, conversation_id, role, content, mode, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, message.conversationId || null, message.role, message.content, message.mode || null, message.metadata ? JSON.stringify(message.metadata) : null]
    );
    const row = result.rows[0];
    if (row.metadata && typeof row.metadata === 'string') {
      row.metadata = JSON.parse(row.metadata);
    }
    return row;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata && typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    }));
  }

  async deleteMessage(id: string): Promise<void> {
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
  }

  // Files
  async createFile(file: Omit<FileRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FileRecord> {
    const id = uuidv4();
    const metadata = (file as any).metadata || {};
    const result = await pool.query(
      `INSERT INTO files (id, conversation_id, name, path, content, language, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, file.conversationId || null, file.name, file.path || null, file.content || null, file.language || null, JSON.stringify(metadata)]
    );
    const row = result.rows[0];
    return {
      ...row,
      metadata: row.metadata && typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    };
  }

  async getFiles(conversationId?: string): Promise<FileRecord[]> {
    let query = 'SELECT * FROM files';
    const params: any[] = [];
    
    if (conversationId) {
      query += ' WHERE conversation_id = $1';
      params.push(conversationId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata && typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {})
    }));
  }

  async getFileById(id: string): Promise<FileRecord | null> {
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      metadata: row.metadata && typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {})
    };
  }

  async updateFile(id: string, updates: Partial<FileRecord>): Promise<FileRecord> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(updates.content);
    }
    if (updates.language) {
      fields.push(`language = $${paramIndex++}`);
      values.push(updates.language);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE files SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteFile(id: string): Promise<void> {
    await pool.query('DELETE FROM files WHERE id = $1', [id]);
  }

  // Projects
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO projects (id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [id, project.name, project.description || null]
    );
    return result.rows[0];
  }

  async getProjects(): Promise<Project[]> {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async deleteProject(id: string): Promise<void> {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  }
}
