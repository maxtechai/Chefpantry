import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Utensils,
  ShieldCheck,
  User,
  Sparkles,
  Coins,
  ArrowRightLeft,
  ShoppingBag,
  Refrigerator,
  LogIn,
  Crown,
  ChefHat,
} from 'lucide-react';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { UnifiedAuthModal } from './auth/UnifiedAuthModal';
import { UserProfileModal } from './user/UserProfileModal';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenIntroSlides?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenIntroSlides }) => {
  const { user, role, setRole, activeTab, setActiveTab, pantryItems } = useApp();
  const { currentUser, isAdmin, userType } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const expiringCount = pantryItems.filter((i) => i.isExpiringSoon).length;

  const handleToggleAdminRole = () => {
    if (role === 'admin') {
      setRole('user');
    } else {
      if (isAdmin) {
        setRole('admin');
      } else {
        setShowAuthModal(true);
      }
    }
  };

  const displayName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Convidado');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                if (role === 'admin') setRole('user');
                setActiveTab('home');
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-gray-900 font-sans">
                    Chef<span className="text-emerald-600">Pantry</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 tracking-wider">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-gray-700 hidden sm:block">
                  Despensa Zero Desperdício &amp; Receitas Oficiais
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links for User Mode */}
            {role === 'user' && (
              <nav className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'home'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  Início
                </button>
                <button
                  onClick={() => setActiveTab('pantry')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                    activeTab === 'pantry'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Refrigerator className="w-4 h-4" />
                    Minha Despensa
                    {expiringCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('shopping')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'shopping'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  Lista de Compras
                </button>
                <button
                  onClick={() => setActiveTab('shopee')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'shopee'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    Achadinhos Shopee &amp; Recompensas
                  </span>
                </button>
              </nav>
            )}

            {/* Right Actions: PWA Install, Coins, Identity / Login button */}
            <div className="flex items-center gap-2">
              {/* In-App PWA Install Prompt Button */}
              <PWAInstallButton variant="header" />

              {/* Coins & XP Pill */}
              <div
                onClick={() => {
                  if (role === 'admin') setRole('user');
                  setActiveTab('shopee');
                }}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 cursor-pointer hover:bg-amber-100 transition-all shadow-xs"
                title="Seu saldo de moedas do ChefPantry"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-bold text-amber-800">{user.coins}</span>
                  <span className="text-[10px] text-amber-600 font-medium hidden sm:inline">moedas</span>
                </div>
                <div className="w-px h-3 bg-amber-200 hidden sm:block" />
                <div className="items-center gap-1 text-[11px] text-amber-800 font-semibold hidden sm:flex">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Nível {user.level}</span>
                </div>
              </div>

              {/* IDENTIFICATION AREA: Login vs Admin vs User */}
              {!currentUser ? (
                /* STATE 1: NOT LOGGED IN -> Shows "Login" button */
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                  title="Fazer Login ou Criar Conta"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              ) : isAdmin ? (
                /* STATE 2: LOGGED IN AS ADMIN -> Clear Admin identification + Mode switcher */
                <div className="flex items-center gap-1.5">
                  {/* Admin Profile Pill */}
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200 transition-all cursor-pointer"
                    title={`Administrador Conectado: ${currentUser.email}. Clique para abrir perfil.`}
                  >
                    <Crown className="w-3.5 h-3.5 text-purple-700" />
                    <span className="hidden sm:inline max-w-[90px] truncate">{displayName}</span>
                    <span className="sm:hidden text-[10px]">Admin</span>
                  </button>

                  {/* Mode Toggle Button: Admin Dashboard vs Normal App */}
                  <button
                    onClick={handleToggleAdminRole}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs cursor-pointer ${
                      role === 'admin'
                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                        : 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                    }`}
                    title={role === 'admin' ? 'Voltar para o Modo Usuário (Cozinhar)' : 'Abrir Painel Admin de Gestão'}
                  >
                    {role === 'admin' ? (
                      <>
                        <ChefHat className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Modo Usuário</span>
                        <span className="sm:hidden">App</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Painel Admin</span>
                        <span className="sm:hidden">Admin</span>
                      </>
                    )}
                    <ArrowRightLeft className="w-3 h-3 opacity-80" />
                  </button>
                </div>
              ) : (
                /* STATE 3: LOGGED IN AS NORMAL USER -> User Profile Pill */
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
                  title={`Chef Conectado: ${currentUser.email}. Clique para abrir perfil.`}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[85px] sm:max-w-[110px] truncate">{displayName}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Unified Authentication Modal */}
      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onOpenIntroSlides={onOpenIntroSlides}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenIntroSlides={() => {
          setShowProfileModal(false);
          if (onOpenIntroSlides) onOpenIntroSlides();
        }}
      />
    </>
  );
};
