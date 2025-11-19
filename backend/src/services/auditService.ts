import pool from '../config/database';
import * as dentistService from './dentistService';

export interface AuditLogData {
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  entity_name?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export const createAuditLog = async (logData: AuditLogData) => {
  try {
    const {
      user_id,
      user_name,
      action,
      entity_type,
      entity_id,
      entity_name,
      details,
      ip_address,
      user_agent
    } = logData;

    const result = await pool.query(
      `INSERT INTO audit_logs 
       (user_id, user_name, action, entity_type, entity_id, entity_name, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [user_id, user_name, action, entity_type, entity_id, entity_name, JSON.stringify(details), ip_address, user_agent]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    throw error;
  }
};

export const getAllAuditLogs = async (limit = 100, offset = 0) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    throw error;
  }
};

export const getAuditLogsByUser = async (userId: number, limit = 50) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar logs por usuário:', error);
    throw error;
  }
};

export const getAuditLogsByEntity = async (entityType: string, entityId: number) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY created_at DESC`,
      [entityType, entityId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar logs por entidade:', error);
    throw error;
  }
};

export const getAuditLogsByDateRange = async (startDate: string, endDate: string) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar logs por período:', error);
    throw error;
  }
};

export const restoreItem = async (logId: number, userId: number, userName: string) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Buscar o log de auditoria
    const logResult = await client.query(
      'SELECT * FROM audit_logs WHERE id = $1 AND action = $2',
      [logId, 'DELETE']
    );
    
    if (logResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Log de exclusão não encontrado' };
    }
    
    const log = logResult.rows[0];
    const { entity_type, entity_id, entity_name, details } = log;
    
    if (!details) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Dados para restauração não disponíveis' };
    }
    
    let restoredItem;
    
    // Restaurar baseado no tipo de entidade usando soft delete
    switch (entity_type) {
      case 'patients':
        if (details.deleted_patient) {
          restoredItem = await client.query(
            `UPDATE patients 
             SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
             WHERE id = $1 RETURNING *`,
            [entity_id]
          );
        }
        break;
        
      case 'users':
        if (details.deleted_user) {
          // Restaurar usuário
          restoredItem = await client.query(
            `UPDATE users 
             SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
             WHERE id = $1 RETURNING *`,
            [entity_id]
          );
          
          // Se o usuário é um dentista, também restaurar na tabela dentists
          if (details.deleted_user.role_name === 'dentist' && details.dentist_data) {
            const dentistData = details.dentist_data;
            
            // Verificar se já existe um registro na tabela dentists
            const existingDentist = await client.query(
              'SELECT id FROM dentists WHERE name = $1',
              [dentistData.name]
            );
            
            if (existingDentist.rows.length > 0) {
              // Se existe, apenas marcar como não excluído (se tiver soft delete)
              await client.query(
                `UPDATE dentists 
                 SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
                 WHERE name = $1`,
                [dentistData.name]
              );
            } else {
              // Se não existe, criar novo registro
              await client.query(
                `INSERT INTO dentists (name, specialty, email, phone, experience, patients, specializations) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  dentistData.name, 
                  dentistData.specialty || 'Odontologia Geral',
                  dentistData.email,
                  dentistData.phone || '',
                  dentistData.experience || '0 anos',
                  dentistData.patients || 0,
                  dentistData.specializations || ['Odontologia Geral']
                ]
              );
            }
          }
          
          // Se o usuário é um recepcionista, também restaurar na tabela receptionists
          if (details.deleted_user.role_name === 'receptionist' && details.receptionist_data) {
            const receptionistData = details.receptionist_data;
            
            // Verificar se já existe um registro na tabela receptionists
            const existingReceptionist = await client.query(
              'SELECT id FROM receptionists WHERE name = $1',
              [receptionistData.name]
            );
            
            if (existingReceptionist.rows.length > 0) {
              // Se existe, apenas marcar como não excluído
              await client.query(
                `UPDATE receptionists 
                 SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
                 WHERE name = $1`,
                [receptionistData.name]
              );
            } else {
              // Se não existe, criar novo registro
              await client.query(
                `INSERT INTO receptionists (name, email, phone, shift, hire_date, experience, permissions) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  receptionistData.name,
                  receptionistData.email,
                  receptionistData.phone || '',
                  receptionistData.shift || 'full',
                  receptionistData.hire_date || new Date().toISOString().split('T')[0],
                  receptionistData.experience || '0 anos',
                  receptionistData.permissions || ['basic']
                ]
              );
            }
          }
        }
        break;
        
      case 'receptionists':
        if (details.deleted_receptionist) {
          restoredItem = await client.query(
            `UPDATE receptionists 
             SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
             WHERE id = $1 RETURNING *`,
            [entity_id]
          );
        }
        break;
        
      default:
        await client.query('ROLLBACK');
        return { success: false, message: 'Tipo de entidade não suportado para restauração' };
    }
    
    if (!restoredItem || restoredItem.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Falha ao restaurar item' };
    }
    
    // Criar novo log de auditoria para a restauração
    await client.query(
      `INSERT INTO audit_logs 
       (user_id, user_name, action, entity_type, entity_id, entity_name, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId, 
        userName, 
        'RESTORE', 
        entity_type, 
        entity_id, 
        entity_name,
        JSON.stringify({ restored_from_log_id: logId }),
        null,
        null
      ]
    );
    
    await client.query('COMMIT');
    
    return { 
      success: true, 
      message: 'Item restaurado com sucesso',
      data: restoredItem.rows[0]
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao restaurar item:', error);
    return { success: false, message: 'Erro interno ao restaurar item' };
  } finally {
    client.release();
  }
};