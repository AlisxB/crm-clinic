import pool from '../config/database';

export const getAllAppointments = async () => {
  const result = await pool.query('SELECT * FROM appointments');
  return result.rows;
};

export const getAppointmentById = async (id: string) => {
  const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
  return result.rows[0];
};

export const createAppointment = async (appointment: any) => {
  const { patient_id, dentist_id, service_id, start_time, end_time, type, notes, status } = appointment;

  // Verifica se o horário é no passado
  const appointmentDate = new Date(start_time);
  const now = new Date();
  
  if (appointmentDate < now) {
    throw new Error('Não é possível agendar consultas em horários passados.');
  }

  // Verifica se já existe uma consulta no mesmo horário para o mesmo dentista
  const conflictResult = await pool.query(
    'SELECT id FROM appointments WHERE dentist_id = $1 AND start_time = $2',
    [dentist_id, start_time]
  );

  if (conflictResult.rows.length > 0) {
    throw new Error('Conflito de agendamento: O horário selecionado não está disponível.');
  }

  const result = await pool.query(
    'INSERT INTO appointments (patient_id, dentist_id, service_id, start_time, end_time, type, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [patient_id, dentist_id, service_id, start_time, end_time, type, notes, status]
  );
  return result.rows[0];
};

export const updateAppointment = async (id: string, appointment: any) => {
  const { patient_id, dentist_id, service_id, start_time, end_time, type, notes, status } = appointment;

  // Verifica se o horário é no passado
  const appointmentDate = new Date(start_time);
  const now = new Date();
  
  if (appointmentDate < now) {
    throw new Error('Não é possível reagendar consultas para horários passados.');
  }

  // Verifica se já existe uma consulta no mesmo horário para o mesmo dentista, excluindo o agendamento atual
  const conflictResult = await pool.query(
    'SELECT id FROM appointments WHERE dentist_id = $1 AND start_time = $2 AND id != $3',
    [dentist_id, start_time, id]
  );

  if (conflictResult.rows.length > 0) {
    throw new Error('Conflito de agendamento: O horário selecionado não está disponível.');
  }

  const result = await pool.query(
    'UPDATE appointments SET patient_id = $1, dentist_id = $2, start_time = $3, end_time = $4, type = $5, notes = $6, status = $7, service_id = $8 WHERE id = $9 RETURNING *',
    [patient_id, dentist_id, start_time, end_time, type, notes, status, service_id, id]
  );
  return result.rows[0];
};

export const deleteAppointment = async (id: string) => {
  const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
