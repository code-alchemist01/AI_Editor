import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import conversationRoutes from './routes/conversations';
import fileRoutes from './routes/files';
import codeToolsRoutes from './routes/codeTools';
import errorAnalysisRoutes from './routes/errorAnalysis';
import projectRoutes from './routes/projects';
import { pool } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/code-tools', codeToolsRoutes);
app.use('/api/error-analysis', errorAnalysisRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
