import { Request, Response } from 'express';
import * as appointmentService from '../services/appointmentService';
import { setAuditData } from '../middleware/auditMiddleware';

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (appointment) {
      res.json(appointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment', error });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    console.log('Creating appointment with body:', req.body);
    const newAppointment = await appointmentService.createAppointment(req.body);
    
    // Adicionar log de auditoria
    if (req.user) {
      setAuditData(
        req,
        req.user.id,
        req.user.name,
        'CREATE',
        'appointments',
        newAppointment.id,
        `Agendamento #${newAppointment.id}`,
        { appointment_data: req.body }
      );
    }
    
    res.status(201).json(newAppointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ message: error.message || 'Error creating appointment' });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const updatedAppointment = await appointmentService.updateAppointment(req.params.id, req.body);
    if (updatedAppointment) {
      // Adicionar log de auditoria
      if (req.user) {
        const action = req.body.status === 'cancelled' ? 'CANCEL' : 'UPDATE';
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          action,
          'appointments',
          updatedAppointment.id,
          `Agendamento #${updatedAppointment.id}`,
          { updated_data: req.body }
        );
      }
      
      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    res.status(400).json({ message: error.message || 'Error updating appointment' });
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const deletedAppointment = await appointmentService.deleteAppointment(req.params.id);
    if (deletedAppointment) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'DELETE',
          'appointments',
          deletedAppointment.id,
          `Agendamento #${deletedAppointment.id}`,
          { deleted_appointment: deletedAppointment }
        );
      }
      
      res.json({ message: 'Appointment deleted successfully' });
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error });
  }
};
