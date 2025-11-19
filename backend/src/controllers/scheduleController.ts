import { Request, Response } from 'express';
import * as scheduleService from '../services/scheduleService';
import { setAuditData } from '../middleware/auditMiddleware';

export const getDentistSchedules = async (req: Request, res: Response) => {
  try {
    const dentistId = parseInt(req.params.dentistId);
    const schedules = await scheduleService.getDentistSchedules(dentistId);
    res.json(schedules);
  } catch (error) {
    console.error('Erro ao buscar horários do dentista:', error);
    res.status(500).json({ message: 'Erro ao buscar horários do dentista', error });
  }
};

export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await scheduleService.getAllSchedules();
    res.json(schedules);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    res.status(500).json({ message: 'Erro ao buscar horários', error });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const newSchedule = await scheduleService.createSchedule(req.body);
    
    // Adicionar log de auditoria
    if (req.user) {
      setAuditData(
        req,
        req.user.id,
        req.user.name,
        'CREATE',
        'schedules',
        newSchedule.id,
        `Horário ${req.body.day_of_week} ${req.body.start_time}-${req.body.end_time}`,
        { schedule_data: req.body }
      );
    }
    
    res.status(201).json(newSchedule);
  } catch (error: any) {
    console.error('Erro ao criar horário:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        message: 'Já existe um horário cadastrado para este dentista neste período.' 
      });
    }
    
    res.status(500).json({ message: 'Erro ao criar horário', error: error.message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const updatedSchedule = await scheduleService.updateSchedule(scheduleId, req.body);
    
    if (updatedSchedule) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'UPDATE',
          'schedules',
          updatedSchedule.id,
          `Horário ${req.body.day_of_week} ${req.body.start_time}-${req.body.end_time}`,
          { updated_data: req.body }
        );
      }
      
      res.json(updatedSchedule);
    } else {
      res.status(404).json({ message: 'Horário não encontrado' });
    }
  } catch (error: any) {
    console.error('Erro ao atualizar horário:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        message: 'Já existe um horário cadastrado para este dentista neste período.' 
      });
    }
    
    res.status(500).json({ message: 'Erro ao atualizar horário', error: error.message });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const deletedSchedule = await scheduleService.deleteSchedule(scheduleId);
    
    if (deletedSchedule) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'DELETE',
          'schedules',
          deletedSchedule.id,
          `Horário ${deletedSchedule.day_of_week} ${deletedSchedule.start_time}-${deletedSchedule.end_time}`,
          { deleted_schedule: deletedSchedule }
        );
      }
      
      res.json({ message: 'Horário excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Horário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir horário:', error);
    res.status(500).json({ message: 'Erro ao excluir horário', error });
  }
};