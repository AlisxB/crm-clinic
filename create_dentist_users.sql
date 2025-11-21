-- Criar usuários para os dentistas existentes

-- Dr. Emily Smith
INSERT INTO users (username, password, name, role, role_id) 
VALUES (
  'emily.smith', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
  'Dr. Emily Smith', 
  'dentist',
  2
) ON CONFLICT (username) DO NOTHING;

-- Dr. Michael Brown
INSERT INTO users (username, password, name, role, role_id) 
VALUES (
  'michael.brown', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
  'Dr. Michael Brown', 
  'dentist',
  2
) ON CONFLICT (username) DO NOTHING;

-- Verificar resultado
SELECT id, username, name, role, role_id FROM users ORDER BY id;
