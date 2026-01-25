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
import { createBrowserRouter, Navigate } from 'react-router-dom';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage 
      onNavigateToLogin={() => window.location.href = '/login'}
      onNavigateToRegister={() => window.location.href = '/register'}
      onNavigateToBusiness={() => window.location.href = '/business'}
    />,
  },
  {
    path: '/login',
    element: <LoginForm
      onNavigateToRegister={() => window.location.href = '/register'}
      onNavigateToForgotPassword={() => window.location.href = '/forgot-password'}
      onLoginSuccess={() => window.location.href = '/chat'}
    />,
  },
  {
    path: '/register',
    element: <RegisterForm
      onNavigateToLogin={() => window.location.href = '/login'}
      onRegisterSuccess={() => window.location.href = '/onboarding'}
    />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword
      onNavigateToLogin={() => window.location.href = '/login'}
    />,
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
    element: <BusinessLanding
      onNavigateToRegister={() => window.location.href = '/business/register'}
      onNavigateToHome={() => window.location.href = '/'}
    />,
  },
  {
    path: '/business/register',
    element: <BusinessRegister
      onNavigateBack={() => window.location.href = '/business'}
    />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
