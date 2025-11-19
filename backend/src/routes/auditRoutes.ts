import { Router } from 'express';
import * as auditController from '../controllers/auditController';

const router = Router();

// Rotas para logs de auditoria
router.get('/', auditController.getAllAuditLogs);
router.get('/user/:userId', auditController.getAuditLogsByUser);
router.get('/entity/:entityType/:entityId', auditController.getAuditLogsByEntity);
router.get('/date-range', auditController.getAuditLogsByDateRange);

// Rota para restauração
router.post('/restore/:logId', auditController.restoreItem);

export default router;