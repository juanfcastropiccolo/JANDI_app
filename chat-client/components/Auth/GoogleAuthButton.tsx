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
import { useAuthContext } from '../../contexts/AuthContext';

export function GoogleAuthButton() {
  const { loginWithGoogle, loading } = useAuthContext();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border-2 font-medium transition-all duration-200 hover:bg-gray-50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        borderColor: 'var(--jandi-gray-light)',
        color: 'var(--jandi-dark-blue)',
      }}
    >
      {/* Google Logo SVG */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.8055 10.2292C19.8055 9.55056 19.7501 8.86667 19.6306 8.19861H10.2V12.0486H15.6014C15.3773 13.2911 14.6571 14.3898 13.6025 15.0875V17.5861H16.8251C18.7175 15.8444 19.8055 13.2722 19.8055 10.2292Z" fill="#4285F4"/>
        <path d="M10.2 20C12.9 20 15.1714 19.1044 16.8286 17.5856L13.6059 15.087C12.7086 15.6969 11.5514 16.0428 10.2034 16.0428C7.59429 16.0428 5.38286 14.2833 4.58571 11.9166H1.26286V14.4922C2.96143 17.8689 6.41429 20 10.2 20Z" fill="#34A853"/>
        <path d="M4.58286 11.9169C4.16571 10.6744 4.16571 9.33027 4.58286 8.08777V5.51221H1.26286C-0.421143 8.86777 -0.421143 12.1372 1.26286 15.4928L4.58286 11.9169Z" fill="#FBBC04"/>
        <path d="M10.2 3.95722C11.6257 3.93472 13.0029 4.47222 14.0371 5.45722L16.8943 2.60111C15.0771 0.890556 12.6771 -0.0316667 10.2 0.000555556C6.41429 0.000555556 2.96143 2.13167 1.26286 5.51222L4.58286 8.08778C5.37714 5.71611 7.59143 3.95722 10.2 3.95722Z" fill="#EA4335"/>
      </svg>
      Continuar con Google
    </button>
  );
}
