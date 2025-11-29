import { Router } from 'express';
import { ChatController } from '../controllers/chatController';

const router = Router();
const chatController = new ChatController();

router.post('/message', (req, res) => chatController.sendMessage(req, res));
router.post('/stream', (req, res) => chatController.streamMessage(req, res));

export default router;
