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
import { motion } from 'framer-motion';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToBusiness: () => void;
}

export function LandingPage({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToBusiness,
}: LandingPageProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, var(--jandi-background) 0%, var(--jandi-light-blue) 100%)',
      }}
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo */}
          <div className="mb-12">
            <img
              src="/images/JANDI_LOGO_COMPLETO.png"
              alt="JANDI"
              className="h-24 md:h-32 mx-auto"
            />
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl mb-12 max-w-md mx-auto"
            style={{ color: 'var(--jandi-dark-blue)' }}
          >
            Tu asistente inteligente de compras
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--jandi-light-blue)',
              }}
            >
              Ingresar
            </button>
            <button
              onClick={onNavigateToRegister}
              className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--jandi-white)',
                color: 'var(--jandi-dark-blue)',
                border: '2px solid var(--jandi-light-blue)',
              }}
            >
              Registrarse
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="py-8 px-4"
        style={{ backgroundColor: 'var(--jandi-dark-blue)' }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <button
            onClick={onNavigateToBusiness}
            className="text-white hover:underline transition-all duration-200 font-medium"
          >
            ¿Tenés un negocio? Publicá en JANDI →
          </button>
          <p className="text-sm mt-4 opacity-70" style={{ color: 'var(--jandi-white)' }}>
            © 2026 JANDI. Todos los derechos reservados.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
