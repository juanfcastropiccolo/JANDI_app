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

import React from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { OnboardingGuard } from './OnboardingGuard';
import { LandingPage } from '../components/Auth/LandingPage';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { ForgotPassword } from '../components/Auth/ForgotPassword';
import { AuthCallbackSimple } from '../components/Auth/AuthCallbackSimple';
import { OnboardingContainer } from '../components/Onboarding/OnboardingContainer';
import { BusinessLanding } from '../components/Business/BusinessLanding';
import { BusinessRegister } from '../components/Business/BusinessRegister';
import App from '../App';

// Componentes wrapper que usan useNavigate para evitar recargas de página

function LandingRoute() {
  const navigate = useNavigate();
  
  return (
    <LandingPage
      onNavigateToLogin={() => navigate('/login')}
      onNavigateToRegister={() => navigate('/register')}
      onNavigateToBusiness={() => navigate('/business')}
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  
  return (
    <LoginForm
      onNavigateToRegister={() => navigate('/register')}
      onNavigateToForgotPassword={() => navigate('/forgot-password')}
      onLoginSuccess={() => navigate('/chat', { replace: true })}
    />
  );
}

function RegisterRoute() {
  const navigate = useNavigate();
  
  return (
    <RegisterForm
      onNavigateToLogin={() => navigate('/login')}
      onRegisterSuccess={() => navigate('/onboarding', { replace: true })}
    />
  );
}

function ForgotPasswordRoute() {
  const navigate = useNavigate();
  
  return (
    <ForgotPassword
      onNavigateToLogin={() => navigate('/login')}
    />
  );
}

function BusinessLandingRoute() {
  const navigate = useNavigate();
  
  return (
    <BusinessLanding
      onNavigateToRegister={() => navigate('/business/register')}
      onNavigateToHome={() => navigate('/')}
    />
  );
}

function BusinessRegisterRoute() {
  const navigate = useNavigate();
  
  return (
    <BusinessRegister
      onNavigateBack={() => navigate('/business')}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingRoute />,
  },
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    path: '/register',
    element: <RegisterRoute />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordRoute />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackSimple />,
  },
  {
    path: '/onboarding',
    element: (
      <AuthGuard>
        <OnboardingContainer />
      </AuthGuard>
    ),
  },
  {
    path: '/chat',
    element: (
      <AuthGuard>
        <OnboardingGuard>
          <App />
        </OnboardingGuard>
      </AuthGuard>
    ),
  },
  {
    path: '/business',
    element: <BusinessLandingRoute />,
  },
  {
    path: '/business/register',
    element: <BusinessRegisterRoute />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
