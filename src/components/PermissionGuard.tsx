import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface PermissionGuardProps {
  module: string;
  action?: 'access' | 'create' | 'edit' | 'delete' | 'view_all';
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action = 'access',
  children
}) => {
  const { hasPermission, loading } = usePermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission(module, action)) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-16 w-16 text-primary-foreground/60 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-primary-foreground mb-2">Acesso Negado</h2>
              <p className="text-primary-foreground/80 mb-4">
                Você não tem permissão para acessar este módulo.
              </p>
              <Button 
                onClick={() => navigate('/')}
                variant="secondary"
              >
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};