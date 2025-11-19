import pool from '../config/database';

export const getAllReceptionists = async () => {
  try {
    const result = await pool.query('SELECT * FROM receptionists WHERE is_deleted = false OR is_deleted IS NULL');
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar recepcionistas:', error);
    throw error;
  }
};

export const getReceptionistById = async (id: string) => {
  try {
    const result = await pool.query('SELECT * FROM receptionists WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar recepcionista:', error);
    throw error;
  }
};

export const createReceptionist = async (receptionist: any) => {
  try {
    const { name, email, phone, shift, hire_date, experience, permissions } = receptionist;
    
    const result = await pool.query(
      `INSERT INTO receptionists (name, email, phone, shift, hire_date, experience, permissions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, phone, shift || 'full', hire_date, experience || '0 anos', permissions || ['basic']]
    );
    
    return result.rows[0];
  } catch (error: any) {
    console.error('Erro ao criar recepcionista:', error);
    if (error.code === '23505') {
      throw new Error('Este email já está cadastrado para outro recepcionista.');
    }
    throw error;
  }
};

export const updateReceptionist = async (id: string, receptionist: any) => {
  try {
    const { name, email, phone, shift, hire_date, experience, permissions } = receptionist;
    
    const result = await pool.query(
      `UPDATE receptionists 
       SET name = $1, email = $2, phone = $3, shift = $4, hire_date = $5, experience = $6, permissions = $7 
       WHERE id = $8 RETURNING *`,
      [name, email, phone, shift, hire_date, experience, permissions, id]
    );
    
    return result.rows[0];
  } catch (error: any) {
    console.error('Erro ao atualizar recepcionista:', error);
    if (error.code === '23505') {
      throw new Error('Este email já está cadastrado para outro recepcionista.');
    }
    throw error;
  }
};

export const deleteReceptionist = async (id: string, deletedBy?: number) => {
  try {
    const result = await pool.query(
      'UPDATE receptionists SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $2 WHERE id = $1 RETURNING *', 
      [id, deletedBy]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao excluir recepcionista:', error);
    throw error;
  }
};