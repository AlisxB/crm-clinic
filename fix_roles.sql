-- Criar tabela de roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir roles padrão
INSERT INTO roles (name, display_name, description) VALUES
('admin', 'Administrador', 'Acesso total ao sistema, pode gerenciar usuários e configurações'),
('dentist', 'Dentista', 'Acesso aos pacientes, agendamentos e dados clínicos'),
('receptionist', 'Recepcionista', 'Acesso aos agendamentos, pacientes e finanças'),
('viewer', 'Visualizador', 'Acesso apenas para visualização de dados')
ON CONFLICT (name) DO NOTHING;

-- Adicionar role_id na tabela users se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role_id') THEN
        ALTER TABLE users ADD COLUMN role_id INTEGER;
    END IF;
END $$;

-- Atualizar role_id baseado no nome do role
UPDATE users SET role_id = r.id 
FROM roles r 
WHERE users.role = r.name;

-- Adicionar foreign key constraint se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_role_id'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_role_id 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Adicionar role_id na tabela role_permissions se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='role_id') THEN
        ALTER TABLE role_permissions ADD COLUMN role_id INTEGER;
    END IF;
END $$;

-- Atualizar role_id na tabela role_permissions
UPDATE role_permissions SET role_id = r.id 
FROM roles r 
WHERE role_permissions.role = r.name;

-- Adicionar foreign key constraint na role_permissions se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_role_permissions_role_id'
    ) THEN
        ALTER TABLE role_permissions 
        ADD CONSTRAINT fk_role_permissions_role_id 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Criar view para facilitar consultas
CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT 
    u.id,
    u.username,
    u.name,
    u.role as role_name,
    r.id as role_id,
    r.display_name as role_display_name,
    r.description as role_description,
    r.is_active as role_is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.name;

-- Criar view para permissões
CREATE OR REPLACE VIEW v_role_permissions AS
SELECT 
    rp.id,
    r.id as role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    r.description as role_description,
    rp.module,
    rp.can_access,
    rp.can_create,
    rp.can_edit,
    rp.can_delete,
    rp.can_view_all,
    rp.created_at,
    rp.updated_at
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.is_active = TRUE
ORDER BY r.name, rp.module;

-- Verificar resultado
SELECT 'Usuários com roles:' as info;
SELECT id, username, name, role, role_id FROM users;

SELECT 'Roles cadastrados:' as info;
SELECT * FROM roles;
