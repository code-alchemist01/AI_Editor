import { Router } from 'express';
import { ConversationController } from '../controllers/conversationController';

const router = Router();
const conversationController = new ConversationController();

router.get('/', (req, res) => conversationController.getAll(req, res));
router.get('/:id', (req, res) => conversationController.getById(req, res));
router.post('/', (req, res) => conversationController.create(req, res));
router.delete('/:id', (req, res) => conversationController.delete(req, res));

export default router;
