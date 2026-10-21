import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export interface CitizenUser {
  id: string;
  identifier: string;
  identifierType: 'email' | 'phone';
  name?: string;
}

interface CitizenAuthContextType {
  citizen: CitizenUser | null;
  isLoading: boolean;
  requestOtp: (identifier: string) => Promise<{ message: string; demoOtp?: string }>;
  verifyOtp: (identifier: string, otp: string) => Promise<CitizenUser>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const CitizenAuthContext = createContext<CitizenAuthContextType | undefined>(undefined);

export function CitizenAuthProvider({ children }: { children: React.ReactNode }) {
  const [citizen, setCitizen] = useState<CitizenUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentCitizen = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCitizen(data?.data?.user || null);
      } else {
        setCitizen(null);
      }
    } catch {
      setCitizen(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentCitizen = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setCitizen(data?.data?.user || null);
        } else {
          if (isMounted) setCitizen(null);
        }
      } catch {
        if (isMounted) setCitizen(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCurrentCitizen();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestOtp = async (identifier: string) => {
    const res = await fetch(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to request OTP');
    }
    return data.data;
  };

  const verifyOtp = async (identifier: string, otp: string) => {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Invalid OTP');
    }

    const user = data.data.user;
    setCitizen(user);
    return user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setCitizen(null);
    }
  };

  return (
    <CitizenAuthContext.Provider
      value={{
        citizen,
        isLoading,
        requestOtp,
        verifyOtp,
        logout,
        refetch: fetchCurrentCitizen,
      }}
    >
      {children}
    </CitizenAuthContext.Provider>
  );
}

export function useCitizenAuth() {
  const ctx = useContext(CitizenAuthContext);
  if (!ctx) {
    throw new Error('useCitizenAuth must be used within CitizenAuthProvider');
  }
  return ctx;
}
