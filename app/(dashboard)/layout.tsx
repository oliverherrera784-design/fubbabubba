'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CupSoda, KeyRound, Delete, Loader2 } from 'lucide-react';

// AUTH_ENABLED: login obligatorio para el dashboard
const AUTH_ENABLED = true;

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (AUTH_ENABLED) {
    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      );
    }

    if (!user) {
      return <LoginScreen />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    setError('');
    setPin(prev => prev + digit);
  }, [pin]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = useCallback(async (currentPin: string) => {
    if (currentPin.length !== 4 || submitting) return;
    setSubmitting(true);
    const result = await login(currentPin);
    if (!result.success) {
      setError(result.error || 'Error');
      setPin('');
    }
    setSubmitting(false);
  }, [login, submitting]);

  // Auto-submit al llegar a 4 dígitos
  if (pin.length === 4 && !submitting && !error) {
    handleSubmit(pin);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CupSoda className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fubba Bubba</h1>
          <p className="text-gray-500 mt-1">Dashboard</p>

          <div className="mt-6 flex items-center justify-center gap-2 text-purple-600">
            <KeyRound className="w-5 h-5" />
            <span className="font-semibold">Ingresa tu PIN</span>
          </div>
        </div>

        {/* PIN display */}
        <div className="px-8 pb-2">
          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                  i < pin.length
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {i < pin.length ? '●' : ''}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium mb-2">{error}</p>
          )}

          {submitting && (
            <div className="flex justify-center mb-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
              if (key === '') return <div key="empty" />;
              if (key === 'del') {
                return (
                  <button
                    key="del"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-manipulation active:scale-95"
                  >
                    <Delete className="w-5 h-5 text-gray-600" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => handleDigit(key)}
                  disabled={submitting || pin.length >= 4}
                  className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 text-xl font-bold text-gray-700 transition-colors touch-manipulation active:scale-95 active:bg-purple-100"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
