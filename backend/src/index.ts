import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import pool from './config/database';
import patientRoutes from './routes/patientRoutes';
import userRoutes from './routes/userRoutes';
import dentistRoutes from './routes/dentistRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import financeRoutes from './routes/financeRoutes';
import serviceRoutes from './routes/serviceRoutes';
import auditRoutes from './routes/auditRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import receptionistRoutes from './routes/receptionistRoutes';
import permissionRoutes from './routes/permissions';
import { auditMiddleware } from './middleware/auditMiddleware';
import { extractUserFromToken } from './middleware/authMiddleware';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:8081', credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(extractUserFromToken);
app.use(auditMiddleware);

app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dentists', dentistRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/permissions', permissionRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json(result.rows);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
