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
import { BusinessRegisterForm } from '../components/Business/Auth/BusinessRegisterForm';
import { BusinessLoginForm } from '../components/Business/Auth/BusinessLoginForm';
import { BusinessAuthCallback } from '../components/Business/Auth/BusinessAuthCallback';
import { BusinessOnboardingGuard } from './BusinessOnboardingGuard';
import { BusinessDashboard } from '../components/Business/Dashboard/BusinessDashboard';
import { ProductsManagement } from '../components/Business/Dashboard/ProductsManagement';
import { OrdersManagement } from '../components/Business/Dashboard/OrdersManagement';
import { BusinessConfigPage } from '../components/Business/Dashboard/BusinessConfigPage';
import { BusinessProfile } from '../components/Business/Dashboard/BusinessProfile';
import { ProtectedRoute } from '../components/Shared/ProtectedRoute';
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
      onNavigateToLogin={() => navigate('/business/login')}
      onNavigateToHome={() => navigate('/')}
    />
  );
}

// Wrapper para register form
function BusinessRegisterRoute() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);
  
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-light-blue)' }}>
            <span className="text-4xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¡Revisa tu email!
          </h2>
          <p className="mb-6" style={{ color: 'var(--jandi-gray)' }}>
            Te enviamos un email de confirmación. Por favor revisa tu bandeja de entrada y haz click en el link para activar tu cuenta.
          </p>
          <button
            onClick={() => navigate('/business/login')}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <BusinessRegisterForm
      onNavigateToLogin={() => navigate('/business/login')}
      onRegisterSuccess={() => setShowSuccess(true)}
    />
  );
}

// Wrapper para login form
function BusinessLoginRoute() {
  const navigate = useNavigate();
  
  return (
    <BusinessLoginForm
      onNavigateToRegister={() => navigate('/business/register')}
      onLoginSuccess={(businessId) => {
        if (businessId) {
          navigate(`/business/dashboard/${businessId}`, { replace: true });
        } else {
          navigate('/business/onboarding', { replace: true });
        }
      }}
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
    path: '/business/login',
    element: <BusinessLoginRoute />,
  },
  {
    path: '/business/auth/callback',
    element: <BusinessAuthCallback />,
  },
  {
    path: '/business/onboarding',
    element: (
      <BusinessOnboardingGuard>
        <BusinessRegister 
          onComplete={(businessId) => {
            window.location.href = `/business/dashboard/${businessId}`;
          }}
        />
      </BusinessOnboardingGuard>
    ),
  },
  {
    path: '/business/dashboard/:businessId',
    element: (
      <ProtectedRoute userType="business">
        <BusinessDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/business/products/:businessId',
    element: (
      <ProtectedRoute userType="business">
        <ProductsManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/business/orders/:businessId',
    element: (
      <ProtectedRoute userType="business">
        <OrdersManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/business/config/:businessId',
    element: (
      <ProtectedRoute userType="business">
        <BusinessConfigPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/business/profile/:businessId',
    element: (
      <ProtectedRoute userType="business">
        <BusinessProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            🚫 Acceso No Autorizado
          </h1>
          <p className="mb-6" style={{ color: 'var(--jandi-gray)' }}>
            No tienes permiso para acceder a este recurso
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
