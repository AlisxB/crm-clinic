import { Request, Response } from 'express';
import * as dentistService from '../services/dentistService';

export const getAllDentists = async (req: Request, res: Response) => {
  try {
    const dentists = await dentistService.getAllDentists();
    res.json(dentists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dentists', error });
  }
};

export const getActiveDentistsToday = async (req: Request, res: Response) => {
  try {
    const dentists = await dentistService.getActiveDentistsToday();
    res.json(dentists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active dentists for today', error });
  }
};

export const getDentistById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ message: 'Invalid dentist ID. Must be an integer.' });
    }
    const dentist = await dentistService.getDentistById(id);
    if (dentist) {
      res.json(dentist);
    } else {
      res.status(404).json({ message: 'Dentist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dentist', error });
  }
};

export const createDentist = async (req: Request, res: Response) => {
  try {
    const newDentist = await dentistService.createDentist(req.body);
    res.status(201).json(newDentist);
  } catch (error) {
    res.status(500).json({ message: 'Error creating dentist', error });
  }
};

export const updateDentist = async (req: Request, res: Response) => {
  try {
    const updatedDentist = await dentistService.updateDentist(req.params.id, req.body);
    if (updatedDentist) {
      res.json(updatedDentist);
    } else {
      res.status(404).json({ message: 'Dentist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating dentist', error });
  }
};

export const deleteDentist = async (req: Request, res: Response) => {
  try {
    const deletedDentist = await dentistService.deleteDentist(req.params.id);
    if (deletedDentist) {
      res.json({ message: 'Dentist deleted successfully' });
    } else {
      res.status(404).json({ message: 'Dentist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting dentist', error });
  }
};

// Funções para gerenciar horários de atendimento do dentista
export const getDentistSchedules = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedules = await dentistService.getDentistSchedules(id);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dentist schedules', error });
  }
};

export const createDentistSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newSchedule = await dentistService.createDentistSchedule(id, req.body);
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating dentist schedule', error });
  }
};

export const updateDentistSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const updatedSchedule = await dentistService.updateDentistSchedule(scheduleId, req.body);
    if (updatedSchedule) {
      res.json(updatedSchedule);
    } else {
      res.status(404).json({ message: 'Dentist schedule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating dentist schedule', error });
  }
};

export const deleteDentistSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const deletedSchedule = await dentistService.deleteDentistSchedule(scheduleId);
    if (deletedSchedule) {
      res.json({ message: 'Dentist schedule deleted successfully' });
    } else {
      res.status(404).json({ message: 'Dentist schedule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting dentist schedule', error });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Date query parameter is required' });
    }

    const availableSlots = await dentistService.getAvailableSlots(id, date);
    res.json(availableSlots);
  } catch (error) {
    console.error("!!!!!!!!!! ERRO AO BUSCAR SLOTS !!!!!!!!!!");
    console.error(error);
    res.status(500).json({ message: 'Error fetching available slots', error: (error as Error).message });
  }
};

export const getAvailableSlotsForWeek = async (req: Request, res: Response) => {
  try {
    const { dentistIds } = req.query;
    let ids: string[] = [];

    if (dentistIds && typeof dentistIds === 'string') {
      ids = dentistIds.split(',').filter(id => id.trim() !== '');
    }

    const availableSlots = await dentistService.getAvailableSlotsForWeek(ids);
    res.json(availableSlots);
  } catch (error) {
    console.error("!!!!!!!!!! ERRO AO BUSCAR SLOTS DA SEMANA !!!!!!!!!!");
    console.error(error);
    res.status(500).json({ message: 'Error fetching available slots for the week', error: (error as Error).message });
  }
};