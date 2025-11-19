import pool from '../config/database';

const parseDentist = (dentist: any) => {
  if (dentist && typeof dentist.specializations === 'string') {
    dentist.specializations = dentist.specializations.replace(/[{}]/g, '').split(',');
  }
  return dentist;
};

export const getAllDentists = async () => {
  const result = await pool.query('SELECT * FROM dentists');
  return result.rows.map(parseDentist);
};

export const getDentistById = async (id: string) => {
  const result = await pool.query('SELECT * FROM dentists WHERE id = $1', [id]);
  return parseDentist(result.rows[0]);
};

export const createDentist = async (dentist: any) => {
  const { name, specialty, email, phone, experience, patients, specializations } = dentist;
  const result = await pool.query(
    'INSERT INTO dentists (name, specialty, email, phone, experience, patients, specializations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, specialty, email, phone, experience, patients, specializations]
  );
  return parseDentist(result.rows[0]);
};

export const updateDentist = async (id: string, dentist: any) => {
  const { name, specialty, email, phone, experience, patients, specializations } = dentist;
  const result = await pool.query(
    'UPDATE dentists SET name = $1, specialty = $2, email = $3, phone = $4, experience = $5, patients = $6, specializations = $7 WHERE id = $8 RETURNING *',
    [name, specialty, email, phone, experience, patients, specializations, id]
  );
  return parseDentist(result.rows[0]);
};

export const deleteDentist = async (id: string) => {
  const result = await pool.query('DELETE FROM dentists WHERE id = $1 RETURNING *', [id]);
  return parseDentist(result.rows[0]);
};

// Funções para gerenciar horários de atendimento do dentista
export const getDentistSchedules = async (dentistId: string) => {
  const result = await pool.query('SELECT * FROM dentist_schedules WHERE dentist_id = $1', [dentistId]);
  return result.rows;
};

export const createDentistSchedule = async (dentistId: string, schedule: any) => {
  const { day_of_week, start_time, end_time, slot_duration_minutes } = schedule;
  const result = await pool.query(
    'INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [dentistId, day_of_week, start_time, end_time, slot_duration_minutes]
  );
  return result.rows[0];
};

export const updateDentistSchedule = async (scheduleId: string, schedule: any) => {
  const { day_of_week, start_time, end_time, slot_duration_minutes } = schedule;
  const result = await pool.query(
    'UPDATE dentist_schedules SET day_of_week = $1, start_time = $2, end_time = $3, slot_duration_minutes = $4 WHERE id = $5 RETURNING *',
    [day_of_week, start_time, end_time, slot_duration_minutes, scheduleId]
  );
  return result.rows[0];
};

export const deleteDentistSchedule = async (scheduleId: string) => {
  const result = await pool.query('DELETE FROM dentist_schedules WHERE id = $1 RETURNING *', [scheduleId]);
  return result.rows[0];
};

export const getAvailableSlots = async (dentistId: string, date: string) => {
  // Use UTC para evitar problemas de fuso horário
  const dateObj = new Date(date + 'T00:00:00.000Z');
  const dayIndex = dateObj.getUTCDay();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[dayIndex];

  const schedulesResult = await pool.query(
    'SELECT * FROM dentist_schedules WHERE dentist_id = $1 AND day_of_week = $2',
    [dentistId, dayOfWeek]
  );
  const schedules = schedulesResult.rows;

  if (schedules.length === 0) {
    return [];
  }

  const appointmentsResult = await pool.query(
    'SELECT start_time FROM appointments WHERE dentist_id = $1 AND start_time::date = $2',
    [dentistId, date]
  );
  const bookedStartTimes = appointmentsResult.rows.map(row => new Date(row.start_time).getTime());

  const availableSlots: { start_time: Date, end_time: Date }[] = [];
  const now = new Date();

  for (const schedule of schedules) {
    // Use UTC para criar as datas de início e fim
    const start = new Date(`${date}T${schedule.start_time}Z`);
    const end = new Date(`${date}T${schedule.end_time}Z`);
    const slotDuration = schedule.slot_duration_minutes * 60 * 1000;

    let currentSlotTime = start.getTime();

    while (currentSlotTime + slotDuration <= end.getTime()) {
      const slotStartTime = currentSlotTime;
      const slotStartDate = new Date(slotStartTime);
      
      const isBooked = bookedStartTimes.includes(slotStartTime);
      const isPast = slotStartDate < now;

      // Só adiciona slots que não estão reservados e não são no passado
      if (!isBooked && !isPast) {
        availableSlots.push({
          start_time: new Date(slotStartTime),
          end_time: new Date(slotStartTime + slotDuration),
        });
      }
      currentSlotTime += slotDuration;
    }
  }

  return availableSlots;
};

export const getActiveDentistsToday = async () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayOfWeek = days[today.getDay()];

  const result = await pool.query(
    `SELECT d.id, d.name, d.phone, ds.start_time, ds.end_time 
     FROM dentists d
     JOIN dentist_schedules ds ON d.id = ds.dentist_id
     WHERE ds.day_of_week = $1
     ORDER BY d.name, ds.start_time`,
    [dayOfWeek]
  );

  return result.rows;
};

export const getAvailableSlotsForWeek = async (dentistIds: string[]) => {
  const slotsByDentist: { [key: string]: { [key: string]: any[] } } = {};

  let targetDentistIds: string[] = dentistIds;
  if (targetDentistIds.length === 0) {
    const allDentists = await getAllDentists();
    targetDentistIds = allDentists.map(d => String(d.id));
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + i);
    const dateString = date.toISOString().split('T')[0];

    for (const dentistId of targetDentistIds) {
      if (!slotsByDentist[dentistId]) {
        slotsByDentist[dentistId] = {};
      }
      const availableSlots = await getAvailableSlots(dentistId, dateString);
      slotsByDentist[dentistId][dateString] = availableSlots;
    }
  }

  return slotsByDentist;
};