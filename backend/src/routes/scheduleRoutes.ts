import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController';

const router = Router();

// Rotas para horários dos dentistas
router.get('/', scheduleController.getAllSchedules);
router.get('/dentist/:dentistId', scheduleController.getDentistSchedules);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;