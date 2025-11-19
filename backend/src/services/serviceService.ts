import pool from '../config/database';

export const getAllServices = async () => {
  const result = await pool.query('SELECT * FROM services ORDER BY id_servico');
  return result.rows;
};

export const getServiceById = async (id: string) => {
  const result = await pool.query('SELECT * FROM services WHERE id_servico = $1', [id]);
  return result.rows[0];
};

export const createService = async (service: any) => {
  const { nome_servico, descricao, valor_aproximado, duracao_media_min, palavras_chave, ativo } = service;
  const result = await pool.query(
    'INSERT INTO services (nome_servico, descricao, valor_aproximado, duracao_media_min, palavras_chave, ativo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [nome_servico, descricao, valor_aproximado, duracao_media_min, palavras_chave, ativo]
  );
  return result.rows[0];
};

export const updateService = async (id: string, service: any) => {
  const { nome_servico, descricao, valor_aproximado, duracao_media_min, palavras_chave, ativo } = service;
  const result = await pool.query(
    'UPDATE services SET nome_servico = $1, descricao = $2, valor_aproximado = $3, duracao_media_min = $4, palavras_chave = $5, ativo = $6, updated_at = CURRENT_TIMESTAMP WHERE id_servico = $7 RETURNING *',
    [nome_servico, descricao, valor_aproximado, duracao_media_min, palavras_chave, ativo, id]
  );
  return result.rows[0];
};

export const deleteService = async (id: string) => {
  // Em vez de deletar, podemos apenas marcar como inativo
  const result = await pool.query(
    'UPDATE services SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id_servico = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};
