import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  User,
  Coins,
  Sparkles,
  LogOut,
  X,
  BookOpen,
  ArrowRightLeft,
  Refrigerator,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntroSlides: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenIntroSlides,
}) => {
  const { currentUser, isAdmin, userType, logout } = useAuth();
  const { user, role, setRole, pantryItems, recipes } = useApp();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logout();
    setRole('user');
    onClose();
  };

  const handleToggleAdminRole = () => {
    if (role === 'admin') {
      setRole('user');
    } else {
      setRole('admin');
    }
    onClose();
  };

  const displayName = currentUser?.displayName || user.name || 'Chef';
  const email = currentUser?.email || user.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Header */}
        <div
          className={`p-6 text-white relative ${
            isAdmin
              ? 'bg-gradient-to-tr from-purple-800 via-indigo-800 to-purple-950'
              : 'bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-900'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-black border border-white/30 shadow-inner">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base truncate max-w-[170px]">
                  {displayName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-300 text-purple-950'
                      : 'bg-emerald-300 text-emerald-950'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Usuário'}
                </span>
              </div>
              <p className="text-xs opacity-90 truncate max-w-[190px]">{email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Badge */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between ${
              isAdmin
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-bold">
                {isAdmin
                  ? 'Administrador Master & Chef'
                  : 'Chef de Casa (Usuário Padrão)'}
              </span>
            </div>
            <span className="text-[11px] font-semibold opacity-80">
              Nível {user.level}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-0.5">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Moedas</span>
              </div>
              <span className="text-lg font-black">{user.coins}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-0.5">
                <Refrigerator className="w-4 h-4 text-emerald-600" />
                <span>Despensa</span>
              </div>
              <span className="text-lg font-black">{pantryItems.length} itens</span>
            </div>
          </div>

          {/* Admin Role Switch Option */}
          {isAdmin && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">Modo de Navegação:</span>
                <span className="text-[11px] font-bold text-purple-700 uppercase">
                  {role === 'admin' ? 'Painel Admin' : 'Modo Usuário'}
                </span>
              </div>
              <button
                onClick={handleToggleAdminRole}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {role === 'admin'
                    ? 'Ir para o Modo Usuário (Cozinhar)'
                    : 'Ir para o Painel Admin'}
                </span>
              </button>
            </div>
          )}

          {/* Actions List */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenIntroSlides();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Rever Apresentação do App</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta (Logout)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
