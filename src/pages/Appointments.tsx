import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, Stethoscope, Info, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: number;
  patient_id: number;
  dentist_id: number;
  start_time: string;
  end_time: string;
  service_id: number;
  notes: string;
  status: string;
}

interface Patient {
  id: number;
  name: string;
}

interface Dentist {
  id: number;
  name: string;
}

interface Service {
  id_servico: number;
  nome_servico: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDentistId, setSelectedDentistId] = useState<string>("");
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | undefined>();
  const [newAppointmentTime, setNewAppointmentTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDentists();
    fetchServices();

    const queryParams = new URLSearchParams(location.search);
    const dentistIdFromUrl = queryParams.get('dentistId');
    if (dentistIdFromUrl) {
      setSelectedDentistId(dentistIdFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (isRescheduleDialogOpen && selectedAppointmentForReschedule && newAppointmentDate) {
        setIsLoadingTimes(true);
        setAvailableTimes([]);
        setNewAppointmentTime(null);
        try {
          const date = newAppointmentDate.toISOString().split('T')[0];
          const response = await fetch(`http://localhost:3000/api/dentists/${selectedAppointmentForReschedule.dentist_id}/available-slots?date=${date}`);
          if (response.ok) {
            const data: { start_time: string }[] = await response.json();
            const formattedTimes = data.map(slot => {
              const date = new Date(slot.start_time);
              return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            });
            setAvailableTimes(formattedTimes);
          } else {
            toast({ title: "Erro", description: "Falha ao buscar horários disponíveis", variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Erro", description: "Falha ao buscar horários disponíveis", variant: "destructive" });
        }
        setIsLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
  }, [isRescheduleDialogOpen, selectedAppointmentForReschedule, newAppointmentDate, toast]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar agendamentos", variant: "destructive" });
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar pacientes", variant: "destructive" });
    }
  };

  const fetchDentists = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/dentists');
      if (response.ok) {
        const data = await response.json();
        setDentists(data);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar dentistas", variant: "destructive" });
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/services', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar serviços", variant: "destructive" });
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? patient.name : "Desconhecido";
  };

  const getDentistName = (dentistId: number) => {
    const dentist = dentists.find((d) => d.id === dentistId);
    return dentist ? dentist.name : "Desconhecido";
  };

  const getServiceName = (serviceId: number) => {
    const service = services.find((s) => s.id_servico === serviceId);
    return service ? service.nome_servico : "Serviço não encontrado";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success hover:bg-success/20";
      case "pending":
        return "bg-warning/10 text-warning hover:bg-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentForReschedule || !newAppointmentDate || !newAppointmentTime) {
      toast({ title: "Erro", description: "Por favor, selecione uma nova data e hora.", variant: "destructive" });
      return;
    }

    // 1. Criar a nova data de início baseada na seleção do usuário
    const [hours, minutes] = newAppointmentTime.split(':').map(Number);
    const newStartTime = new Date(newAppointmentDate);
    newStartTime.setHours(hours, minutes, 0, 0);

    // 2. Calcular a duração da consulta original
    const originalStartTime = new Date(selectedAppointmentForReschedule.start_time);
    const originalEndTime = new Date(selectedAppointmentForReschedule.end_time);
    const duration = originalEndTime.getTime() - originalStartTime.getTime();

    // 3. Calcular a nova data de término
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // 4. Enviar os dados para a API no formato ISO (UTC)
    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${selectedAppointmentForReschedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Incluir credenciais se a rota for protegida
          // credentials: 'include',
        },
        body: JSON.stringify({
          ...selectedAppointmentForReschedule,
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'pending',
        }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Agendamento reagendado com sucesso." });
        setIsRescheduleDialogOpen(false);
        fetchAppointments();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao reagendar.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Ocorreu um erro de rede.", variant: "destructive" });
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Agendamento cancelado com sucesso" });
        fetchAppointments();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao cancelar agendamento", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao cancelar agendamento", variant: "destructive" });
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    const isSameDay = selectedDate ? appointmentDate.toDateString() === selectedDate.toDateString() : true;
    const isSelectedDentist = selectedDentistId ? appointment.dentist_id === parseInt(selectedDentistId) : true;
    return isSameDay && isSelectedDentist;
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Agendamentos</h1>
            <p className="mt-1 text-primary-foreground/80">Agende e gerencie os agendamentos</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Calendar View */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Visualização do Calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="mx-auto"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dentist-filter">Filtrar por Dentista</Label>
                <select
                  id="dentist-filter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedDentistId}
                  onChange={(e) => setSelectedDentistId(e.target.value)}
                >
                  <option value="">Todos os Dentistas</option>
                  {dentists.map(dentist => (
                    <option key={dentist.id} value={dentist.id}>{dentist.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Agendamentos para {selectedDate?.toLocaleDateString("pt-BR") || "hoje"}</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map(appointment => (
                      <div key={appointment.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{getPatientName(appointment.patient_id)}</p>
                          <p className="text-sm text-muted-foreground">{getServiceName(appointment.service_id)} com {getDentistName(appointment.dentist_id)}</p>
                        </div>
                        <p className="text-sm font-medium">{`${new Date(appointment.start_time).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}`}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center">Nenhum agendamento para esta data/dentista.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Todos os Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const appointmentDate = new Date(appointment.start_time);

                if (isNaN(appointmentDate.getTime())) {
                  // Optional: Log error for debugging
                  // console.error("Invalid date value for appointment:", appointment);
                  return (
                    <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/10 p-4">
                      <p className="text-sm font-medium text-destructive">
                        Erro: A data para este agendamento é inválida.
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-2xl font-bold text-primary">
                          {format(appointmentDate, "d")}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {format(appointmentDate, "MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{getPatientName(appointment.patient_id)}</h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointmentDate.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Stethoscope className="h-4 w-4" />
                            {getDentistName(appointment.dentist_id)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {getServiceName(appointment.service_id)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedAppointmentForReschedule(appointment);
                        setNewAppointmentDate(appointmentDate);
                        setIsRescheduleDialogOpen(true);
                      }}>
                        Reagendar
                      </Button>
                      <Dialog open={isDetailsDialogOpen && selectedAppointmentForDetails?.id === appointment.id} onOpenChange={setIsDetailsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm" onClick={() => setSelectedAppointmentForDetails(appointment)}>
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes do Agendamento</DialogTitle>
                            <DialogDescription>
                              Informações completas sobre a consulta.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAppointmentForDetails && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Paciente</h4>
                                  <p>{getPatientName(selectedAppointmentForDetails.patient_id)}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Dentista</h4>
                                  <p>{getDentistName(selectedAppointmentForDetails.dentist_id)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Data</h4>
                                  <p>{new Date(selectedAppointmentForDetails.start_time).toLocaleDateString("pt-BR")}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Hora</h4>
                                  <p>{new Date(selectedAppointmentForDetails.start_time).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                  <h4 className="font-semibold">Tipo</h4>
                                  <p>{getServiceName(selectedAppointmentForDetails.service_id)}</p>
                                </div>
                                 <div>
                                  <h4 className="font-semibold">Status</h4>
                                  <Badge className={getStatusColor(selectedAppointmentForDetails.status)}>
                                    {selectedAppointmentForDetails.status}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold">Notas</h4>
                                <p className="text-muted-foreground">{selectedAppointmentForDetails.notes || "Nenhuma nota."}</p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {appointment.status !== 'cancelled' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar este agendamento com 
                                <b> {getPatientName(appointment.patient_id)}</b>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Não, manter agendamento</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelAppointment(appointment.id)}>
                                Sim, cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reagendar Consulta</DialogTitle>
              <DialogDescription>
                Selecione a nova data e hora para o agendamento.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointmentForReschedule && (
                <form onSubmit={handleReschedule} className="space-y-4">
                    <div className="flex justify-center">
                        <DayPicker
                            mode="single"
                            selected={newAppointmentDate}
                            onSelect={setNewAppointmentDate}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Novos Horários Disponíveis</Label>
                        {isLoadingTimes ? (
                          <p>Carregando horários...</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {availableTimes.length > 0 ? availableTimes.map(time => (
                                <Button
                                    key={time}
                                    type="button"
                                    variant={newAppointmentTime === time ? "default" : "outline"}
                                    onClick={() => setNewAppointmentTime(time)}
                                >
                                    {time}
                                </Button>
                            )) : <p>Nenhum horário disponível para esta data.</p>}
                          </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsRescheduleDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Confirmar Reagendamento</Button>
                    </div>
                </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
