/*
 * Copyright 2026 UCP Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * User type que extiende el Auth User de Supabase con propiedades custom
 * de nuestra tabla users. Esto permite tener un objeto completo con:
 * - Propiedades de autenticación (de Supabase Auth)
 * - Propiedades de negocio (de tabla users)
 */
export interface User extends Partial<SupabaseUser> {
  // Propiedades requeridas
  id: string;
  email: string;
  
  // Propiedades de la tabla users
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  google_id?: string;
  auth_provider: 'email' | 'google';
  is_active: boolean;
  onboarding_completed: boolean;
  user_type: 'consumer' | 'business'; // ✅ Columna user_type de la tabla users
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refetchUser: () => Promise<void>;
}
