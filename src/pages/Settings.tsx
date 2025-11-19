import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, Users, Bell, Shield, Key, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "../contexts/PermissionContext";

interface Permission {
  id: number;
  role: string;
  role_name: string;
  module: string;
  can_access: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_all: boolean;
}

export default function Settings() {
  const { currentUser } = useAuth();
  const { refreshPermissions } = usePermissions();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const settingsSections = [
    {
      id: 'clinic-info',
      icon: Building,
      title: "Informações da Clínica",
      description: "Atualize os detalhes da clínica, endereço e informações de contato",
    },
    {
      id: 'users',
      icon: Users,
      title: "Gerenciamento de Usuários",
      description: "Gerencie as contas da equipe e as permissões de acesso",
    },
    {
      id: 'permissions',
      icon: Key,
      title: "Permissões",
      description: "Configure permissões por perfil e módulos do sistema",
    },
    {
      id: 'notifications',
      icon: Bell,
      title: "Notificações",
      description: "Defina as configurações de notificação por e-mail e SMS",
    },
    {
      id: 'security',
      icon: Shield,
      title: "Segurança",
      description: "Políticas de senha e autenticação de dois fatores",
    },
  ];

  useEffect(() => {
    if (activeSection === 'permissions') {
      loadPermissions();
    }
  }, [activeSection]);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole, permissions]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      const permissionsResponse = await fetch('http://localhost:3000/api/permissions', {
        credentials: 'include'
      });
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);
        
        const uniqueRoles = [...new Set(permissionsData.map((p: Permission) => p.role_name))] as string[];
        setRoles(uniqueRoles);
        
        if (uniqueRoles.length > 0 && !selectedRole) {
          setSelectedRole(uniqueRoles[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = (role: string) => {
    const rolePerms = permissions.filter(p => p.role_name === role);
    setRolePermissions(rolePerms);
  };

  const handlePermissionChange = async (
    role: string, 
    module: string, 
    field: keyof Permission, 
    value: boolean
  ) => {
    try {
      setSaving(true);
      
      const currentPermission = rolePermissions.find(p => p.role_name === role && p.module === module);
      if (!currentPermission) return;

      const updatedData = {
        ...currentPermission,
        [field]: value
      };

      const response = await fetch(`http://localhost:3000/api/permissions/${role}/${module}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setRolePermissions(prev => 
          prev.map(p => 
            p.role_name === role && p.module === module 
              ? { ...p, [field]: value }
              : p
          )
        );
        
        setPermissions(prev => 
          prev.map(p => 
            p.role_name === role && p.module === module 
              ? { ...p, [field]: value }
              : p
          )
        );
        
        alert('Permissão atualizada com sucesso!');
        
        // Recarregar permissões para atualizar o menu
        await refreshPermissions();
      } else {
        alert('Erro ao atualizar permissão');
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      alert('Erro ao atualizar permissão');
    } finally {
      setSaving(false);
    }
  };

  const getModuleDisplayName = (module: string) => {
    const moduleNames: Record<string, string> = {
      dashboard: 'Dashboard',
      patients: 'Pacientes',
      dentists: 'Dentistas',
      appointments: 'Agendamentos',
      schedules: 'Horários',
      finances: 'Financeiro',
      users: 'Usuários',
      history: 'Histórico',
      settings: 'Configurações'
    };
    return moduleNames[module] || module;
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrador',
      dentist: 'Dentista',
      receptionist: 'Recepcionista',
      viewer: 'Visualizador'
    };
    return roleNames[role] || role;
  };

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === 'permissions') {
      setActiveSection('permissions');
    } else {
      alert(`Configuração de ${settingsSections.find(s => s.id === sectionId)?.title} em desenvolvimento`);
    }
  };

  // Verificar se o usuário é admin para permissões
  if (activeSection === 'permissions' && currentUser?.role_name !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-gradient-primary px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">Configurações</h1>
              <p className="mt-1 text-primary-foreground/80">Gerencie a configuração e as preferências da clínica</p>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">Apenas administradores podem acessar as configurações de permissões.</p>
              <Button 
                onClick={() => setActiveSection(null)}
                className="mt-4"
                variant="outline"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'permissions') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-gradient-primary px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">Permissões</h1>
              <p className="mt-1 text-primary-foreground/80">Configure permissões por perfil e módulos do sistema</p>
            </div>
            <Button 
              onClick={() => setActiveSection(null)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Gerenciamento de Permissões por Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Seletor de Role */}
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        variant={selectedRole === role ? "default" : "outline"}
                        className="transition-all"
                      >
                        {getRoleDisplayName(role)}
                      </Button>
                    ))}
                  </div>

                  {/* Tabela de Permissões */}
                  {selectedRole && (
                    <div className="border rounded-lg overflow-hidden bg-background">
                      <div className="bg-muted px-6 py-3 border-b">
                        <h3 className="font-semibold text-foreground">
                          Permissões para {getRoleDisplayName(selectedRole)}
                        </h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Módulo
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Acessar
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Criar
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Editar
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Excluir
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Ver Todos
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            {rolePermissions.map((permission) => (
                              <tr key={`${permission.role}-${permission.module}`} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-foreground">
                                    {getModuleDisplayName(permission.module)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={permission.can_access}
                                    onChange={(e) => 
                                      handlePermissionChange(permission.role, permission.module, 'can_access', e.target.checked)
                                    }
                                    disabled={saving}
                                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={permission.can_create}
                                    onChange={(e) => 
                                      handlePermissionChange(permission.role, permission.module, 'can_create', e.target.checked)
                                    }
                                    disabled={saving || !permission.can_access}
                                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={permission.can_edit}
                                    onChange={(e) => 
                                      handlePermissionChange(permission.role, permission.module, 'can_edit', e.target.checked)
                                    }
                                    disabled={saving || !permission.can_access}
                                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={permission.can_delete}
                                    onChange={(e) => 
                                      handlePermissionChange(permission.role, permission.module, 'can_delete', e.target.checked)
                                    }
                                    disabled={saving || !permission.can_access}
                                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={permission.can_view_all}
                                    onChange={(e) => 
                                      handlePermissionChange(permission.role, permission.module, 'can_view_all', e.target.checked)
                                    }
                                    disabled={saving || !permission.can_access}
                                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Configurações</h1>
            <p className="mt-1 text-primary-foreground/80">Gerencie a configuração e as preferências da clínica</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Card key={section.title} className="transition-all hover:shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{section.description}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSectionClick(section.id)}
                >
                  Configurar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Settings */}
        <Card className="mt-8 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm font-medium text-foreground">Versão</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm font-medium text-foreground">Último Backup</span>
                <span className="text-sm text-muted-foreground">2024-10-01 08:30 AM</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm font-medium text-foreground">Tamanho do Banco de Dados</span>
                <span className="text-sm text-muted-foreground">245 MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Usuários Ativos</span>
                <span className="text-sm text-muted-foreground">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}