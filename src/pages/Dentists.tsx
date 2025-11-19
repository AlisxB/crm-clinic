import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Mail, Phone, Award, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDentists } from "@/contexts/DentistContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Label } from "@/components/ui/label";
import { Clock, User, Stethoscope } from "lucide-react";

interface Dentist {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  experience: string;
  patients: number;
  specializations: string[];
}

interface Appointment {
  id: number;
  patient_id: number;
  dentist_id: number;
  start_time: string;
  end_time: string;
  type: string;
  notes: string;
  status: string;
}

interface Patient {
  id: number;
  name: string;
}

export default function Dentists() {
  const { dentists, refreshDentists, isLoading } = useDentists();
  const [localDentists, setLocalDentists] = useState<Dentist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { toast } = useToast();
  const location = useLocation();

  console.log('🏥 Página Dentistas renderizada, dentistas do Context:', dentists.length);

  // Buscar dentistas apenas uma vez na montagem
  useEffect(() => {
    console.log('🔄 Carregando dentistas inicialmente');
    fetchDentistsLocal();
    fetchAppointments();
    fetchPatients();
  }, []);

  // Função local para buscar dentistas
  const fetchDentistsLocal = async () => {
    try {
      console.log('🔄 Buscando dentistas da API');
      const response = await fetch('http://localhost:3000/api/dentists');
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Dentistas recebidos:', data.length);
        setLocalDentists(data);
      } else {
        toast({ title: "Erro", description: "Falha ao buscar dentistas", variant: "destructive" });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dentistas:', error);
      toast({ title: "Erro", description: "Falha ao buscar dentistas", variant: "destructive" });
    }
  };
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDentistForSchedule, setSelectedDentistForSchedule] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]); // Novo estado para slots disponíveis

  // Escutar eventos de atualização de dentistas apenas
  useEffect(() => {
    const handleDentistsUpdate = () => {
      console.log('🎯 Atualizando dentistas por evento');
      fetchDentistsLocal();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dentists_updated') {
        console.log('📝 Detectada mudança no localStorage');
        handleDentistsUpdate();
      }
    };

    // Escutar evento customizado
    window.addEventListener('dentists_updated', handleDentistsUpdate);
    
    // Escutar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('dentists_updated', handleDentistsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (selectedDentistForSchedule && selectedDate) {
      fetchAvailableSlots(selectedDentistForSchedule.id, selectedDate);
    }
  }, [selectedDentistForSchedule, selectedDate]);



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

  const fetchAvailableSlots = async (dentistId: number, date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const response = await fetch(`http://localhost:3000/api/dentists/${dentistId}/available-slots?date=${formattedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data);
      } else {
        toast({ title: "Erro", description: "Falha ao buscar horários disponíveis", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar horários disponíveis", variant: "destructive" });
    }
  };

  const handleViewSchedule = (dentist: Dentist) => {
    setSelectedDentistForSchedule(dentist);
    setIsScheduleModalOpen(true);
    // O useEffect acima irá chamar fetchAvailableSlots quando selectedDentistForSchedule e selectedDate forem definidos
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? patient.name : "Desconhecido";
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

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    const isSameDay = selectedDate ? appointmentDate.toDateString() === selectedDate.toDateString() : true;
    const isSelectedDentist = selectedDentistForSchedule ? appointment.dentist_id === selectedDentistForSchedule.id : true;
    return isSameDay && isSelectedDentist;
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-primary px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Nossos Dentistas</h1>
            <p className="mt-1 text-primary-foreground/80">Conheça nossa equipe de profissionais de odontologia</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {localDentists.map((dentist) => (
            <Card key={dentist.id} className="transition-all hover:shadow-lg animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
                    {dentist.name.split(" ").slice(-1)[0][0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{dentist.name}</h3>
                    <p className="text-sm text-primary font-medium">{dentist.specialty}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {dentist.experience}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {dentist.patients} pacientes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {dentist.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {dentist.phone}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-foreground">Especializações:</p>
                  <div className="flex flex-wrap gap-2">
                    {dentist.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleViewSchedule(dentist)}>
                    Ver Agenda
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Agenda de {selectedDentistForSchedule?.name}</DialogTitle>
            <DialogDescription>Visualize os agendamentos para {selectedDentistForSchedule?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col lg:flex-row gap-4">
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
                <Label>Horários Disponíveis para {selectedDate?.toLocaleDateString("pt-BR") || "hoje"}</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <p className="font-medium">{new Date(slot).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
                        <Button size="sm" variant="outline">Agendar</Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center">Nenhum horário disponível para esta data.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Agendamentos para {selectedDate?.toLocaleDateString("pt-BR") || "hoje"}</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map(appointment => (
                      <div key={appointment.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{getPatientName(appointment.patient_id)}</p>
                          <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        </div>
                        <p className="text-sm font-medium">{new Date(appointment.start_time).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center">Nenhum agendamento para esta data.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
