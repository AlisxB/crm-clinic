import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

interface DentistContextType {
  dentists: Dentist[];
  refreshDentists: () => Promise<void>;
  isLoading: boolean;
}

const DentistContext = createContext<DentistContextType | undefined>(undefined);

export function DentistProvider({ children }: { children: ReactNode }) {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDentists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/dentists');
      if (response.ok) {
        const data = await response.json();
        setDentists(data);
      } else {
        console.error('Failed to fetch dentists');
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDentists = async () => {
    await fetchDentists();
  };

  useEffect(() => {
    fetchDentists();
  }, []);

  return (
    <DentistContext.Provider
      value={{
        dentists,
        refreshDentists,
        isLoading,
      }}
    >
      {children}
    </DentistContext.Provider>
  );
}

export function useDentists() {
  const context = useContext(DentistContext);
  if (context === undefined) {
    throw new Error("useDentists must be used within a DentistProvider");
  }
  return context;
}