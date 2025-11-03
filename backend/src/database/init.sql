-- Tabela de Roles/Perfis
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

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by INTEGER
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    address VARCHAR(255),
    medical_history TEXT,
    cpf VARCHAR(14) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS dentists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    experience VARCHAR(50),
    patients INT,
    specializations TEXT[]
);

-- Tabela para armazenar os serviços oferecidos pela clínica
CREATE TABLE IF NOT EXISTS services (
    id_servico SERIAL PRIMARY KEY,
    nome_servico VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor_aproximado DECIMAL(10, 2) NOT NULL,
    duracao_media_min INT NOT NULL,
    palavras_chave TEXT[],
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    dentist_id INT REFERENCES dentists(id),
    service_id INT REFERENCES services(id_servico),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    type VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS finances (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS dentist_schedules (
    id SERIAL PRIMARY KEY,
    dentist_id INT REFERENCES dentists(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- Ex: 'Monday', 'Tuesday'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    UNIQUE (dentist_id, day_of_week, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS chatbot_sessions (
    session_id VARCHAR(255) PRIMARY KEY, -- Chave primária, ID da execução do n8n
    user_identifier VARCHAR(255) NOT NULL, -- Identificador do usuário, como o telefone
    current_agent VARCHAR(50) NOT NULL DEFAULT 'Porteiro', -- Agente atual, começa com 'Porteiro'
    current_status VARCHAR(50), -- Último estado da conversa
    collected_data JSONB, -- Dados coletados em formato JSON
    conversation_history JSONB, -- Histórico da conversa em formato JSON
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Sessão ativa por padrão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Data de criação
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Criar um índice no identificador do usuário para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_user_identifier ON chatbot_sessions (user_identifier);

-- Tabela de Auditoria/Histórico
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, etc.
    entity_type VARCHAR(50) NOT NULL, -- patients, appointments, dentists, etc.
    entity_id INT,
    entity_name VARCHAR(255),
    details JSONB, -- Detalhes da ação em formato JSON
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Tabela de Permissões por Perfil
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_view_all BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, module)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON role_permissions (module);

-- Mock Data

INSERT INTO services (nome_servico, descricao, valor_aproximado, duracao_media_min, palavras_chave) VALUES
('Consulta de Rotina', 'Check-up geral e avaliação da saúde bucal.', 150.00, 30, ARRAY['checkup', 'avaliação', 'rotina']),
('Limpeza Dental Profissional', 'Remoção de placa bacteriana e tártaro.', 200.00, 45, ARRAY['limpeza', 'profilaxia', 'tártaro']);

INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history, cpf) VALUES
('Sarah Johnson', 'sarah.j@email.com', '(555) 123-4567', '1990-05-15', '123 Main St, City, State', 'Peanut allergy', '111.111.111-11'),
('Michael Chen', 'm.chen@email.com', '(555) 234-5678', '1985-08-20', '456 Oak Ave, City, State', NULL, '222.222.222-22');

INSERT INTO dentists (name, specialty, email, phone, experience, patients, specializations) VALUES
('Dr. Emily Smith', 'Odontologia Geral', 'e.smith@dentalcare.com', '(555) 111-2222', '15 anos', 342, ARRAY['Canal', 'Coroas', 'Cuidados Preventivos']),
('Dr. Michael Brown', 'Ortodontia', 'm.brown@dentalcare.com', '(555) 222-3333', '12 anos', 289, ARRAY['Aparelhos', 'Invisalign', 'Alinhamento de Mandíbula']);

INSERT INTO dentist_schedules (dentist_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES
(1, 'Monday', '09:00:00', '17:00:00', 30),
(1, 'Wednesday', '09:00:00', '17:00:00', 30),
(1, 'Friday', '09:00:00', '17:00:00', 30),
(2, 'Tuesday', '10:00:00', '18:00:00', 60),
(2, 'Thursday', '10:00:00', '18:00:00', 60);

INSERT INTO appointments (patient_id, dentist_id, start_time, end_time, type, notes, status) VALUES
(1, 1, '2024-10-02 09:00:00', '2024-10-02 09:30:00', 'Checkup', NULL, 'confirmed'),
(2, 2, '2024-10-02 10:30:00', '2024-10-02 11:30:00', 'Cleaning', NULL, 'confirmed');

-- Inserir usuário de teste para login
INSERT INTO users (username, password, name, role_id) 
SELECT 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', id FROM roles WHERE name = 'admin'
ON CONFLICT (username) DO NOTHING;

-- Inserir permissões padrão para todos os perfis
-- Administrador - Acesso total a tudo
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dashboard', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'patients', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dentists', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'appointments', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'schedules', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'finances', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'users', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'history', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'settings', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'admin' ON CONFLICT (role_id, module) DO NOTHING;

-- Dentista - Acesso limitado
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dashboard', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'patients', TRUE, TRUE, TRUE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dentists', TRUE, FALSE, TRUE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'appointments', TRUE, TRUE, TRUE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'schedules', TRUE, TRUE, TRUE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'finances', TRUE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'users', FALSE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'history', TRUE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'settings', FALSE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'dentist' ON CONFLICT (role_id, module) DO NOTHING;

-- Recepcionista - Foco em agendamentos e pacientes
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dashboard', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'patients', TRUE, TRUE, TRUE, FALSE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dentists', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'appointments', TRUE, TRUE, TRUE, TRUE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'schedules', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'finances', TRUE, TRUE, TRUE, FALSE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'users', FALSE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'history', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'settings', FALSE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'receptionist' ON CONFLICT (role_id, module) DO NOTHING;

-- Visualizador - Apenas leitura
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dashboard', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'patients', TRUE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'dentists', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'appointments', TRUE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'schedules', TRUE, FALSE, FALSE, FALSE, TRUE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'finances', TRUE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'users', FALSE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'history', TRUE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;
INSERT INTO role_permissions (role_id, module, can_access, can_create, can_edit, can_delete, can_view_all)
SELECT r.id, 'settings', FALSE, FALSE, FALSE, FALSE, FALSE FROM roles r WHERE r.name = 'viewer' ON CONFLICT (role_id, module) DO NOTHING;

-- Views para facilitar consultas
CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT 
    u.id,
    u.username,
    u.name,
    r.name as role_name,
    r.id as role_id,
    r.display_name as role_display_name,
    r.description as role_description,
    r.is_active as role_is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.name;

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
