import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { GeminiService } from '../services/geminiService';

const dbService = new DatabaseService();
const geminiService = new GeminiService();

export class ProjectController {
  async getAll(req: Request, res: Response) {
    try {
      const projects = await dbService.getProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await dbService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const project = await dbService.createProject({ name, description });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateStructure(req: Request, res: Response) {
    try {
      const { projectDescription, projectType, techStack, projectScale } = req.body;

      if (!projectDescription) {
        return res.status(400).json({ error: 'Project description is required' });
      }

      const { success, text } = await geminiService.generateProjectStructure(
        projectDescription,
        projectType || 'web',
        techStack || '',
        projectScale || 'medium'
      );

      if (!success) {
        return res.status(500).json({ error: text });
      }

      res.json({ structure: text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await dbService.deleteProject(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
