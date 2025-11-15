import { useState, useEffect } from "react";
import { Users, Calendar as CalendarIcon, DollarSign, Activity, Clock, UserPlus, Phone } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
  phone?: string;
}

interface Service {
  id_servico: number;
  nome_servico: string;
}

interface PresentDentist extends Dentist {
  start_time: string;
  end_time: string;
}

interface Finance {
  id: number;
  patient_id: number;
  description: string;
  amount: number;
  date: string;
  type: string;
}

export default function Dashboard() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [activeDentists, setActiveDentists] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isDentistModalOpen, setIsDentistModalOpen] = useState(false);
  const [presentDentists, setPresentDentists] = useState<PresentDentist[]>([]);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isConfirmPatientDialogOpen, setIsConfirmPatientDialogOpen] = useState(false);
  const [isConfirmAppointmentDialogOpen, setIsConfirmAppointmentDialogOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isAppointmentDatePopoverOpen, setIsAppointmentDatePopoverOpen] = useState(false);
  const [pendingPatientData, setPendingPatientData] = useState<any>(null);
  const [pendingAppointmentData, setPendingAppointmentData] = useState<any>(null);
  const currentYear = new Date().getFullYear();

  const { toast } = useToast();
  const { currentUser } = useAuth();



  useEffect(() => {
    fetchDashboardData();
    fetchActiveDentistsToday();
  }, []);

  const fetchActiveDentistsToday = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/dentists/active-today');
      if (response.ok) {
        const data: PresentDentist[] = await response.json();
        setPresentDentists(data);
        const uniqueDentists = new Set(data.map(d => d.id));
        setActiveDentists(uniqueDentists.size);
      } else {
        toast({ title: "Erro", description: "Falha ao buscar dentistas presentes", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de Rede", description: "Não foi possível conectar ao servidor para buscar dentistas.", variant: "destructive" });
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch Patients
      const patientsResponse = await fetch('http://localhost:3000/api/patients');
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
        setTotalPatients(patientsData.length);
      }

      // Fetch Dentists
      const dentistsResponse = await fetch('http://localhost:3000/api/dentists');
      if (dentistsResponse.ok) {
        const dentistsData = await dentistsResponse.json();
        setDentists(dentistsData);
      }

      // Fetch Services
      const servicesResponse = await fetch('http://localhost:3000/api/services', { credentials: 'include' });
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData);
      }

      // Fetch Appointments
      const appointmentsResponse = await fetch('http://localhost:3000/api/appointments');
      if (appointmentsResponse.ok) {
        const appointmentsData: Appointment[] = await appointmentsResponse.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filteredTodayAppointments = appointmentsData.filter(app => {
          const appDate = new Date(app.start_time);
          return appDate >= today && appDate < tomorrow;
        });
        setTodayAppointments(filteredTodayAppointments.length);

        const filteredUpcomingAppointments = appointmentsData.filter(app => {
          const appDate = new Date(app.start_time);
          return appDate >= today;
        }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        setUpcomingAppointments(filteredUpcomingAppointments);
      }

      // Fetch Finances
      const financesResponse = await fetch('http://localhost:3000/api/finances');
      if (financesResponse.ok) {
        const financesData: Finance[] = await financesResponse.json();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyIncome = financesData
          .filter(f => new Date(f.date).getMonth() === currentMonth && new Date(f.date).getFullYear() === currentYear && f.type === 'income')
          .reduce((sum, f) => sum + f.amount, 0);
        setMonthlyRevenue(monthlyIncome);
      }

    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar dados do painel", variant: "destructive" });
      console.error("Error fetching dashboard data:", error);
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

  const handleNewPatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPatient = Object.fromEntries(formData.entries());

    if (dateOfBirth) {
      newPatient.date_of_birth = format(dateOfBirth, "yyyy-MM-dd");
    }

    setPendingPatientData(newPatient);
    setIsConfirmPatientDialogOpen(true);
  };

  const confirmCreatePatient = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingPatientData),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Paciente adicionado com sucesso" });
        setIsNewPatientModalOpen(false);
        setIsConfirmPatientDialogOpen(false);
        setDateOfBirth(undefined);
        setPendingPatientData(null);
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao adicionar paciente", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao adicionar paciente", variant: "destructive" });
    }
  };

  const handleNewAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appointmentData = Object.fromEntries(formData.entries());

    if (appointmentDate) {
      const startTime = new Date(appointmentDate);
      const [hours, minutes] = (appointmentData.time as string).split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      const newAppointment = {
        patient_id: parseInt(appointmentData.patient_id as string),
        dentist_id: parseInt(appointmentData.dentist_id as string),
        service_id: parseInt(appointmentData.service_id as string),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: appointmentData.notes || '',
        status: 'pending'
      };

      setPendingAppointmentData(newAppointment);
      setIsConfirmAppointmentDialogOpen(true);
    }
  };

  const confirmCreateAppointment = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingAppointmentData),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Consulta agendada com sucesso" });
        setIsAppointmentModalOpen(false);
        setIsConfirmAppointmentDialogOpen(false);
        setAppointmentDate(undefined);
        setPendingAppointmentData(null);
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao agendar consulta", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao agendar consulta", variant: "destructive" });
    }
  };

  const groupedPresentDentists = presentDentists.reduce((acc, dentist) => {
    let group = acc.find(d => d.id === dentist.id);
    if (!group) {
      group = { ...dentist, schedules: [] };
      acc.push(group);
    }
    group.schedules.push({ start_time: dentist.start_time, end_time: dentist.end_time });
    return acc;
  }, [] as (PresentDentist & { schedules: { start_time: string; end_time: string }[] })[]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3x1 font-bold text-primary-foreground">Painel</h1>
            <p className="mt-1 text-primary-foreground/80">Bem-vindo de volta! Aqui está a visão geral da sua clínica.</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-card text-primary hover:bg-card/90" onClick={() => setIsNewPatientModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
            <Button className="bg-card text-primary hover:bg-card/90" onClick={() => setIsAppointmentModalOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Agendar Consulta
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          {currentUser?.role_name !== 'receptionist' && (
            <StatCard
              title="Total de Pacientes"
              value={totalPatients.toString()}
              icon={Users}
              trend={{ value: "", positive: true }} // Trend data not available from backend yet
            />
          )}
          <StatCard
            title="Consultas de Hoje"
            value={todayAppointments.toString()}
            icon={CalendarIcon}
            trend={{ value: "", positive: true }} // Trend data not available from backend yet
          />
          {currentUser?.role_name === 'admin' && (
            <StatCard
              title="Receita Mensal"
              value={`R$${monthlyRevenue.toFixed(2)}`}
              icon={DollarSign}
              trend={{ value: "", positive: true }} // Trend data not available from backend yet
            />
          )}
          <Dialog open={isDentistModalOpen} onOpenChange={setIsDentistModalOpen}>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Dentistas Ativos"
                  value={activeDentists.toString()}
                  icon={Activity}
                  trend={{ value: "", positive: true }}
                />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Dentistas Presentes Hoje</DialogTitle>
                <DialogDescription>Lista de dentistas com horário de trabalho hoje.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {groupedPresentDentists.length > 0 ? (
                  groupedPresentDentists.map((dentist) => (
                    <div key={dentist.id} className="p-2 rounded-md border">
                      <h3 className="font-semibold text-lg">{dentist.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{dentist.phone}</span>
                      </div>
                      <div className="mt-2">
                        <h4 className="font-medium text-sm mb-1">Horários:</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {dentist.schedules.map((schedule, index) => (
                            <li key={index} className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Nenhum dentista presente hoje.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-2 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-sm font-bold">
                          {format(new Date(appointment.start_time), "d")}
                        </span>
                        <span className="text-xs">
                          {format(new Date(appointment.start_time), "MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{getPatientName(appointment.patient_id)}</p>
                        <p className="text-sm text-muted-foreground">{getServiceName(appointment.service_id)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{new Date(appointment.start_time).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm text-muted-foreground">{getDentistName(appointment.dentist_id)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsNewPatientModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Novo Paciente
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsAppointmentModalOpen(true)}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Agendar Consulta
              </Button>
              {currentUser?.role_name !== 'receptionist' && (
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar Pagamento
                </Button>
              )}
              {currentUser?.role_name !== 'receptionist' && (
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="mr-2 h-4 w-4" />
                  Ver Relatórios
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agendar Nova Consulta</DialogTitle>
            <DialogDescription>Preencha os dados para agendar uma nova consulta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewAppointment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente</Label>
                <select id="patient_id" name="patient_id" required className="w-full p-2 border border-border rounded-md">
                  <option value="">Selecione um paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dentist_id">Dentista</Label>
                <select id="dentist_id" name="dentist_id" required className="w-full p-2 border border-border rounded-md">
                  <option value="">Selecione um dentista</option>
                  {dentists.map((dentist) => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_id">Serviço</Label>
                <select id="service_id" name="service_id" required className="w-full p-2 border border-border rounded-md">
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service.id_servico} value={service.id_servico}>
                      {service.nome_servico}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input id="time" name="time" type="time" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Data da Consulta</Label>
              <Popover open={isAppointmentDatePopoverOpen} onOpenChange={setIsAppointmentDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    locale={ptBR}
                    mode="single"
                    selected={appointmentDate}
                    onSelect={(date) => {
                      setAppointmentDate(date);
                      setIsAppointmentDatePopoverOpen(false);
                    }}
                    initialFocus
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" placeholder="Observações sobre a consulta..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAppointmentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Agendar Consulta</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Novo Paciente</DialogTitle>
            <DialogDescription>Insira as informações do paciente para criar um novo prontuário</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required placeholder="john@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" required placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateOfBirth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth ? format(dateOfBirth, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      locale={ptBR}
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={(date) => {
                        setDateOfBirth(date);
                        setIsDatePopoverOpen(false);
                      }}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={currentYear - 120}
                      toYear={currentYear}
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" required placeholder="123.456.789-00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" placeholder="123 Main St, City, State" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical_history">Histórico Médico</Label>
              <Textarea id="medical_history" name="medical_history" placeholder="Alergias, condições, medicamentos..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNewPatientModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Paciente</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação para criar paciente */}
      <AlertDialog open={isConfirmPatientDialogOpen} onOpenChange={setIsConfirmPatientDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Criação de Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a criar um novo paciente com os seguintes dados:
              <br />
              <b>Nome:</b> {pendingPatientData?.name}<br />
              <b>E-mail:</b> {pendingPatientData?.email}<br />
              <b>Telefone:</b> {pendingPatientData?.phone}
              <br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreatePatient}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação para criar agendamento */}
      <AlertDialog open={isConfirmAppointmentDialogOpen} onOpenChange={setIsConfirmAppointmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a agendar uma consulta com os seguintes dados:
              <br />
              <b>Paciente:</b> {patients.find(p => p.id === pendingAppointmentData?.patient_id)?.name}<br />
              <b>Dentista:</b> {dentists.find(d => d.id === pendingAppointmentData?.dentist_id)?.name}<br />
              <b>Data:</b> {appointmentDate ? format(appointmentDate, "PPP", { locale: ptBR }) : ''}
              <br />
              Deseja confirmar este agendamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreateAppointment}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
