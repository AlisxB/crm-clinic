import { Router } from 'express';
import * as receptionistController from '../controllers/receptionistController';

const router = Router();

// Rotas para recepcionistas
router.get('/', receptionistController.getAllReceptionists);
router.get('/:id', receptionistController.getReceptionistById);
router.post('/', receptionistController.createReceptionist);
router.put('/:id', receptionistController.updateReceptionist);
router.delete('/:id', receptionistController.deleteReceptionist);

export default router;