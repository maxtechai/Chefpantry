import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  X,
  Sparkles,
  CheckCircle2,
  LogOut,
  UserCheck,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Utensils,
  BookOpen,
} from 'lucide-react';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenIntroSlides?: () => void;
  defaultAdminHint?: boolean;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenIntroSlides,
  defaultAdminHint = false,
}) => {
  const {
    currentUser,
    isAdmin,
    userType,
    adminEmail,
    isLoading,
    error: authError,
    clearError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  } = useAuth();

  const { role, setRole, user } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'google' | 'email'>('google');
  const [nameInput, setNameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(defaultAdminHint ? adminEmail : '');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localMessage, setLocalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLocalMessage(null);
    clearError();
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);

    if (res.success) {
      if (res.isAdmin) {
        setLocalMessage({
          type: 'success',
          text: `👑 Bem-vindo, Administrador! Você foi identificado com privilégios de gestão (${adminEmail}).`,
        });
      } else {
        setLocalMessage({
          type: 'success',
          text: `🍳 Bem-vindo, Chef ${res.user?.displayName || 'de Casa'}! Sua conta foi conectada com sucesso.`,
        });
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1100);
    } else {
      setLocalMessage({
        type: 'error',
        text: res.error || 'Não foi possível conectar com a conta Google.',
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    clearError();
    setIsSubmitting(true);

    let res;
    if (mode === 'register') {
      res = await registerWithEmail(nameInput, emailInput, passwordInput);
    } else {
      res = await loginWithEmail(emailInput, passwordInput);
    }
    setIsSubmitting(false);

    if (res.success) {
      if (res.isAdmin) {
        setLocalMessage({
          type: 'success',
          text: `👑 Administrador identificado com sucesso! (${adminEmail})`,
        });
      } else {
        setLocalMessage({
          type: 'success',
          text: mode === 'register'
            ? '🎉 Conta de Chef criada com sucesso! Bem-vindo ao ChefPantry.'
            : '🍳 Login realizado com sucesso! Seus dados foram carregados.',
        });
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1100);
    } else {
      setLocalMessage({
        type: 'error',
        text: res.error || 'Erro na autenticação. Verifique os dados.',
      });
    }
  };

  const handleGuestContinue = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-inner">
              <Utensils className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight">ChefPantry</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-emerald-950 uppercase">
                  Login
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Identificação Única: Administrador &amp; Chef de Casa
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Active Logged In Status Banner */}
          {currentUser && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              isAdmin
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-bold">
                    {isAdmin ? 'Conta de Administrador Ativa' : 'Conta de Chef Conectada'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                  isAdmin ? 'bg-purple-200 text-purple-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {isAdmin ? 'Admin' : 'Usuário'}
                </span>
              </div>

              <p className="text-[11px] opacity-90 truncate">
                Conectado como: <strong>{currentUser.email}</strong>
              </p>

              {isAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setRole('admin');
                      onClose();
                    }}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[11px] transition-all text-center"
                  >
                    Abrir Painel Admin
                  </button>
                  <button
                    onClick={() => {
                      setRole('user');
                      onClose();
                    }}
                    className="flex-1 py-1.5 bg-white border border-purple-300 text-purple-900 hover:bg-purple-50 rounded-xl font-bold text-[11px] transition-all text-center"
                  >
                    Usar App Normal
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[11px]">
                <span>Deseja trocar de perfil?</span>
                <button
                  onClick={logout}
                  className="font-bold underline hover:opacity-80 flex items-center gap-1 text-red-600"
                >
                  <LogOut className="w-3 h-3" />
                  Desconectar
                </button>
              </div>
            </div>
          )}

          {/* Alert / Feedback message */}
          {localMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                localMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {localMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <p className="font-medium text-xs leading-relaxed">{localMessage.text}</p>
            </div>
          )}

          {/* Explanation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Como funciona o login:</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  • <strong>Chef de Casa:</strong> Salve sua despensa e moedas com qualquer conta Google ou e-mail.<br />
                  • <strong>Administrador:</strong> Conecte-se com o e-mail oficial ({adminEmail}) para liberar o painel de receitas e métricas.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Selector: Google vs Email */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab('google');
                clearError();
                setLocalMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'google'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              Google (1 Clique)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                clearError();
                setLocalMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              E-mail e Senha
            </button>
          </div>

          {/* Tab 1: Google Login */}
          {activeTab === 'google' && (
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-2xl font-bold text-xs sm:text-sm text-gray-800 shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
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
                  {isSubmitting ? 'Conectando ao Firebase...' : 'Continuar com Conta Google'}
                </span>
              </button>

              <p className="text-center text-[11px] text-gray-500">
                Se você for o administrador, selecione a conta oficial <strong>{adminEmail}</strong>.
              </p>
            </div>
          )}

          {/* Tab 2: Email & Password */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
              {/* Login vs Register Switch */}
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-semibold text-gray-700">
                  {mode === 'login' ? 'Entrar com sua conta' : 'Cadastre-se grátis'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setLocalMessage(null);
                    clearError();
                  }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  {mode === 'login' ? 'Criar nova conta' : 'Já tem conta? Entrar'}
                </button>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Seu Nome ou Apelido:
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Ex: Chef Juliana"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  E-mail:
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="seuemail@exemplo.com"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  Senha:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{mode === 'login' ? 'Entrar no ChefPantry' : 'Criar Minha Conta'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick links: Re-open Slides or Explore as Guest */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            {onOpenIntroSlides && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIntroSlides();
                }}
                className="font-medium text-emerald-700 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ver apresentação</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGuestContinue}
              className="font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 ml-auto"
            >
              <span>Explorar sem conta</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
