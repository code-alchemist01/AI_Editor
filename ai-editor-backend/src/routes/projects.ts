import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

const router = Router();
const projectController = new ProjectController();

router.get('/', (req, res) => projectController.getAll(req, res));
router.get('/:id', (req, res) => projectController.getById(req, res));
router.post('/', (req, res) => projectController.create(req, res));
router.post('/:id/generate', (req, res) => projectController.generateStructure(req, res));
router.delete('/:id', (req, res) => projectController.delete(req, res));

export default router;
