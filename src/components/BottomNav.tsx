import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Refrigerator, Sparkles, CheckSquare, Gift } from 'lucide-react';

interface BottomNavProps {
  onOpenZeroWaste: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenZeroWaste }) => {
  const { activeTab, setActiveTab, pantryItems, shoppingList } = useApp();

  const expiringCount = pantryItems.filter((i) => i.isExpiringSoon).length;
  const uncompletedShopping = shoppingList.filter((i) => !i.checked).length;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg px-2 py-1">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'home' ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors relative ${
            activeTab === 'pantry' ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Refrigerator className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Despensa</span>
          {expiringCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        {/* Center Floating Action for Zero Waste AI */}
        <button
          onClick={onOpenZeroWaste}
          className="flex flex-col items-center -mt-5"
          title="O que cozinhar hoje com IA Zero Desperdício"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white animate-bounce-subtle">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-[9px] font-bold text-emerald-700 mt-1">Cozinhar IA</span>
        </button>

        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors relative ${
            activeTab === 'shopping' ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Compras</span>
          {uncompletedShopping > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-emerald-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {uncompletedShopping}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('shopee')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'shopee' ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Gift className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Prêmios</span>
        </button>
      </div>
    </div>
  );
};
