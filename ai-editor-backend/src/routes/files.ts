import { Router } from 'express';
import { FileController } from '../controllers/fileController';

const router = Router();
const fileController = new FileController();

router.post('/', (req, res) => fileController.upload(req, res));
router.get('/', (req, res) => fileController.getAll(req, res));
router.get('/:id', (req, res) => fileController.getById(req, res));
router.put('/:id', (req, res) => fileController.update(req, res));
router.delete('/:id', (req, res) => fileController.delete(req, res));
router.post('/analyze/multiple', (req, res) => fileController.analyzeMultiple(req, res));
router.post('/analyze/single', (req, res) => fileController.analyzeSingle(req, res));

export default router;
