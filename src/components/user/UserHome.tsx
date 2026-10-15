import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RecipeCard } from './RecipeCard';
import {
  Sparkles,
  Search,
  Filter,
  Flame,
  Refrigerator,
  Clock,
  CheckCircle2,
  Bookmark,
  Utensils,
  Leaf,
  ShoppingBag,
  BookOpen,
} from 'lucide-react';
import { Recipe, RecipeCategory } from '../../types';

interface UserHomeProps {
  onOpenZeroWaste: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onOpenOnboarding: () => void;
  onOpenIntroSlides?: () => void;
}

export const UserHome: React.FC<UserHomeProps> = ({
  onOpenZeroWaste,
  onOpenRecipe,
  onOpenOnboarding,
  onOpenIntroSlides,
}) => {
  const { recipes, pantryItems, user, setActiveTab } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);

  const categories: RecipeCategory[] = [
    'Todos',
    'Almoço rápido',
    'Doces & Sobremesas',
    'Airfryer & Prático',
    'Fit & Saudável',
    'Café da manhã',
    'Jantar',
  ];

  const expiringItems = pantryItems.filter((i) => i.isExpiringSoon);

  const filteredRecipes = recipes.filter((r) => {
    const matchesCat = selectedCategory === 'Todos' || r.category === selectedCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSaved = !showSavedOnly || user.savedRecipeIds.includes(r.id);
    return matchesCat && matchesSearch && matchesSaved;
  });

  return (
    <div className="space-y-6">
      {/* Hero Zero Waste Banner */}
      <div className="relative bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              IA Zero Desperdício
            </span>
            <span className="text-xs text-emerald-200">Chef &amp; Despensa Inteligente</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Descubra o que cozinhar hoje com o que você já tem em casa.
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Nossa inteligência cruza os alimentos da sua despensa em tempo real, prioriza o que está para vencer e monta a refeição perfeita sem desperdiçar um centavo.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenZeroWaste}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all group scale-100 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-emerald-900 group-hover:rotate-12 transition-transform" />
              <span>O que cozinhar hoje? Cruzar Despensa</span>
            </button>

            <button
              onClick={() => setActiveTab('pantry')}
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
            >
              <Refrigerator className="w-4 h-4 text-emerald-300" />
              <span>Ver Minha Despensa ({pantryItems.length} itens)</span>
            </button>

            {onOpenIntroSlides && (
              <button
                onClick={onOpenIntroSlides}
                className="px-3.5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
                title="Rever os slides explicativos do aplicativo"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
                <span>Como Funciona</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Day 1 Onboarding Activation Card */}
      <div
        onClick={onOpenOnboarding}
        className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-2 border-dashed border-emerald-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-600/25 shrink-0 group-hover:scale-110 transition-transform">
            🧊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                Passo 1 • Encantamento Rápido
              </span>
              <span className="text-xs font-bold text-amber-700">+30 Moedas Bônus</span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 mt-0.5 group-hover:text-emerald-700 transition-colors">
              O que tem na sua geladeira agora?
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Toque em 3 ou 4 itens que você tem em casa e veja uma receita pronta em 1 clique!
            </p>
          </div>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors shrink-0 self-end sm:self-center"
        >
          Experimentar Agora →
        </button>
      </div>

      {/* Quick Expiration Alert Strip */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-amber-950 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-ping" />
            <span className="font-extrabold truncate">
              {expiringItems.length} {expiringItems.length === 1 ? 'alimento vence' : 'alimentos vencem'} em breve:
            </span>
            <span className="text-amber-800 truncate hidden sm:inline">
              {expiringItems.map((i) => i.name).join(', ')}
            </span>
          </div>

          <button
            onClick={onOpenZeroWaste}
            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            Aproveitar agora
          </button>
        </div>
      )}

      {/* Search & Saved Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por receita, prato ou ingrediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
          />
        </div>

        {/* Saved Toggle Pill */}
        <button
          onClick={() => setShowSavedOnly(!showSavedOnly)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 shadow-xs ${
            showSavedOnly
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Caderno de Salvos ({user.savedRecipeIds.length})</span>
        </button>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            pantryItems={pantryItems}
            onSelect={onOpenRecipe}
          />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-3">
          <Utensils className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-extrabold text-gray-800 text-base">Nenhuma receita encontrada</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tente pesquisar com outro termo ou use o botão do Motor de IA para gerar uma receita inédita sob medida para a sua despensa!
          </p>
          <button
            onClick={onOpenZeroWaste}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Criar Receita Sob Medida com IA</span>
          </button>
        </div>
      )}
    </div>
  );
};
