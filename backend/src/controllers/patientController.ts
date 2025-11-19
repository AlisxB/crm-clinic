import { Request, Response } from 'express';
import * as patientService from '../services/patientService';
import { setAuditData } from '../middleware/auditMiddleware';

export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const patients = await patientService.getAllPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients', error });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient', error });
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const newPatient = await patientService.createPatient(req.body);

    // Adicionar log de auditoria
    if (req.user) {
      setAuditData(
        req,
        req.user.id,
        req.user.name,
        'CREATE',
        'patients',
        newPatient.id,
        newPatient.name,
        { patient_data: req.body }
      );
    }

    res.status(201).json(newPatient);
  } catch (error: any) {
    if (error.message.includes('cadastrado')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating patient', error: error.message });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const updatedPatient = await patientService.updatePatient(req.params.id, req.body);
    if (updatedPatient) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'UPDATE',
          'patients',
          updatedPatient.id,
          updatedPatient.name,
          { updated_data: req.body }
        );
      }

      res.json(updatedPatient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating patient', error });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const deletedPatient = await patientService.deletePatient(req.params.id);
    if (deletedPatient) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'DELETE',
          'patients',
          deletedPatient.id,
          deletedPatient.name,
          { deleted_patient: deletedPatient }
        );
      }

      res.json({ message: 'Patient deleted successfully' });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient', error });
  }
};
