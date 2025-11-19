import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as dentistService from '../services/dentistService';
import * as receptionistService from '../services/receptionistService';
import { setAuditData } from '../middleware/auditMiddleware';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const authResult = await userService.login(req.body);
    if (authResult) {
      const { token, user } = authResult;
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 3600000, // 1 hour
        path: '/',
      });
      res.json(user);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const seedAdminUser = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.seedAdminUser();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error seeding admin user', error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    console.log('Dados recebidos no backend:', req.body);
    console.log('Role recebida:', req.body.role);
    const newUser = await userService.createUser(req.body);
    
    // Se o usuário criado tem role "dentist", criar também um registro na tabela dentists
    if (req.body.role === 'dentist') {
      const dentistData = {
        name: req.body.name,
        specialty: req.body.specialty || 'Odontologia Geral',
        email: `${req.body.username}@clinica.com`, // Email consistente baseado no username
        phone: req.body.phone || '',
        experience: req.body.experience || '0 anos',
        patients: 0,
        specializations: req.body.specializations || ['Odontologia Geral']
      };
      
      // Criar registro na tabela dentists
      await dentistService.createDentist(dentistData);
    }
    
    // Se o usuário criado tem role "receptionist", criar também um registro na tabela receptionists
    if (req.body.role === 'receptionist') {
      const receptionistData = {
        name: req.body.name,
        email: `${req.body.username}@clinica.com`, // Email consistente baseado no username
        phone: req.body.phone || '',
        shift: req.body.shift || 'full',
        hire_date: new Date().toISOString().split('T')[0], // Data atual
        experience: req.body.experience || '0 anos',
        permissions: req.body.permissions || ['basic']
      };
      
      // Criar registro na tabela receptionists
      await receptionistService.createReceptionist(receptionistData);
    }
    
    // Adicionar log de auditoria
    if (req.user) {
      setAuditData(
        req,
        req.user.id,
        req.user.name,
        'CREATE',
        'users',
        newUser.id,
        newUser.name,
        { 
          created_user: req.body,
          is_dentist: req.body.role === 'dentist'
        }
      );
    }
    
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Verificar se é erro de usuário duplicado
    if (error.code === '23505' && error.constraint === 'users_username_key') {
      return res.status(400).json({ message: 'Nome de usuário já existe. Escolha outro nome de usuário.' });
    }
    
    // Verificar se é erro de email duplicado na tabela dentists
    if (error.code === '23505' && error.constraint === 'dentists_email_key') {
      return res.status(400).json({ message: 'Email já cadastrado para outro dentista.' });
    }
    
    // Outros erros de constraint
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Dados já cadastrados no sistema.' });
    }
    
    res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    console.log(`🗑️ Tentando excluir usuário ID: ${req.params.id}`);
    
    // Primeiro, verificar se o usuário existe e buscar dados completos
    const pool = require('../config/database').default;
    const userResult = await pool.query(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = $1
    `, [req.params.id]);
    
    if (userResult.rows.length === 0) {
      console.log(`❌ Usuário não encontrado: ${req.params.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];

    console.log(`👤 Usuário encontrado: ${user.name}, Role: ${user.role_name}`);

    let dentistData = null;

    // Se o usuário é um dentista, buscar dados do dentista antes de excluir
    if (user.role_name === 'dentist') {
      console.log(`🦷 Usuário é dentista, coletando dados antes da exclusão`);
      
      try {
        // Buscar dentista pelo nome exato
        const dentists = await dentistService.getAllDentists();
        const dentistToDelete = dentists.find((d: any) => d.name === user.name);
        
        if (dentistToDelete) {
          console.log(`🎯 Dados do dentista coletados: ${dentistToDelete.name}`);
          dentistData = dentistToDelete;
        }
      } catch (dentistError) {
        console.error('❌ Erro ao coletar dados do dentista:', dentistError);
      }
    }

    // Dados coletados para auditoria - agora usando soft delete

    // Excluir o usuário
    const deletedUser = await userService.deleteUser(req.params.id);
    if (deletedUser) {
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'DELETE',
          'users',
          parseInt(req.params.id),
          user.name,
          { 
            deleted_user: user,
            was_dentist: user.role_name === 'dentist',
            dentist_data: dentistData 
          }
        );
      }
      
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('session_token', { path: '/' });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const checkSession = (req: any, res: Response) => {
  // O middleware authenticateToken já validou o token e anexou o usuário ao req
  res.status(200).json(req.user);
};

export const deleteUserWithDentist = async (req: Request, res: Response) => {
  try {
    console.log(`🗑️ Excluindo usuário e dentista - ID: ${req.params.id}`);
    
    // Primeiro, verificar se o usuário existe e qual é o seu role
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      console.log(`❌ Usuário não encontrado: ${req.params.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`👤 Usuário encontrado: ${user.name}, Role: ${user.role_name}`);
    
    let dentistData = null;

    // Se o usuário é um dentista, coletar dados e excluir da tabela dentists PRIMEIRO
    if (user.role_name === 'dentist') {
      console.log(`🦷 Usuário é dentista, coletando dados e excluindo da tabela dentists primeiro`);
      
      try {
        // Buscar dentista pelo nome exato
        const dentists = await dentistService.getAllDentists();
        const dentistToDelete = dentists.find((d: any) => d.name === user.name);
        
        if (dentistToDelete) {
          console.log(`🎯 Dados do dentista coletados: ${dentistToDelete.name}`);
          dentistData = dentistToDelete;
        }
      } catch (dentistError) {
        console.error('❌ Erro ao coletar dados do dentista:', dentistError);
      }
      
      try {
        // Buscar dentista pelo nome exato
        const dentists = await dentistService.getAllDentists();
        console.log(`📋 Dentistas encontrados: ${dentists.length}`);
        
        const dentistToDelete = dentists.find((d: any) => d.name === user.name);
        
        if (dentistToDelete) {
          console.log(`🎯 Dentista encontrado para exclusão: ${dentistToDelete.name} (ID: ${dentistToDelete.id})`);
          await dentistService.deleteDentist(dentistToDelete.id.toString());
          console.log(`✅ Dentista excluído: ${user.name}`);
        } else {
          console.warn(`⚠️ Nenhum dentista encontrado com nome: ${user.name}`);
        }
      } catch (dentistError) {
        console.error('❌ Erro ao excluir dentista:', dentistError);
        return res.status(500).json({ message: 'Erro ao excluir dentista', error: dentistError });
      }
    }

    // Depois excluir o usuário
    console.log(`🗑️ Excluindo usuário: ${user.name}`);
    const deletedUser = await userService.deleteUser(req.params.id);
    
    if (deletedUser) {
      console.log(`✅ Usuário excluído com sucesso: ${user.name}`);
      
      // Adicionar log de auditoria
      if (req.user) {
        setAuditData(
          req,
          req.user.id,
          req.user.name,
          'DELETE',
          'users',
          parseInt(req.params.id),
          user.name,
          { 
            deleted_user: user,
            was_dentist: user.role_name === 'dentist',
            dentist_data: dentistData 
          }
        );
      }
      
      res.json({ 
        message: 'User and dentist deleted successfully',
        deletedUser: user.name,
        wasDentist: user.role_name === 'dentist'
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export const getDeletedUsers = async (req: Request, res: Response) => {
  try {
    console.log('📋 Buscando usuários excluídos');
    const pool = require('../config/database').default;
    
    const result = await pool.query(
      `SELECT u.id, u.username, u.name, r.name as role_name, u.deleted_at, u.deleted_by 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.is_deleted = true 
       ORDER BY u.deleted_at DESC`
    );
    
    console.log(`✅ Encontrados ${result.rows.length} usuários excluídos`);
    res.json(result.rows);
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuários excluídos:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários excluídos', error: error.message });
  }
};

export const syncDentists = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Sincronizando tabelas users e dentists');
    
    // Buscar todos os usuários dentistas
    const dentistUsers = await userService.getAllUsers();
    const dentistUsersFiltered = dentistUsers.filter((user: any) => user.role_name === 'dentist');
    
    // Buscar todos os dentistas
    const allDentists = await dentistService.getAllDentists();
    
    // Remover dentistas órfãos (que não têm usuário correspondente)
    const dentistUserNames = dentistUsersFiltered.map((user: any) => user.name);
    const orphanDentists = allDentists.filter((dentist: any) => !dentistUserNames.includes(dentist.name));
    
    console.log(`🗑️ Removendo ${orphanDentists.length} dentistas órfãos`);
    
    for (const orphan of orphanDentists) {
      await dentistService.deleteDentist(orphan.id.toString());
      console.log(`✅ Dentista órfão removido: ${orphan.name}`);
    }
    
    res.json({ 
      message: 'Sincronização concluída',
      removedOrphans: orphanDentists.length,
      orphanNames: orphanDentists.map((d: any) => d.name)
    });
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);
    res.status(500).json({ message: 'Erro na sincronização', error: error.message });
  }
};
