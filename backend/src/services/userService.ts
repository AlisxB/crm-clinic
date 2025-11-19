import pool from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const getAllUsers = async () => {
  try {
    // Tentar com a view nova
    const result = await pool.query('SELECT id, username, name, role_id, role_name FROM v_users_with_roles WHERE role_is_active = true');
    return result.rows;
  } catch (error) {
    // Fallback para estrutura antiga
    const result = await pool.query('SELECT id, username, name, role as role_name FROM users');
    return result.rows;
  }
};

export const login = async (credentials: any) => {
  const { username, password } = credentials;
  
  console.log(`🔐 Tentando login para usuário: ${username}`);
  
  // Usar estrutura antiga (sem roles table) diretamente
  const result = await pool.query(`
    SELECT id, username, password, name, role as role_name 
    FROM users 
    WHERE username = $1
  `, [username]);
  
  console.log(`📊 Usuários encontrados: ${result.rows.length}`);
  
  const user = result.rows[0];
  if (user) {
    console.log(`👤 Usuário encontrado: ${user.name}`);
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(`🔑 Senha corresponde: ${passwordMatch}`);
    
    if (passwordMatch) {
      const { password, ...userWithoutPassword } = user;
      const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name, role_name: user.role_name },
        process.env.JWT_SECRET || 'dental-clinic-secret-key-2024',
        { expiresIn: '1h' }
      );
      console.log(`✅ Login bem-sucedido para: ${user.name}`);
      return { token, user: userWithoutPassword };
    }
  }
  
  console.log(`❌ Login falhou para: ${username}`);
  return null;
};

export const getUserById = async (id: string) => {
  try {
    const result = await pool.query('SELECT id, username, name, role_id, role_name FROM v_users_with_roles WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    const result = await pool.query('SELECT id, username, name, role as role_name FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
};

export const createUser = async (user: any) => {
  const { username, password, name, role } = user;
  
  // Verificar se o usuário já existe
  const existingUser = await pool.query('SELECT id, username FROM users WHERE username = $1', [username]);
  if (existingUser.rows.length > 0) {
    const error = new Error('Nome de usuário já existe');
    (error as any).code = '23505';
    (error as any).constraint = 'users_username_key';
    throw error;
  }
  
  // Buscar role_id pelo nome do role
  const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1 AND is_active = true', [role]);
  if (roleResult.rows.length === 0) {
    throw new Error(`Role '${role}' não encontrado ou inativo`);
  }
  const role_id = roleResult.rows[0].id;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, password, name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, username, name, role_id',
    [username, hashedPassword, name, role_id]
  );
  
  // Retornar com role_name
  const userWithRole = await pool.query('SELECT id, username, name, role_id, role_name FROM v_users_with_roles WHERE id = $1', [result.rows[0].id]);
  return userWithRole.rows[0];
};

export const updateUser = async (id: string, user: any) => {
  const { username, name, role } = user;
  
  // Buscar role_id pelo nome do role
  const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1 AND is_active = true', [role]);
  if (roleResult.rows.length === 0) {
    throw new Error(`Role '${role}' não encontrado ou inativo`);
  }
  const role_id = roleResult.rows[0].id;
  
  const result = await pool.query(
    'UPDATE users SET username = $1, name = $2, role_id = $3 WHERE id = $4 RETURNING id, username, name, role_id',
    [username, name, role_id, id]
  );
  
  // Retornar com role_name
  const userWithRole = await pool.query('SELECT id, username, name, role_id, role_name FROM v_users_with_roles WHERE id = $1', [id]);
  return userWithRole.rows[0];
};

export const deleteUser = async (id: string) => {
  const result = await pool.query('UPDATE users SET is_deleted = true, deleted_at = NOW() WHERE id = $1 RETURNING id, username, name, role_id', [id]);
  return result.rows[0];
};

export const seedAdminUser = async () => {
  const username = 'admin';
  const password = 'admin';
  const name = 'Admin User';
  const role = 'admin';

  // Verifica se o usuário já existe
  const existingUser = await pool.query('SELECT id, username FROM users WHERE username = $1', [username]);
  if (existingUser.rows.length > 0) {
    throw new Error('Admin user already exists.');
  }

  // Buscar role_id pelo nome do role
  const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1 AND is_active = true', [role]);
  if (roleResult.rows.length === 0) {
    throw new Error(`Role '${role}' não encontrado ou inativo`);
  }
  const role_id = roleResult.rows[0].id;

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, password, name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, username, name, role_id',
    [username, hashedPassword, name, role_id]
  );
  
  // Retornar com role_name
  const userWithRole = await pool.query('SELECT id, username, name, role_id, role_name FROM v_users_with_roles WHERE id = $1', [result.rows[0].id]);
  return userWithRole.rows[0];
};
