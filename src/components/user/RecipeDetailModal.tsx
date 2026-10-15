import React, { useState } from 'react';
import { Recipe, PantryItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Clock,
  Flame,
  Users,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Plus,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Timer,
  Play,
  RotateCcw,
  ChefHat,
  HelpCircle,
  CheckCheck,
} from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const {
    pantryItems,
    addToShoppingList,
    cookRecipe,
    user,
    toggleSaveRecipe,
    shopeeProducts,
    recordShopeeClick,
    updateRecipe,
  } = useApp();

  const isSaved = user.savedRecipeIds.includes(recipe.id);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cookedSuccess, setCookedSuccess] = useState<boolean>(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState<boolean>(false);
  const [activeStepTimer, setActiveStepTimer] = useState<{ step: number; secondsLeft: number; isRunning: boolean } | null>(null);

  const handleRegenerateImage = async () => {
    setIsRegeneratingImage(true);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: recipe.title,
          prompt: recipe.description,
          category: recipe.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.imageUrl) {
          updateRecipe(recipe.id, { imageUrl: data.imageUrl });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Substitute AI helper state
  const [substituteQuery, setSubstituteQuery] = useState<string>('');
  const [isSubmittingSubstitute, setIsSubmittingSubstitute] = useState<boolean>(false);
  const [substituteResult, setSubstituteResult] = useState<any>(null);
  const [substituteError, setSubstituteError] = useState<string | null>(null);

  // Added to shopping toast state
  const [addedItemsNotice, setAddedItemsNotice] = useState<string | null>(null);

  // Map each ingredient to whether it's currently present in the user's pantry
  const ingredientStatus = recipe.ingredients.map((rIng) => {
    const foundInPantry = pantryItems.find(
      (pItem) =>
        rIng.name.toLowerCase().includes(pItem.name.toLowerCase()) ||
        pItem.name.toLowerCase().includes(rIng.name.toLowerCase())
    );
    return {
      ...rIng,
      isAvailable: !!foundInPantry,
      pantryItem: foundInPantry,
    };
  });

  const missingIngredients = ingredientStatus.filter((i) => !i.isAvailable);

  const handleAddMissingToShopping = () => {
    if (missingIngredients.length === 0) return;
    addToShoppingList(
      missingIngredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        category: i.category || 'Mercearia & Grãos',
        recipeOrigin: recipe.title,
      }))
    );
    setAddedItemsNotice(`${missingIngredients.length} ingredientes adicionados à sua Lista de Compras!`);
    setTimeout(() => setAddedItemsNotice(null), 4000);
  };

  const handleToggleStep = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  };

  const handleCookRecipe = () => {
    cookRecipe(recipe);
    setCookedSuccess(true);
  };

  // Timer runner
  React.useEffect(() => {
    let interval: any = null;
    if (activeStepTimer && activeStepTimer.isRunning && activeStepTimer.secondsLeft > 0) {
      interval = setInterval(() => {
        setActiveStepTimer((prev) => (prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null));
      }, 1000);
    } else if (activeStepTimer && activeStepTimer.secondsLeft === 0) {
      // Completed step timer
    }
    return () => clearInterval(interval);
  }, [activeStepTimer]);

  const startTimerForStep = (step: number, minutes: number = 5) => {
    setActiveStepTimer({
      step,
      secondsLeft: minutes * 60,
      isRunning: true,
    });
  };

  const formatTimerSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Shopee connected products
  const connectedProducts = shopeeProducts.filter((p) => recipe.shopeeProductIds?.includes(p.id));

  // Handle AI substitution request
  const handleAskSubstitute = async (ingredientName?: string) => {
    const target = ingredientName || substituteQuery;
    if (!target) return;
    setIsSubmittingSubstitute(true);
    setSubstituteError(null);
    try {
      const res = await fetch('/api/gemini/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientName: target,
          recipeContext: recipe.title,
          pantryItems: pantryItems.map((p) => p.name),
        }),
      });
      if (!res.ok) throw new Error('Falha ao consultar substituto.');
      const data = await res.json();
      setSubstituteResult(data);
    } catch (err: any) {
      setSubstituteError(err.message || 'Erro ao consultar IA.');
    } finally {
      setIsSubmittingSubstitute(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header with Image */}
        <div className="relative aspect-video sm:aspect-21/9 w-full bg-gray-900 shrink-0">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />

          {/* Regenerate image with AI */}
          <button
            onClick={handleRegenerateImage}
            disabled={isRegeneratingImage}
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg z-10 border border-white/20"
            title="Gerar foto gastronômica para esta receita com IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isRegeneratingImage ? 'Gerando Imagem...' : '🎨 Gerar Foto com IA'}</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition-colors shadow-lg z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Save bookmark */}
          <button
            onClick={() => toggleSaveRecipe(recipe.id)}
            className="absolute top-4 right-15 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition-colors shadow-lg z-10"
            title={isSaved ? 'Remover dos salvos' : 'Salvar receita'}
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>

          {/* Title and Badges */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                {recipe.category}
              </span>
              {recipe.isOfficial && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Receita Verificada do Chef
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Preparo total
              </div>
              <span className="font-bold text-gray-900 text-sm mt-0.5">
                {recipe.prepTime + recipe.cookTime} minutos
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Rendimento
              </div>
              <span className="font-bold text-gray-900 text-sm mt-0.5">
                {recipe.servings} porções
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                Dificuldade
              </div>
              <span className="font-bold text-gray-900 text-sm mt-0.5">{recipe.difficulty}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                Calorias
              </div>
              <span className="font-bold text-gray-900 text-sm mt-0.5">
                {recipe.estimatedCalories ? `${recipe.estimatedCalories} kcal` : 'Leve'}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed italic border-l-3 border-emerald-500 pl-3">
            "{recipe.description}"
          </p>

          {/* Success banner if cooked */}
          {cookedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-emerald-800 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">Parabéns pelo preparo!</h4>
                  <p className="text-xs text-emerald-700">
                    Você ganhou +25 Moedas e +50 XP. Os ingredientes disponíveis foram baixados da sua despensa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notification when items added to shopping list */}
          {addedItemsNotice && (
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-teal-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600" />
              {addedItemsNotice}
            </div>
          )}

          {/* SECTION: Ingredients & Smart Pantry Match */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Ingredientes Estruturados
                </h3>
                <p className="text-xs text-gray-500">
                  Cruzamento em tempo real com os itens disponíveis na sua despensa
                </p>
              </div>

              {missingIngredients.length > 0 && (
                <button
                  onClick={handleAddMissingToShopping}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar {missingIngredients.length} faltantes à lista
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ingredientStatus.map((ing) => (
                <div
                  key={ing.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    ing.isAvailable
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/60 border-rose-200/80 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        ing.isAvailable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {ing.isAvailable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-sm block truncate">{ing.name}</span>
                      <span className="text-xs opacity-80">
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {ing.isAvailable ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200/80 text-emerald-900">
                        Na Despensa
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAskSubstitute(ing.name)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1"
                        title="Perguntar substituto para este ingrediente"
                      >
                        <HelpCircle className="w-3 h-3" />
                        Substituir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI INGREDIENT SUBSTITUTION DRAWER */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Assistente de Substituição Inteligente IA
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Zero Desperdício
              </span>
            </div>
            <p className="text-xs text-amber-800">
              Não tem algum ingrediente? A IA analisa o que você tem na despensa e sugere a melhor alternativa culinária sem estragar o ponto do prato.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Creme de leite, Farinha de trigo, Requeijão..."
                value={substituteQuery}
                onChange={(e) => setSubstituteQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskSubstitute()}
                className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => handleAskSubstitute()}
                disabled={isSubmittingSubstitute}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
              >
                {isSubmittingSubstitute ? (
                  <>Consultando...</>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Buscar Substituto
                  </>
                )}
              </button>
            </div>

            {substituteError && (
              <p className="text-xs text-rose-600 font-medium">{substituteError}</p>
            )}

            {substituteResult && (
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5 animate-in fade-in">
                <div className="text-xs font-bold text-gray-800">
                  Substitutos recomendados para: <span className="text-amber-700 font-extrabold">{substituteResult.ingredient}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {substituteResult.substitutes?.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                        sub.alreadyInUserPantry
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{sub.name}</span>
                          {sub.alreadyInUserPantry && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-sm font-bold">
                              Você tem!
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">
                          <span className="font-semibold">Proporção:</span> {sub.ratio}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{sub.flavorNote}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {substituteResult.expertTip && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg font-medium">
                    💡 <span className="font-bold">Dica do Chef:</span> {substituteResult.expertTip}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECTION: Step-by-Step Instructions with Cooking Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Modo de Preparo Passo a Passo</h3>
                <p className="text-xs text-gray-500">Marque as etapas prontas conforme cozinha</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {completedSteps.length} de {recipe.instructions.length} passos
              </span>
            </div>

            <div className="space-y-3">
              {recipe.instructions.map((ins) => {
                const isDone = completedSteps.includes(ins.step);
                const isTimerActive = activeStepTimer?.step === ins.step;

                return (
                  <div
                    key={ins.step}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-gray-50/80 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleStep(ins.step)}
                          className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-gray-300 hover:border-emerald-500'
                          }`}
                        >
                          {isDone && <Check className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Passo {ins.step}
                            </span>
                            <h4
                              className={`font-bold text-sm ${
                                isDone ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}
                            >
                              {ins.title}
                            </h4>
                          </div>
                          <p
                            className={`text-xs mt-1.5 leading-relaxed ${
                              isDone ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            {ins.text}
                          </p>
                        </div>
                      </div>

                      {/* Step Timer Action */}
                      {ins.timeMinutes && (
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {isTimerActive ? (
                            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-xl text-xs font-mono font-bold animate-pulse">
                              <Timer className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{formatTimerSeconds(activeStepTimer.secondsLeft)}</span>
                              <button
                                onClick={() => setActiveStepTimer(null)}
                                className="hover:text-emerald-950 ml-1"
                                title="Cancelar timer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startTimerForStep(ins.step, ins.timeMinutes)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                              title="Iniciar cronômetro para este passo"
                            >
                              <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                              <span>{ins.timeMinutes} min</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: Chef Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
              <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-600" />
                Segredos do Chef
              </h4>
              <ul className="space-y-1.5">
                {recipe.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SECTION: Shopee Recommended Products (Admin Connected Affiliates) */}
          {connectedProducts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    Achadinhos Shopee recomendados para esta receita
                  </h3>
                  <p className="text-xs text-gray-500">
                    Utensílios oficiais com desconto testados para facilitar o preparo
                  </p>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                  Link Oficial
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-white rounded-2xl border border-orange-100 hover:border-orange-300 shadow-xs flex items-center gap-3 transition-all group"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100"
                    />
                    <div className="min-w-0 flex-1">
                      {prod.badge && (
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                          {prod.badge}
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-gray-900 truncate mt-0.5 group-hover:text-orange-600 transition-colors">
                        {prod.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-extrabold text-sm text-orange-600">
                          R$ {prod.price.toFixed(2)}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-[11px] text-gray-400 line-through">
                            R$ {prod.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={prod.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordShopeeClick(prod.id)}
                      className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors shrink-0"
                      title="Ver produto na Shopee"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-200 text-xs font-bold transition-colors"
          >
            Fechar
          </button>

          <button
            onClick={handleCookRecipe}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <ChefHat className="w-4 h-4" />
            <span>Cozinhei esta receita! (+25 Moedas)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
