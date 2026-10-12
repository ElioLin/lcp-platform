import { createContext, useContext } from 'react';
import type { Caller } from './types';
export const AuthContext = createContext<{
  user: Caller | null | undefined;
  loading: boolean;
  refresh: () => Promise<unknown>;
}>({ user: undefined, loading: true, refresh: async () => {} });
export const useAuth = () => useContext(AuthContext);
