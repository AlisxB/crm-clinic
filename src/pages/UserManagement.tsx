import { useState, useEffect } from "react";
import { useAuth, User } from "@/contexts/AuthContext";
import { useDentists } from "@/contexts/DentistContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserManagement() {
  const { currentUser } = useAuth();
  const { refreshDentists } = useDentists();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfirmAddDialogOpen, setIsConfirmAddDialogOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "viewer",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar usuários", variant: "destructive" });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      console.log('Enviando dados do usuário:', newUser);
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Usuário criado com sucesso" });
        setNewUser({ username: "", password: "", name: "", role: "viewer" });
        setIsAddDialogOpen(false);
        setIsConfirmAddDialogOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao criar usuário", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar usuário", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === "1") {
      toast({ title: "Erro", description: "Não é possível excluir o administrador padrão", variant: "destructive" });
      return;
    }

    // Verificar se o usuário é um dentista antes de excluir
    const userToDelete = users.find(user => user.id === id);
    const isDentist = userToDelete?.role === 'dentist';

    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Usuário excluído com sucesso" });
        fetchUsers();
        
        // Se era um dentista, sincronizar tabelas e atualizar
        if (isDentist) {
          console.log('🔥 Usuário dentista excluído, sincronizando tabelas');
          
          // Chamar endpoint de sincronização
          try {
            const syncResponse = await fetch('http://localhost:3000/api/users/sync-dentists', {
              method: 'POST',
            });
            
            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              console.log('✅ Sincronização concluída:', syncData);
            }
          } catch (syncError) {
            console.error('❌ Erro na sincronização:', syncError);
          }
          
          // Usar localStorage para comunicar mudança
          localStorage.setItem('dentists_updated', Date.now().toString());
          console.log('📝 LocalStorage atualizado');
          
          // Disparar evento customizado
          window.dispatchEvent(new CustomEvent('dentists_updated'));
          console.log('📡 Evento customizado disparado');
          
          // Tentar usar o Context se disponível
          try {
            refreshDentists();
            console.log('🔄 Context refreshDentists chamado');
          } catch (error) {
            console.log('❌ Context não disponível, usando eventos');
          }
        }
      } else {
        toast({ title: "Erro", description: "Falha ao excluir usuário", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir usuário", variant: "destructive" });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-destructive text-destructive-foreground";
      case "dentist": return "bg-primary text-primary-foreground";
      case "receptionist": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (currentUser?.role_name !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">Gerencie usuários e atribua funções</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Todos os usuários registrados no sistema</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>Adicione um novo usuário ao sistema</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input id="username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="johndoe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="dentist">Dentista</SelectItem>
                        <SelectItem value="receptionist">Recepcionista</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" className="w-full" onClick={() => setIsConfirmAddDialogOpen(true)}>Criar Usuário</Button>
                </form>
              </DialogContent>
            </Dialog>
            <AlertDialog open={isConfirmAddDialogOpen} onOpenChange={setIsConfirmAddDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Criação de Usuário</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a criar o seguinte usuário:
                    <br />
                    <b>Nome:</b> {newUser.name}<br />
                    <b>Nome de Usuário:</b> {newUser.username}<br />
                    <b>Função:</b> {newUser.role}
                    <br />
                    Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddUser}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Nome de Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell><Badge className={getRoleBadgeColor(user.role_name)}>{user.role_name}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.id !== "1" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário 
                                <b>{user.name}</b> e removerá seus dados de nossos servidores.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
