import { useState, useEffect } from "react";
import { Clock, Plus, Edit, Trash2, Calendar, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Schedule {
  id: number;
  dentist_id: number;
  dentist_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

interface Dentist {
  id: number;
  name: string;
  specialty: string;
}

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    dentist_id: '',
    selected_days: [] as string[],
    start_time: '',
    end_time: '',
    slot_duration_minutes: 30
  });

  const { toast } = useToast();

  const daysOfWeek = [
    { value: 'Monday', label: 'Segunda-feira' },
    { value: 'Tuesday', label: 'Terça-feira' },
    { value: 'Wednesday', label: 'Quarta-feira' },
    { value: 'Thursday', label: 'Quinta-feira' },
    { value: 'Friday', label: 'Sexta-feira' },
    { value: 'Saturday', label: 'Sábado' },
    { value: 'Sunday', label: 'Domingo' }
  ];

  useEffect(() => {
    fetchSchedules();
    fetchDentists();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/schedules', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        toast({ title: "Erro", description: "Falha ao buscar horários", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar horários", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDentists = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/dentists', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDentists(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dentistas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSchedule && formData.selected_days.length === 0) {
      toast({ 
        title: "Erro", 
        description: "Selecione pelo menos um dia da semana", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      if (editingSchedule) {
        // Edição - um horário específico
        const response = await fetch(`http://localhost:3000/api/schedules/${editingSchedule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            dentist_id: parseInt(formData.dentist_id),
            day_of_week: formData.selected_days[0], // Para edição, usa apenas o primeiro dia
            start_time: formData.start_time,
            end_time: formData.end_time,
            slot_duration_minutes: formData.slot_duration_minutes
          }),
        });

        if (response.ok) {
          toast({ 
            title: "Sucesso", 
            description: "Horário atualizado com sucesso!",
            variant: "default"
          });
        } else {
          const error = await response.json();
          toast({ 
            title: "Erro", 
            description: error.message || "Falha ao atualizar horário", 
            variant: "destructive" 
          });
        }
      } else {
        // Criação - múltiplos dias
        let successCount = 0;
        let errorCount = 0;
        
        for (const day of formData.selected_days) {
          try {
            const response = await fetch('http://localhost:3000/api/schedules', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                dentist_id: parseInt(formData.dentist_id),
                day_of_week: day,
                start_time: formData.start_time,
                end_time: formData.end_time,
                slot_duration_minutes: formData.slot_duration_minutes
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast({ 
            title: "Sucesso", 
            description: `${successCount} horário(s) criado(s) com sucesso!${errorCount > 0 ? ` ${errorCount} falharam.` : ''}`,
            variant: "default"
          });
        } else {
          toast({ 
            title: "Erro", 
            description: "Falha ao criar horários", 
            variant: "destructive" 
          });
        }
      }
      
      setIsDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha ao salvar horário", 
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      dentist_id: schedule.dentist_id.toString(),
      selected_days: [schedule.day_of_week],
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration_minutes: schedule.slot_duration_minutes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/schedules/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({ 
          title: "Sucesso", 
          description: "Horário excluído com sucesso!",
          variant: "default"
        });
        fetchSchedules();
      } else {
        toast({ 
          title: "Erro", 
          description: "Falha ao excluir horário", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha ao excluir horário", 
        variant: "destructive" 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      dentist_id: '',
      selected_days: [],
      start_time: '',
      end_time: '',
      slot_duration_minutes: 30
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      selected_days: prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day]
    }));
  };

  const getDayLabel = (day: string) => {
    return daysOfWeek.find(d => d.value === day)?.label || day;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds
  };

  // Agrupar horários por dentista
  const schedulesByDentist = schedules.reduce((acc, schedule) => {
    const dentistName = schedule.dentist_name || 'Dentista Desconhecido';
    if (!acc[dentistName]) {
      acc[dentistName] = [];
    }
    acc[dentistName].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Horários dos Dentistas</h1>
            <p className="mt-1 text-primary-foreground/80">Gerencie os horários de trabalho dos dentistas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => {
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Horário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Editar Horário' : 'Novo Horário'}
                </DialogTitle>
                <DialogDescription>
                  {editingSchedule ? 'Edite as informações do horário' : 'Adicione um novo horário para o dentista'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dentist_id">Dentista</Label>
                  <Select 
                    value={formData.dentist_id} 
                    onValueChange={(value) => setFormData({...formData, dentist_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um dentista" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist.id} value={dentist.id.toString()}>
                          {dentist.name} - {dentist.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {editingSchedule ? 'Dia da Semana' : 'Dias da Semana (Seleção Múltipla)'}
                  </Label>
                  {editingSchedule ? (
                    // Para edição, mostrar apenas um select simples
                    <Select 
                      value={formData.selected_days[0] || ''} 
                      onValueChange={(value) => setFormData({...formData, selected_days: [value]})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    // Para criação, mostrar checkboxes para seleção múltipla
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                      {daysOfWeek.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.value}
                            checked={formData.selected_days.includes(day.value)}
                            onCheckedChange={() => handleDayToggle(day.value)}
                          />
                          <Label 
                            htmlFor={day.value} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  {!editingSchedule && formData.selected_days.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.selected_days.map(day => (
                        <Badge key={day} variant="secondary" className="text-xs">
                          {daysOfWeek.find(d => d.value === day)?.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Horário Início</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Horário Fim</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot_duration_minutes">Duração dos Slots (minutos)</Label>
                  <Select 
                    value={formData.slot_duration_minutes.toString()} 
                    onValueChange={(value) => setFormData({...formData, slot_duration_minutes: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSchedule ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p>Carregando horários...</p>
            </CardContent>
          </Card>
        ) : Object.keys(schedulesByDentist).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum horário cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(schedulesByDentist).map(([dentistName, dentistSchedules]) => (
              <Card key={dentistName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {dentistName}
                    <Badge variant="secondary" className="ml-auto">
                      {dentistSchedules.length} horário{dentistSchedules.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {dentistSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-all hover:bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{getDayLabel(schedule.day_of_week)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Slots de {schedule.slot_duration_minutes}min
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este horário? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(schedule.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}