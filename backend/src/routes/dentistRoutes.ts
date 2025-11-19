import { Router } from 'express';
import * as dentistController from '../controllers/dentistController';

const router = Router();

router.get('/active-today', dentistController.getActiveDentistsToday);
router.get('/available-slots-week', dentistController.getAvailableSlotsForWeek);
router.get('/', dentistController.getAllDentists);
router.get('/:id', dentistController.getDentistById);
router.post('/', dentistController.createDentist);
router.put('/:id', dentistController.updateDentist);
router.delete('/:id', dentistController.deleteDentist);

// Rotas para horários de atendimento do dentista
router.get('/:id/schedules', dentistController.getDentistSchedules);
router.post('/:id/schedules', dentistController.createDentistSchedule);
router.put('/:id/schedules/:scheduleId', dentistController.updateDentistSchedule);
router.delete('/:id/schedules/:scheduleId', dentistController.deleteDentistSchedule);
router.get('/:id/available-slots', dentistController.getAvailableSlots);

export default router;
