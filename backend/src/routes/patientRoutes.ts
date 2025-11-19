import { Router } from 'express';
import * as patientController from '../controllers/patientController';
import { checkPermission, checkDataAccess } from '../middleware/permissionMiddleware';

const router = Router();

router.get('/', checkPermission('patients', 'access'), checkDataAccess('patients'), patientController.getAllPatients);
router.get('/:id', checkPermission('patients', 'access'), patientController.getPatientById);
router.post('/', checkPermission('patients', 'create'), patientController.createPatient);
router.put('/:id', checkPermission('patients', 'edit'), patientController.updatePatient);
router.delete('/:id', checkPermission('patients', 'delete'), patientController.deletePatient);

export default router;
