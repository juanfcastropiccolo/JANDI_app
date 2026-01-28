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
import { 
  ShoppingBagIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  TruckIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface BusinessLandingProps {
  onNavigateToRegister: () => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export function BusinessLanding({ onNavigateToRegister, onNavigateToLogin, onNavigateToHome }: BusinessLandingProps) {
  const benefits = [
    {
      icon: ShoppingBagIcon,
      title: 'Acceso a miles de clientes',
      description: 'Conectá con usuarios que usan IA para comprar',
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics en tiempo real',
      description: 'Visualizá tus ventas y métricas al instante',
    },
    {
      icon: CreditCardIcon,
      title: 'Pagos seguros',
      description: 'Cobrá de forma segura con múltiples métodos de pago',
    },
    {
      icon: TruckIcon,
      title: 'Gestión de entregas',
      description: 'Administrá tus envíos desde un solo lugar',
    },
  ];

  const steps = [
    { number: 1, title: 'Registrá tu negocio', description: 'Completá el formulario con tus datos' },
    { number: 2, title: 'Cargá tu catálogo', description: 'Agregá tus productos o servicios' },
    { number: 3, title: 'Configurá entregas', description: 'Define tu zona y costos de envío' },
    { number: 4, title: '¡Empezá a vender!', description: 'Recibí pedidos y gestioná tu negocio' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
      {/* Header */}
      <header className="py-4 px-6" style={{ backgroundColor: 'var(--jandi-dark-blue)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img src="/images/JANDI_LOGO_COMPLETO.png" alt="JANDI" className="h-10" />
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="text-white hover:underline text-sm font-medium"
            >
              Ya tengo cuenta
            </button>
            <button
              onClick={onNavigateToHome}
              className="text-white hover:underline text-sm"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: 'var(--jandi-dark-blue)' }}
          >
            ¿Querés vender más?
            <br />
            Publicá tu negocio en JANDI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl mb-8"
            style={{ color: 'var(--jandi-gray)' }}
          >
            Conectá con miles de clientes que usan inteligencia artificial para comprar
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateToRegister}
            className="px-10 py-4 rounded-lg font-bold text-white text-lg shadow-lg transition-all duration-200"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Registrar mi negocio
          </motion.button>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--jandi-dark-blue)' }}>
            Beneficios de vender en JANDI
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-lg"
                style={{ backgroundColor: 'var(--jandi-background)' }}
              >
                <benefit.icon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--jandi-light-blue)' }} />
                <h3 className="font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  {benefit.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¿Cómo funciona?
          </h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-md"
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl"
                  style={{ backgroundColor: 'var(--jandi-light-blue)' }}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--jandi-dark-blue)' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--jandi-dark-blue)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            ¿Listo para crecer con JANDI?
          </h2>
          <p className="text-lg text-white opacity-90 mb-8">
            Unite a la plataforma de comercio inteligente
          </p>
          <button
            onClick={onNavigateToRegister}
            className="px-10 py-4 rounded-lg font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: 'var(--jandi-light-blue)',
              color: 'white',
            }}
          >
            Comenzar ahora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
            © 2026 JANDI. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
