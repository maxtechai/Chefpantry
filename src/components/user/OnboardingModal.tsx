import React, { useState } from 'react';
import { Sparkles, Utensils, Check, ArrowRight, X, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenZeroWaste: () => void;
}

const COMMON_ITEMS = [
  { name: 'Ovos', icon: '🥚', category: 'Laticínios & Ovos', unit: 'un', defaultQtd: '6' },
  { name: 'Queijo mussarela', icon: '🧀', category: 'Laticínios & Ovos', unit: 'g', defaultQtd: '200' },
  { name: 'Cenoura', icon: '🥕', category: 'Hortifrúti', unit: 'un', defaultQtd: '2' },
  { name: 'Peito de frango', icon: '🍗', category: 'Carnes & Proteínas', unit: 'g', defaultQtd: '500' },
  { name: 'Arroz cozido', icon: '🍚', category: 'Mercearia & Grãos', unit: 'xícara', defaultQtd: '2' },
  { name: 'Milho em conserva', icon: '🌽', category: 'Mercearia & Grãos', unit: 'lata', defaultQtd: '1' },
  { name: 'Alho e cebola', icon: '🧅', category: 'Hortifrúti', unit: 'un', defaultQtd: '2' },
  { name: 'Azeite ou óleo', icon: '🫒', category: 'Temperos & Óleos', unit: 'ml', defaultQtd: '200' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onOpenZeroWaste }) => {
  const { addPantryItemsBatch, user } = useApp();
  const [selectedItems, setSelectedItems] = useState<string[]>(['Ovos', 'Queijo mussarela', 'Cenoura']);

  if (!isOpen) return null;

  const toggleItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleSkip = () => {
    localStorage.setItem('chefpantry_onboarded', 'true');
    onClose();
  };

  const handleFinishOnboarding = () => {
    // Add selected items to pantry
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const expDate = future.toISOString().split('T')[0];

    const toAdd = COMMON_ITEMS.filter((i) => selectedItems.includes(i.name)).map((it) => ({
      name: it.name,
      quantity: it.defaultQtd,
      unit: it.unit,
      location: (it.category === 'Mercearia & Grãos' || it.category === 'Temperos & Óleos' ? 'Armário' : 'Geladeira') as any,
      category: it.category as any,
      expiryDate: expDate,
    }));

    if (toAdd.length > 0) {
      addPantryItemsBatch(toAdd);
    }

    localStorage.setItem('chefpantry_onboarded', 'true');

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#fbbf24'],
    });

    onClose();
    onOpenZeroWaste();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 text-gray-900 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Dia 1 • Boas-Vindas
              </span>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">
                O que tem na sua geladeira agora?
              </h2>
            </div>
          </div>
          <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Marque alguns alimentos que você já tem em casa. A IA vai cruzá-los instantaneamente para você ver o que dá para cozinhar agora mesmo sem desperdício!
        </p>

        {/* Quick Food Picker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {COMMON_ITEMS.map((item) => {
            const isSelected = selectedItems.includes(item.name);
            return (
              <div
                key={item.name}
                onClick={() => toggleItem(item.name)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer flex flex-col justify-between transition-all select-none ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{item.icon}</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-emerald-600 text-white' : 'border border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <span className="mt-2 block truncate text-[11px]">{item.name}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              {selectedItems.length} itens selecionados • Receitas com até 100% de match!
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            Pular por enquanto
          </button>

          <button
            onClick={handleFinishOnboarding}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
          >
            <span>Cozinhar com o que tenho!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
