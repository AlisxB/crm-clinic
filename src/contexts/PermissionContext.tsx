import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Permission {
  id: number;
  role: string;
  module: string;
  can_access: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_all: boolean;
}

interface PermissionContextType {
  permissions: Permission[];
  hasPermission: (module: string, action?: 'access' | 'create' | 'edit' | 'delete' | 'view_all') => boolean;
  refreshPermissions: () => Promise<void>;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!currentUser) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/permissions/role/${currentUser.role_name}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPermissions();
    }
  }, [currentUser]);

  const hasPermission = (module: string, action: 'access' | 'create' | 'edit' | 'delete' | 'view_all' = 'access'): boolean => {
    // Admin sempre tem acesso
    if (currentUser?.role_name === 'admin') {
      return true;
    }

    const permission = permissions.find(p => p.module === module);
    if (!permission) {
      return false;
    }

    switch (action) {
      case 'access':
        return permission.can_access;
      case 'create':
        return permission.can_create;
      case 'edit':
        return permission.can_edit;
      case 'delete':
        return permission.can_delete;
      case 'view_all':
        return permission.can_view_all;
      default:
        return false;
    }
  };

  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  return (
    <PermissionContext.Provider value={{
      permissions,
      hasPermission,
      refreshPermissions,
      loading
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};