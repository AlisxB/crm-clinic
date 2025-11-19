import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', userController.getAllUsers);
router.get('/deleted', userController.getDeletedUsers);
router.post('/login', userController.login);
router.post('/seed', userController.seedAdminUser);
router.post('/logout', userController.logout);
router.get('/me', authenticateToken, userController.checkSession);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.delete('/:id/delete-with-dentist', userController.deleteUserWithDentist);
router.post('/sync-dentists', userController.syncDentists);

export default router;
