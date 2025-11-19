import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DentistProvider } from "./contexts/DentistContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { PermissionGuard } from "./components/PermissionGuard";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Dentists from "./pages/Dentists";
import Appointments from "./pages/Appointments";
import Finances from "./pages/Finances";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import History from "./pages/History";
import Schedules from "./pages/Schedules";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PermissionProvider>
        <DentistProvider>
          <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <PermissionGuard module="dashboard">
                    <Layout><Dashboard /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/patients" element={
                <ProtectedRoute>
                  <PermissionGuard module="patients">
                    <Layout><Patients /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/dentists" element={
                <ProtectedRoute>
                  <PermissionGuard module="dentists">
                    <Layout><Dentists /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <PermissionGuard module="appointments">
                    <Layout><Appointments /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/finances" element={
                <ProtectedRoute>
                  <PermissionGuard module="finances">
                    <Layout><Finances /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <PermissionGuard module="settings">
                    <Layout><Settings /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <PermissionGuard module="users">
                    <Layout><UserManagement /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <PermissionGuard module="history">
                    <Layout><History /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="/schedules" element={
                <ProtectedRoute>
                  <PermissionGuard module="schedules">
                    <Layout><Schedules /></Layout>
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </DentistProvider>
      </PermissionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;