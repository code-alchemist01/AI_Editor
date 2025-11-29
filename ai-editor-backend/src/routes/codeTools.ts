import { Router } from 'express';
import { CodeToolsController } from '../controllers/codeToolsController';

const router = Router();
const codeToolsController = new CodeToolsController();

router.post('/refactor', (req, res) => codeToolsController.refactor(req, res));
router.post('/analyze-architecture', (req, res) => codeToolsController.analyzeArchitecture(req, res));
router.post('/code-review', (req, res) => codeToolsController.codeReview(req, res));
router.post('/performance-analysis', (req, res) => codeToolsController.performanceAnalysis(req, res));
router.post('/security-scan', (req, res) => codeToolsController.securityScan(req, res));
router.post('/generate-tests', (req, res) => codeToolsController.generateTests(req, res));
router.post('/generate-documentation', (req, res) => codeToolsController.generateDocumentation(req, res));

export default router;
