import { useState, useEffect } from "react";
import { Search, UserPlus, Phone, Mail, Calendar as CalendarIcon, Trash2, Edit } from "lucide-react";
import { PermissionGuard } from "../components/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  status: string;
  date_of_birth?: string;
  cpf?: string;
  address?: string;
  medical_history?: string;
}

interface Dentist {
  id: number;
  name: string;
  specialty: string;
}

interface Service {
  id_servico: number;
  nome_servico: string;
}

interface AvailabilitySlot {
  start_time: string;
  end_time: string;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [availableTimes, setAvailableTimes] = useState<AvailabilitySlot[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isConfirmPatientDialogOpen, setIsConfirmPatientDialogOpen] = useState(false);
  const [pendingPatientData, setPendingPatientData] = useState<any>(null);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editDateOfBirth, setEditDateOfBirth] = useState<Date | undefined>();
  const [isConfirmEditDialogOpen, setIsConfirmEditDialogOpen] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<any>(null);
  
  const { toast } = useToast();
  
  // ALTERAÇÃO 1: Adicionando a variável do ano atual para usar nos calendários
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchPatients();
    fetchDentists();
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (selectedDentistId && selectedDate) {
        setIsLoadingTimes(true);
        setAvailableTimes([]);
        setSelectedTime(null);
        try {
          const response = await fetch(`http://localhost:3000/api/dentists/${selectedDentistId}/available-slots?date=${format(selectedDate, "yyyy-MM-dd")}`);
          if (response.ok) {
            const data: AvailabilitySlot[] = await response.json();
            setAvailableTimes(data);
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
  }, [selectedDentistId, selectedDate, toast]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patients', {
        credentials: 'include',
      });
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
      const response = await fetch('http://localhost:3000/api/services', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar serviços", variant: "destructive" });
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewPatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPatientData = Object.fromEntries(formData.entries());

    if (dateOfBirth) {
      newPatientData.date_of_birth = format(dateOfBirth, "yyyy-MM-dd");
    }

    setPendingPatientData(newPatientData);
    setIsConfirmPatientDialogOpen(true);
  };

  const confirmCreatePatient = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pendingPatientData),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Paciente adicionado com sucesso" });
        setIsNewPatientOpen(false);
        setIsConfirmPatientDialogOpen(false);
        setDateOfBirth(undefined);
        setPendingPatientData(null);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao adicionar paciente", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao adicionar paciente", variant: "destructive" });
    }
  };

  const handleBookAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedDate || !selectedTime) {
      toast({ title: "Erro", description: "Por favor, selecione uma data e horário.", variant: "destructive" });
      return;
    }

    const selectedSlot = availableTimes.find(slot => new Date(slot.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) === selectedTime);

    if (!selectedSlot) {
      toast({ title: "Erro", description: "Horário selecionado não é válido.", variant: "destructive" });
      return;
    }
    
    const appointmentData = {
      dentist_id: formData.get('dentist_id'),
      service_id: formData.get('service_id'),
      notes: formData.get('notes'),
      start_time: new Date(selectedSlot.start_time).toISOString(),
      end_time: new Date(selectedSlot.end_time).toISOString(),
      patient_id: selectedPatient?.id,
      status: 'pending',
    };

    try {
      const response = await fetch('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Consulta agendada com sucesso" });
        setIsBookAppointmentOpen(false);
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao agendar consulta", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao agendar consulta", variant: "destructive" });
    }
  };

  const resetBookingForm = () => {
    setSelectedPatient(null);
    setSelectedTime(null);
    setSelectedDentistId(null);
    setSelectedDate(undefined);
    setAvailableTimes([]);
  };

  const handleDeletePatient = async (patientId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/patients/${patientId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Paciente excluído com sucesso" });
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao excluir paciente", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir paciente", variant: "destructive" });
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    if (patient.date_of_birth) {
      setEditDateOfBirth(new Date(patient.date_of_birth));
    } else {
      setEditDateOfBirth(undefined);
    }
    setIsEditPatientOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const editedData = Object.fromEntries(formData.entries());

    if (editDateOfBirth) {
      editedData.date_of_birth = format(editDateOfBirth, "yyyy-MM-dd");
    }

    setPendingEditData(editedData);
    setIsConfirmEditDialogOpen(true);
  };

  const confirmEditPatient = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/patients/${editingPatient?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pendingEditData),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Paciente atualizado com sucesso" });
        setIsEditPatientOpen(false);
        setIsConfirmEditDialogOpen(false);
        setEditingPatient(null);
        setEditDateOfBirth(undefined);
        setPendingEditData(null);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro", description: errorData.message || "Falha ao atualizar paciente", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar paciente", variant: "destructive" });
    }
  };

  return (
    <PermissionGuard module="patients" action="access">
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Gerenciamento de Pacientes</h1>
            <p className="mt-1 text-primary-foreground/80">Visualize e gerencie todos os prontuários de pacientes</p>
          </div>
          <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
              <DialogTrigger asChild>
                <Button className="bg-card text-primary hover:bg-card/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Novo Paciente
                </Button>
              </DialogTrigger>
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
                    <Popover>
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
                        {/* ALTERAÇÃO 2: Calendário de Data de Nascimento */}
                        <Calendar
                          locale={ptBR}
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={setDateOfBirth}
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
                  <Button type="button" variant="outline" onClick={() => setIsNewPatientOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Paciente</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar pacientes por nome ou e-mail..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Patient Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="transition-all hover:shadow-lg animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-semibold">
                      {patient.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{patient.name}</h3>
                      <span className="inline-block rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                        {patient.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {patient.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {patient.phone}
                  </div>
                  <div className="pt-2 text-sm">
                    <span className="text-muted-foreground">Última Visita: </span>
                    <span className="font-medium text-foreground">{patient.lastVisit}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Dialog open={isViewDetailsOpen && selectedPatient?.id === patient.id} onOpenChange={(open) => {
                    setIsViewDetailsOpen(open);
                    if (!open) setSelectedPatient(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Paciente</DialogTitle>
                        <DialogDescription>Informações completas de {selectedPatient?.name}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="patient-name" className="text-right">Nome</Label>
                          <p id="patient-name" className="col-span-3 text-sm text-muted-foreground font-medium">{selectedPatient?.name}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="patient-email" className="text-right">E-mail</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p id="patient-email" className="text-sm text-muted-foreground">{selectedPatient?.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="patient-phone" className="text-right">Telefone</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p id="patient-phone" className="text-sm text-muted-foreground">{selectedPatient?.phone}</p>
                          </div>
                        </div>
                        {selectedPatient?.date_of_birth && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-dob" className="text-right">Nascimento</Label>
                            <div className="col-span-3 flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <p id="patient-dob" className="text-sm text-muted-foreground">{format(new Date(selectedPatient.date_of_birth), "PPP", { locale: ptBR })}</p>
                            </div>
                          </div>
                        )}
                        {selectedPatient?.cpf && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-cpf" className="text-right">CPF</Label>
                            <p id="patient-cpf" className="col-span-3 text-sm text-muted-foreground">{selectedPatient.cpf}</p>
                          </div>
                        )}
                        {selectedPatient?.address && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patient-address" className="text-right">Endereço</Label>
                            <p id="patient-address" className="col-span-3 text-sm text-muted-foreground">{selectedPatient.address}</p>
                          </div>
                        )}
                        {selectedPatient?.medical_history && (
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="patient-medical-history" className="text-right">Histórico Médico</Label>
                            <p id="patient-medical-history" className="col-span-3 text-sm text-muted-foreground">{selectedPatient.medical_history}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isBookAppointmentOpen && selectedPatient?.id === patient.id} onOpenChange={(open) => {
                    setIsBookAppointmentOpen(open);
                    if (!open) resetBookingForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        Agendar Consulta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agendar Consulta</DialogTitle>
                        <DialogDescription>Agende uma consulta para {selectedPatient?.name}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBookAppointment} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="dentist_id">Selecionar Dentista</Label>
                          <select 
                            id="dentist_id" 
                            name="dentist_id" 
                            required 
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            onChange={(e) => setSelectedDentistId(e.target.value)}
                          >
                            <option value="">Escolha um dentista</option>
                            {dentists.map(dentist => (
                              <option key={dentist.id} value={dentist.id}>{dentist.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data da Consulta</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              {/* ALTERAÇÃO 3: Calendário de Agendamento */}
                              <Calendar
                                locale={ptBR}
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                captionLayout="dropdown"
                                fromYear={currentYear}
                                toYear={currentYear + 5}
                                disabled={{ before: new Date() }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Horários Disponíveis</Label>
                            {isLoadingTimes ? (
                              <p>Carregando horários...</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {availableTimes.length > 0 ? availableTimes.map(slot => {
                                    const time = new Date(slot.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <Button 
                                            key={time}
                                            type="button" 
                                            variant={selectedTime === time ? "default" : "outline"}
                                            onClick={() => setSelectedTime(time)}
                                        >
                                            {time}
                                        </Button>
                                    );
                                }) : <p>Nenhum horário disponível para esta data.</p>}
                              </div>
                            )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="service_id">Tipo de Consulta</Label>
                          <select id="service_id" name="service_id" required className="w-full rounded-md border border-input bg-background px-3 py-2">
                            <option value="">Selecione o serviço</option>
                            {services.map(service => (
                              <option key={service.id_servico} value={service.id_servico}>{service.nome_servico}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Observações</Label>
                          <Textarea id="notes" name="notes" placeholder="Requisitos especiais ou observações..." />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => {
                            setIsBookAppointmentOpen(false);
                          }}>
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {/* Ícone de Calendário original removido do botão de submit */}
                            Agendar Consulta
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPatient(patient)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
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
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o paciente 
                        <b> {patient.name}</b> e todos os seus dados do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePatient(patient.id)}>
                        Excluir Paciente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Diálogo de Edição de Paciente */}
      <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>Atualize as informações do paciente {editingPatient?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  required 
                  defaultValue={editingPatient?.name}
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input 
                  id="edit-email" 
                  name="email" 
                  type="email" 
                  required 
                  defaultValue={editingPatient?.email}
                  placeholder="john@email.com" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input 
                  id="edit-phone" 
                  name="phone" 
                  required 
                  defaultValue={editingPatient?.phone}
                  placeholder="(555) 123-4567" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date_of_birth">Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editDateOfBirth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDateOfBirth ? format(editDateOfBirth, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      locale={ptBR}
                      mode="single"
                      selected={editDateOfBirth}
                      onSelect={setEditDateOfBirth}
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
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input 
                  id="edit-cpf" 
                  name="cpf" 
                  required 
                  defaultValue={editingPatient?.cpf}
                  placeholder="123.456.789-00" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input 
                id="edit-address" 
                name="address" 
                defaultValue={editingPatient?.address}
                placeholder="123 Main St, City, State" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-medical_history">Histórico Médico</Label>
              <Textarea 
                id="edit-medical_history" 
                name="medical_history" 
                defaultValue={editingPatient?.medical_history}
                placeholder="Alergias, condições, medicamentos..." 
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditPatientOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Atualizar Paciente</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação para editar paciente */}
      <AlertDialog open={isConfirmEditDialogOpen} onOpenChange={setIsConfirmEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Atualização de Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a atualizar os dados do paciente:
              <br />
              <b>Nome:</b> {pendingEditData?.name}<br />
              <b>E-mail:</b> {pendingEditData?.email}<br />
              <b>Telefone:</b> {pendingEditData?.phone}<br />
              <b>CPF:</b> {pendingEditData?.cpf}
              <br />
              Deseja continuar com a atualização?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEditPatient}>Atualizar Paciente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação para criar paciente */}
      <AlertDialog open={isConfirmPatientDialogOpen} onOpenChange={setIsConfirmPatientDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Registro de Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a registrar um novo paciente com os seguintes dados:
              <br />
              <b>Nome:</b> {pendingPatientData?.name}<br />
              <b>E-mail:</b> {pendingPatientData?.email}<br />
              <b>Telefone:</b> {pendingPatientData?.phone}<br />
              <b>CPF:</b> {pendingPatientData?.cpf}
              <br />
              Deseja continuar com o registro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreatePatient}>Registrar Paciente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PermissionGuard>
  );
}