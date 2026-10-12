import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Caller } from './types';
import { ApiError, request } from './api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const auth = useQuery({
    queryKey: ['auth'],
    retry: false,
    queryFn: async () => {
      try {
        return await request<Caller>('/api/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
  });
  useEffect(() => {
    const expired = () => {
      client.setQueryData(['auth'], null);
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    };
    window.addEventListener('lcp:session-expired', expired);
    return () => window.removeEventListener('lcp:session-expired', expired);
  }, [client]);
  return (
    <AuthContext.Provider
      value={{ user: auth.data, loading: auth.isPending, refresh: auth.refetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
