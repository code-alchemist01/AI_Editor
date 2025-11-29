import { Router } from 'express';
import { CodeToolsController } from '../controllers/codeToolsController';

const router = Router();
const codeToolsController = new CodeToolsController();

router.post('/refactor', (req, res) => codeToolsController.refactor(req, res));
router.post('/analyze-architecture', (req, res) => codeToolsController.analyzeArchitecture(req, res));

export default router;
