import pool from '../config/database';

export const getDentistSchedules = async (dentistId: number) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dentist_schedules WHERE dentist_id = $1 ORDER BY day_of_week, start_time',
      [dentistId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar horários do dentista:', error);
    throw error;
  }
};

export const getAllSchedules = async () => {
  try {
    const result = await pool.query(
      `SELECT ds.*, d.name as dentist_name 
       FROM dentist_schedules ds 
       JOIN dentists d ON ds.dentist_id = d.id 
       ORDER BY d.name, ds.day_of_week, ds.start_time`
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar todos os horários:', error);
    throw error;
  }
};

export const createSchedule = async (scheduleData: any) => {
  try {
    const { dentist_id, day_of_week, start_time, end_time, slot_duration_minutes } = scheduleData;
    
    const result = await pool.query(
      `INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, slot_duration_minutes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dentist_id, day_of_week, start_time, end_time, slot_duration_minutes || 30]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar horário:', error);
    throw error;
  }
};

export const updateSchedule = async (id: number, scheduleData: any) => {
  try {
    const { day_of_week, start_time, end_time, slot_duration_minutes } = scheduleData;
    
    const result = await pool.query(
      `UPDATE dentist_schedules 
       SET day_of_week = $1, start_time = $2, end_time = $3, slot_duration_minutes = $4 
       WHERE id = $5 RETURNING *`,
      [day_of_week, start_time, end_time, slot_duration_minutes, id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar horário:', error);
    throw error;
  }
};

export const deleteSchedule = async (id: number) => {
  try {
    const result = await pool.query(
      'DELETE FROM dentist_schedules WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao excluir horário:', error);
    throw error;
  }
};