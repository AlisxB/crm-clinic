import { Request, Response } from 'express';
import * as serviceService from '../services/serviceService';

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching service', error: error.message });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating service', error: error.message });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const updatedService = await serviceService.updateService(req.params.id, req.body);
    if (updatedService) {
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating service', error: error.message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const deletedService = await serviceService.deleteService(req.params.id);
    if (deletedService) {
      res.json({ message: 'Service deactivated successfully' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error deactivating service', error: error.message });
  }
};
