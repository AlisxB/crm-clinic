import { Request, Response } from 'express';
import * as auditService from '../services/auditService';

export const getAllAuditLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const logs = await auditService.getAllAuditLogs(limit, offset);
    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ message: 'Erro ao buscar logs de auditoria', error });
  }
};

export const getAuditLogsByUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;
    
    const logs = await auditService.getAuditLogsByUser(userId, limit);
    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs por usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar logs por usuário', error });
  }
};

export const getAuditLogsByEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    
    const logs = await auditService.getAuditLogsByEntity(entityType, parseInt(entityId));
    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs por entidade:', error);
    res.status(500).json({ message: 'Erro ao buscar logs por entidade', error });
  }
};

export const getAuditLogsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
    }
    
    const logs = await auditService.getAuditLogsByDateRange(startDate as string, endDate as string);
    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs por período:', error);
    res.status(500).json({ message: 'Erro ao buscar logs por período', error });
  }
};

export const restoreItem = async (req: Request, res: Response) => {
  try {
    const logId = parseInt(req.params.logId);
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name;
    
    if (!userId || !userName) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const result = await auditService.restoreItem(logId, userId, userName);
    
    if (result.success) {
      res.json({ message: 'Item restaurado com sucesso', data: result.data });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Erro ao restaurar item:', error);
    res.status(500).json({ message: 'Erro ao restaurar item', error });
  }
};