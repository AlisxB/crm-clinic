import { useState, useEffect } from "react";
import { History as HistoryIcon, User, Calendar, Filter, Search, Eye, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  entity_name?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export default function History() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [groupBy, setGroupBy] = useState<'date' | 'user' | 'entity'>('date');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleRestore = async (log: AuditLog) => {
    if (log.action !== 'DELETE') return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/audit/restore/${log.id}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({ 
          title: "Sucesso", 
          description: `Item "${log.entity_name}" foi restaurado com sucesso!`,
          variant: "default"
        });
        
        // Recarregar logs após restauração
        fetchAuditLogs();
      } else {
        const error = await response.json();
        toast({ 
          title: "Erro", 
          description: error.message || "Falha ao restaurar item", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha ao restaurar item", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchQuery, actionFilter, entityFilter]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/audit?limit=200', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      } else {
        toast({ title: "Erro", description: "Falha ao buscar histórico", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar histórico", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por ação
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Filtro por entidade
    if (entityFilter !== "all") {
      filtered = filtered.filter(log => log.entity_type === entityFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredLogs(filtered);
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return "bg-success/10 text-success hover:bg-success/20";
      case 'update':
        return "bg-warning/10 text-warning hover:bg-warning/20";
      case 'delete':
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      case 'login':
        return "bg-primary/10 text-primary hover:bg-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getActionText = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'Criou';
      case 'update': return 'Atualizou';
      case 'delete': return 'Excluiu';
      case 'login': return 'Fez login';
      default: return action;
    }
  };

  const getEntityText = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'patients': return 'Paciente';
      case 'appointments': return 'Agendamento';
      case 'dentists': return 'Dentista';
      case 'users': return 'Usuário';
      case 'finances': return 'Registro Financeiro';
      default: return entityType;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const uniqueEntities = [...new Set(auditLogs.map(log => log.entity_type))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Histórico do Sistema</h1>
            <p className="mt-1 text-primary-foreground/80">Acompanhe todas as ações realizadas no sistema</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Estatísticas Resumidas */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                  ➕
                </div>
                <div>
                  <p className="text-sm font-medium">Criações</p>
                  <p className="text-2xl font-bold text-success">
                    {auditLogs.filter(log => log.action === 'CREATE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                  ✏️
                </div>
                <div>
                  <p className="text-sm font-medium">Atualizações</p>
                  <p className="text-2xl font-bold text-warning">
                    {auditLogs.filter(log => log.action === 'UPDATE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                  🗑️
                </div>
                <div>
                  <p className="text-sm font-medium">Exclusões</p>
                  <p className="text-2xl font-bold text-destructive">
                    {auditLogs.filter(log => log.action === 'DELETE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  📊
                </div>
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {auditLogs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por usuário, entidade ou ação..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {getActionText(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as entidades</SelectItem>
                    {uniqueEntities.map(entity => (
                      <SelectItem key={entity} value={entity}>
                        {getEntityText(entity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agrupar por</Label>
                <Select value={groupBy} onValueChange={(value: 'date' | 'user' | 'entity') => setGroupBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="entity">Entidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordenação</Label>
                <Select value={sortOrder} onValueChange={(value: 'desc' | 'asc') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Mais recente primeiro</SelectItem>
                    <SelectItem value="asc">Mais antigo primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Logs Organizada */}
        <div className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <p>Carregando histórico...</p>
              </CardContent>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
              </CardContent>
            </Card>
          ) : (
            // Agrupar logs dinamicamente
            Object.entries(
              filteredLogs.reduce((groups, log) => {
                let groupKey = '';
                switch (groupBy) {
                  case 'date':
                    groupKey = format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR });
                    break;
                  case 'user':
                    groupKey = log.user_name;
                    break;
                  case 'entity':
                    groupKey = getEntityText(log.entity_type);
                    break;
                }
                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(log);
                return groups;
              }, {} as Record<string, AuditLog[]>)
            ).map(([groupKey, logs]) => (
              <Card key={groupKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {groupBy === 'date' && <Calendar className="h-5 w-5" />}
                    {groupBy === 'user' && <User className="h-5 w-5" />}
                    {groupBy === 'entity' && <HistoryIcon className="h-5 w-5" />}
                    {groupKey}
                    <Badge variant="secondary" className="ml-auto">
                      {logs.length} atividade{logs.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-all hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            log.action === 'CREATE' ? 'bg-success/20' :
                            log.action === 'UPDATE' ? 'bg-warning/20' :
                            log.action === 'DELETE' ? 'bg-destructive/20' :
                            'bg-primary/20'
                          }`}>
                            {log.action === 'CREATE' ? '➕' :
                             log.action === 'UPDATE' ? '✏️' :
                             log.action === 'DELETE' ? '🗑️' :
                             log.action === 'CANCEL' ? '❌' : '📝'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{log.user_name}</span>
                              <Badge className={getActionColor(log.action)} variant="outline">
                                {getActionText(log.action)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {getEntityText(log.entity_type)}
                              </span>
                              {log.entity_name && (
                                <span className="font-medium text-sm">"{log.entity_name}"</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.created_at), "HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.action === 'DELETE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(log)}
                              className="flex items-center gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restaurar
                            </Button>
                          )}
                          <Dialog open={isDetailsOpen && selectedLog?.id === log.id} onOpenChange={setIsDetailsOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes da Atividade</DialogTitle>
                              <DialogDescription>
                                Informações completas sobre esta ação
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">Usuário</Label>
                                    <p>{selectedLog.user_name}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Ação</Label>
                                    <Badge className={getActionColor(selectedLog.action)}>
                                      {getActionText(selectedLog.action)}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">Entidade</Label>
                                    <p>{getEntityText(selectedLog.entity_type)}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Nome da Entidade</Label>
                                    <p>{selectedLog.entity_name || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="font-semibold">Data e Hora</Label>
                                  <p>{formatDate(selectedLog.created_at)}</p>
                                </div>
                                {selectedLog.ip_address && (
                                  <div>
                                    <Label className="font-semibold">Endereço IP</Label>
                                    <p>{selectedLog.ip_address}</p>
                                  </div>
                                )}
                                {selectedLog.details && (
                                  <div>
                                    <Label className="font-semibold">Detalhes</Label>
                                    <pre className="mt-2 rounded bg-muted p-2 text-sm max-h-40 overflow-y-auto">
                                      {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}