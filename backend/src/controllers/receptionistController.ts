import { Request, Response } from 'express';
import * as receptionistService from '../services/receptionistService';
import { setAuditData } from '../middleware/auditMiddleware';

export const getAllReceptionists = async (req: Request, res: Response) => {
  try {
    const receptionists = await receptionistService.getAllReceptionists();
    res.json(receptionists);
  } catch (error) {
    console.error('Erro ao buscar recepcionistas:', error);
    res.status(500).json({ message: 'Erro ao buscar recepcionistas', error });
  }
};

export const getReceptionistById = async (req: Request, res: Response) => {
  try {
    const receptionist = await receptionistService.getReceptionistById(req.params.id);
    if (receptionist) {
      res.json(receptionist);
    } else {
      res.status(404).json({ message: 'Recepcionista não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar recepcionista:', error);
    res.status(500).json({ message: 'Erro ao buscar recepcionista', error });
  }
};

export const createReceptionist = async (req: Request, res: Response) => {
  try {
    const newReceptionist = await receptionistService.createReceptionist(req.body);

    // Adicionar log de auditoria
    if (req.user) {
      setAuditData(
        req,
        req.user.id,
        req.user.name,
        'CREATE',
        'receptionists',
        newReceptionist.id,
        newReceptionist.name,
        { receptionist_data: req.body }
      );
    }

    res.status(201).json(newReceptionist);
  } catch (error: any) {
    console.error('Erro ao criar recepcionista:', error);
    res.status(500).json({ message: error.message || 'Erro ao criar recepcionista' });
  }
};

export const updateReceptionist = async (req: Request, res: Response) => {
  try {
    const updatedReceptionist = await receptionistService.updateReceptionist(req.params.id, req.body);
    
    if (updatedReceptionist) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'UPDATE',
          'receptionists',
          updatedReceptionist.id,
          updatedReceptionist.name,
          { updated_data: req.body }
        );
      }

      res.json(updatedReceptionist);
    } else {
      res.status(404).json({ message: 'Recepcionista não encontrado' });
    }
  } catch (error: any) {
    console.error('Erro ao atualizar recepcionista:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar recepcionista' });
  }
};

export const deleteReceptionist = async (req: Request, res: Response) => {
  try {
    // Buscar dados do recepcionista antes de excluir para auditoria
    const existingReceptionist = await receptionistService.getReceptionistById(req.params.id);
    if (!existingReceptionist) {
      return res.status(404).json({ message: 'Recepcionista não encontrado' });
    }

    const deletedReceptionist = await receptionistService.deleteReceptionist(req.params.id, req.user?.id);
    
    if (deletedReceptionist) {
      // Adicionar log de auditoria com dados anteriores para restauração
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'DELETE',
          'receptionists',
          deletedReceptionist.id,
          deletedReceptionist.name,
          { 
            deleted_receptionist: deletedReceptionist,
            previous_data: existingReceptionist,
            can_restore: true
          }
        );
      }

      res.json({ message: 'Recepcionista excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Recepcionista não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir recepcionista:', error);
    res.status(500).json({ message: 'Erro ao excluir recepcionista', error });
  }
};