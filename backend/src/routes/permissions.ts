import express from 'express';
import {
  getPermissionsByRole,
  getAllPermissions,
  updatePermission,
  createPermission,
  deletePermission,
  getRoles,
  getModules,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/permissionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Buscar permissões por role
router.get('/role/:role', getPermissionsByRole);

// Buscar todas as permissões
router.get('/', getAllPermissions);

// Buscar todos os roles
router.get('/roles', getRoles);

// Criar novo role
router.post('/roles', createRole);

// Atualizar role
router.put('/roles/:id', updateRole);

// Remover role
router.delete('/roles/:id', deleteRole);

// Buscar todos os módulos
router.get('/modules', getModules);

// Atualizar permissão específica
router.put('/:role/:module', updatePermission);

// Criar nova permissão
router.post('/', createPermission);

// Remover permissão
router.delete('/:role/:module', deletePermission);

export default router;