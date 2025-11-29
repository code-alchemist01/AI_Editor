import { Router } from 'express';
import { ErrorAnalysisController } from '../controllers/errorAnalysisController';

const router = Router();
const errorAnalysisController = new ErrorAnalysisController();

router.post('/analyze', (req, res) => errorAnalysisController.analyzeError(req, res));
router.post('/analyze-from-files', (req, res) => errorAnalysisController.analyzeErrorFromFiles(req, res));

export default router;
