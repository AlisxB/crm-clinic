import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estender a interface Request para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        username: string;
        role_id: number;
        role_name: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dental-clinic-secret-key-2024') as any;
      req.user = {
        id: decoded.id,
        name: decoded.name,
        username: decoded.username,
        role_id: decoded.role_id,
        role_name: decoded.role_name
      };
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const extractUserFromToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Tentar obter o token do cookie ou header
    const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dental-clinic-secret-key-2024') as any;
        req.user = {
          id: decoded.id,
          name: decoded.name,
          username: decoded.username,
          role_id: decoded.role_id,
          role_name: decoded.role_name
        };
        console.log('👤 Usuário extraído do token:', req.user.name, '(', req.user.role_name, ')');
      } catch (jwtError) {
        // Token inválido, mas não bloquear a requisição
        console.log('⚠️ Token inválido ou expirado');
      }
    } else {
      console.log('⚠️ Nenhum token encontrado');
    }
    
    // Se não há usuário, usar um usuário padrão para auditoria
    if (!req.user) {
      req.user = {
        id: 1,
        name: 'Sistema',
        username: 'system',
        role_id: 1,
        role_name: 'admin'
      };
      console.log('🤖 Usando usuário padrão do sistema');
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    next();
  }
};