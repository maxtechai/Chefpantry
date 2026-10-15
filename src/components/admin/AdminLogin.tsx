import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const {
    currentUser,
    isAdmin,
    adminEmail,
    isLoading,
    error: authError,
    clearError,
    loginWithGoogle,
    loginWithEmail,
    logout,
  } = useAuth();

  const { setRole } = useApp();

  const [activeTab, setActiveTab] = useState<'google' | 'password'>('google');
  const [emailInput, setEmailInput] = useState<string>(adminEmail);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const displayError = localError || authError;

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);

    if (res.success && res.isAdmin) {
      if (onSuccess) onSuccess();
    } else if (res.success && !res.isAdmin) {
      setLocalError(res.error || `Acesso negado: apenas ${adminEmail} possui função de administrador.`);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    const res = await loginWithEmail(emailInput, passwordInput);
    setIsSubmitting(false);

    if (res.success && res.isAdmin) {
      if (onSuccess) onSuccess();
    } else if (res.success && !res.isAdmin) {
      setLocalError(res.error || `Acesso negado: apenas ${adminEmail} possui função de administrador.`);
    }
  };

  const handleBackToUserApp = () => {
    setRole('user');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackToUserApp}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao ChefPantry</span>
            </button>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/40 border border-purple-400/40 text-purple-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Firebase Auth
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Lock className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Painel Administrativo
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                Autenticação de Segurança Firebase &amp; Controle RBAC
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* If already signed in as unauthorized user */}
          {currentUser && !isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900">Conta Não Autorizada</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Você está conectado como <strong className="font-semibold">{currentUser.email}</strong>, mas apenas o e-mail oficial <strong className="font-semibold">{adminEmail}</strong> possui privilégios de administrador.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={logout}
                  className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Trocar de Conta
                </button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
            <UserCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Acesso Restrito do Administrador:</span>
              <p className="text-slate-600 mt-0.5">
                Para editar receitas oficiais, produtos afiliados da Shopee e métricas em produção, autentique-se com sua conta oficial: <span className="font-mono font-semibold text-purple-700">{adminEmail}</span>.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{displayError}</p>
              </div>
            </div>
          )}

          {/* Method Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab('google');
                clearError();
                setLocalError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'google'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              Google Login (Recomendado)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                clearError();
                setLocalError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'password'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              E-mail e Senha
            </button>
          </div>

          {/* Tab 1: Google One-Click Login */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-2xl font-bold text-sm text-gray-800 shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>
                  {isSubmitting ? 'Conectando ao Firebase...' : 'Entrar com Conta Google'}
                </span>
              </button>

              <p className="text-center text-[11px] text-gray-500">
                Selecione a conta <strong className="text-gray-700">{adminEmail}</strong> no popup do Google.
              </p>
            </div>
          )}

          {/* Tab 2: Email & Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  E-mail Administrativo:
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="admin@exemplo.com"
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
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Digite sua senha..."
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Chave mestra padrão: <strong className="text-purple-700 font-mono">admin123</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Verificando credenciais...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Entrar no Painel Admin</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return link */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-center">
            <button
              type="button"
              onClick={handleBackToUserApp}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              ← Retornar à navegação comum do app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
