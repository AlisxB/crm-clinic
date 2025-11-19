import pool from '../config/database';

export const getAllPatients = async () => {
  const result = await pool.query('SELECT * FROM patients');
  return result.rows;
};

export const getPatientById = async (id: string) => {
  const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
  return result.rows[0];
};

export const createPatient = async (patient: any) => {
  const { name, email, phone, date_of_birth, address, medical_history, cpf } = patient;
  try {
    const result = await pool.query(
      'INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history, cpf) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, phone, date_of_birth, address, medical_history, cpf]
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      if (error.constraint === 'patients_email_key') {
        throw new Error('Este email já está cadastrado.');
      }
      if (error.constraint === 'patients_cpf_key') {
        throw new Error('Este CPF já está cadastrado.');
      }
    }
    throw error; // Re-throw other errors
  }
};

export const updatePatient = async (id: string, patient: any) => {
  const { name, email, phone, date_of_birth, address, medical_history, cpf } = patient;
  const result = await pool.query(
    'UPDATE patients SET name = $1, email = $2, phone = $3, date_of_birth = $4, address = $5, medical_history = $6, cpf = $7 WHERE id = $8 RETURNING *',
    [name, email, phone, date_of_birth, address, medical_history, cpf, id]
  );
  return result.rows[0];
};

export const deletePatient = async (id: string) => {
  const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
