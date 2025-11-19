import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Calendar, 
  DollarSign,
  Settings,
  Activity,
  LogOut,
  Shield,
  History,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { usePermissions } from "../contexts/PermissionContext";

const navigation = [
  { name: "Painel", href: "/", icon: LayoutDashboard, module: "dashboard" },
  { name: "Pacientes", href: "/patients", icon: Users, module: "patients" },
  { name: "Dentistas", href: "/dentists", icon: UserCog, module: "dentists" },
  { name: "Consultas", href: "/appointments", icon: Calendar, module: "appointments" },
  { name: "Horários", href: "/schedules", icon: Clock, module: "schedules" },
  { name: "Finanças", href: "/finances", icon: DollarSign, module: "finances" },
  { name: "Gerenciamento de Usuários", href: "/users", icon: Shield, module: "users" },
  { name: "Histórico", href: "/history", icon: History, module: "history" },
  { name: "Configurações", href: "/settings", icon: Settings, module: "settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filtrar navegação baseado nas permissões
  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.module, 'access')
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <img src="/logo.svg" alt="DentalCare Logo" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold text-foreground">DentalCare</h1>
            <p className="text-xs text-muted-foreground">Gerenciamento da Clínica</p>
          </div>
        </div>
        
        <nav className="space-y-1 p-4 flex-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser?.role_name}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}