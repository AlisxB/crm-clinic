import { Request, Response } from 'express';
import pool from '../config/database';

export const getPermissionsByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;

    const result = await pool.query(
      `SELECT rp.*, r.name as role, r.display_name as role_display_name 
       FROM role_permissions rp 
       JOIN roles r ON rp.role_id = r.id 
       WHERE r.name = $1 
       ORDER BY rp.module`,
      [role]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM v_role_permissions ORDER BY role_name, module'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar todas as permissões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const { role, module } = req.params;
    const { can_access, can_create, can_edit, can_delete, can_view_all } = req.body;

    const result = await pool.query(
      `UPDATE role_permissions 
       SET can_access = $3, can_create = $4, can_edit = $5, 
           can_delete = $6, can_view_all = $7, updated_at = CURRENT_TIMESTAMP
       FROM roles r
       WHERE role_permissions.role_id = r.id AND r.name = $1 AND role_permissions.module = $2
       RETURNING role_permissions.*, r.name as role`,
      [role, module, can_access, can_create, can_edit, can_delete, can_view_all]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { role, module, can_access, can_create, can_edit, can_delete, can_view_all } = req.body;

    const result = await pool.query(
      `INSERT INTO role_permissions (role, module, can_access, can_create, can_edit, can_delete, can_view_all)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [role, module, can_access, can_create, can_edit, can_delete, can_view_all]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar permissão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { role, module } = req.params;

    const result = await pool.query(
      `DELETE FROM role_permissions 
       USING roles r
       WHERE role_permissions.role_id = r.id AND r.name = $1 AND role_permissions.module = $2 
       RETURNING role_permissions.*`,
      [role, module]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    res.json({ message: 'Permissão removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover permissão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, display_name, description, is_active FROM roles WHERE is_active = TRUE ORDER BY name'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getModules = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT module FROM role_permissions ORDER BY module'
    );

    res.json(result.rows.map((row: any) => row.module));
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Novos endpoints para gerenciar roles
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, display_name, description } = req.body;

    const result = await pool.query(
      'INSERT INTO roles (name, display_name, description) VALUES ($1, $2, $3) RETURNING *',
      [name, display_name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar role:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { display_name, description, is_active } = req.body;

    const result = await pool.query(
      'UPDATE roles SET display_name = $2, description = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id, display_name, description, is_active]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se há usuários usando este role
    const usersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role_id = $1',
      [id]
    );

    if (parseInt(usersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir um role que está sendo usado por usuários' 
      });
    }

    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role não encontrado' });
    }

    res.json({ message: 'Role removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover role:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};