import { Request, Response, NextFunction } from 'express';
import * as auditService from '../services/auditService';

// Estender a interface Request para incluir dados de auditoria
declare global {
  namespace Express {
    interface Request {
      auditData?: {
        user_id: number;
        user_name: string;
        action: string;
        entity_type: string;
        entity_id?: number;
        entity_name?: string;
        details?: any;
      };
    }
  }
}

export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Interceptar a resposta para capturar dados após a operação
  const originalSend = res.send;

  res.send = function (data: any) {
    // Se há dados de auditoria e a operação foi bem-sucedida
    if (req.auditData && res.statusCode >= 200 && res.statusCode < 300) {
      console.log('🔍 Criando log de auditoria:', req.auditData);
      // Criar log de auditoria de forma assíncrona
      auditService.createAuditLog({
        ...req.auditData,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      }).then(result => {
        console.log('✅ Log de auditoria criado:', result.id);
      }).catch(error => {
        console.error('❌ Erro ao criar log de auditoria:', error);
      });
    } else if (req.auditData) {
      console.log('⚠️ Dados de auditoria presentes mas status não é sucesso:', res.statusCode);
    }

    return originalSend.call(this, data);
  };

  next();
};

// Helper para definir dados de auditoria
export const setAuditData = (
  req: Request,
  user_id: number,
  user_name: string,
  action: string,
  entity_type: string,
  entity_id?: number,
  entity_name?: string,
  details?: any
) => {
  req.auditData = {
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    details
  };
};