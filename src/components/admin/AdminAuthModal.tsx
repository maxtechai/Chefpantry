import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    currentUser,
    isAdmin,
    adminEmail,
    isLoading: isAuthLoading,
    error: authError,
    clearError,
    loginWithGoogle,
    loginWithEmail,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'google' | 'password'>('google');
  const [email, setEmail] = useState<string>(adminEmail);
  const [password, setPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const displayError = localError || authError;

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);

    if (res.success && res.isAdmin) {
      onSuccess();
    } else if (res.success && !res.isAdmin) {
      setLocalError(res.error || `Apenas ${adminEmail} possui privilégios de administrador.`);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    const res = await loginWithEmail(email, password);
    setIsSubmitting(false);

    if (res.success && res.isAdmin) {
      onSuccess();
    } else if (res.success && !res.isAdmin) {
      setLocalError(res.error || `Apenas ${adminEmail} possui privilégios de administrador.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 text-gray-900 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                Painel do Administrador
              </h3>
              <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                Firebase Authentication &amp; RBAC
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-200">
          Acesso reservado ao e-mail oficial do administrador: <strong className="text-purple-700 font-mono">{adminEmail}</strong>.
        </p>

        {currentUser && !isAdmin && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Conectado como <strong>{currentUser.email}</strong> (sem permissão de administrador).</span>
            </div>
            <button
              onClick={logout}
              className="text-[11px] font-bold text-amber-900 underline flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sair desta conta para trocar
            </button>
          </div>
        )}

        {displayError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-600">
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              clearError();
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'google' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-gray-900'
            }`}
          >
            Google Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              clearError();
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'password' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-gray-900'
            }`}
          >
            Senha
          </button>
        </div>

        {activeTab === 'google' ? (
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isAuthLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-800 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Verificando...' : 'Entrar com Conta Google'}</span>
            </button>
            <p className="text-center text-[11px] text-gray-500">
              Conecte-se com a conta <strong className="text-gray-700">{adminEmail}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                E-mail do Administrador:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="seu-email@gmail.com"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                Senha de Acesso:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="Digite sua senha..."
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Chave mestra de demonstração: <strong className="text-purple-700 font-mono">admin123</strong>
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isAuthLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>Verificando...</>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Entrar no Painel Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
