import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SettingsTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Tentando buscar permissões...');
        const response = await fetch('http://localhost:3000/api/permissions', {
          credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        setPermissions(data);
      } catch (err) {
        console.error('Erro ao buscar permissões:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Configurações</h1>
        <p>Usuário não autenticado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Configurações</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Configurações</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erro:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <strong>Sucesso!</strong> Dados carregados com sucesso.
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Usuário Atual:</h2>
        <p>Nome: {currentUser.name}</p>
        <p>Role: {currentUser.role_name}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Permissões ({permissions.length}):</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SettingsTest;