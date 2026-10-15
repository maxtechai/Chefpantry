import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Check,
  Plus,
  BookmarkPlus,
  ChefHat,
  Leaf,
  Utensils,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Recipe } from '../../types';

interface ZeroWasteFlowModalProps {
  onClose: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
}

export const ZeroWasteFlowModal: React.FC<ZeroWasteFlowModalProps> = ({ onClose, onOpenRecipe }) => {
  const { pantryItems, recipes, addToShoppingList, addRecipe } = useApp();

  const [selectedPantryIds, setSelectedPantryIds] = useState<string[]>(
    pantryItems.map((item) => item.id)
  );
  const [maxTime, setMaxTime] = useState<number>(30);
  const [dietary, setDietary] = useState<string>('Nenhuma restrição');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [addedCustomRecipe, setAddedCustomRecipe] = useState<boolean>(false);
  const [addedMissingForRecipeId, setAddedMissingForRecipeId] = useState<string | null>(null);

  const togglePantryItem = (id: string) => {
    setSelectedPantryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const expiringCount = pantryItems.filter((i) => i.isExpiringSoon).length;

  const handleRunAiMatch = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const activePantry = pantryItems.filter((it) => selectedPantryIds.includes(it.id));

    try {
      const response = await fetch('/api/gemini/zero-waste-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pantryItems: activePantry,
          catalogRecipes: recipes,
          preferences: {
            maxTime,
            dietary,
          },
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        throw new Error(data?.error || 'Não foi possível processar o cruzamento no momento. Tente novamente.');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao conectar com a IA');
    } finally {
      setIsLoading(false);
    }
  };

  const [customDishImage, setCustomDishImage] = useState<string>(
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'
  );
  const [isGeneratingDishImage, setIsGeneratingDishImage] = useState<boolean>(false);

  const handleGenerateCustomImage = async () => {
    if (!result?.aiCustomRecipe) return;
    setIsGeneratingDishImage(true);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: result.aiCustomRecipe.title,
          prompt: result.aiCustomRecipe.description,
          category: 'Almoço rápido',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.imageUrl) setCustomDishImage(data.imageUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDishImage(false);
    }
  };

  const handleAddCustomRecipeToNotebook = () => {
    if (!result?.aiCustomRecipe) return;
    const r = result.aiCustomRecipe;

    addRecipe({
      title: `🌱 ${r.title} (Receita Zero Desperdício)`,
      description: r.description,
      category: 'Almoço rápido',
      prepTime: r.prepTime || 10,
      cookTime: r.cookTime || 20,
      servings: r.servings || 4,
      difficulty: r.difficulty || 'Fácil',
      isOfficial: false,
      isVerified: false,
      author: 'Criada pela IA ChefPantry',
      imageUrl: customDishImage,
      ingredients: (r.ingredients || []).map((i: any, idx: number) => ({
        id: `ing_ai_${Date.now()}_${idx}`,
        name: i.name,
        quantity: i.quantity || '1',
        unit: i.unit || 'porção',
      })),
      instructions: (r.instructions || []).map((ins: any) => ({
        step: ins.step,
        title: ins.title,
        text: ins.text,
        timeMinutes: ins.timeMinutes || 5,
      })),
      shopeeProductIds: ['shp_02', 'shp_04'],
      tips: [r.chefTip || 'Sirva imediatamente para aproveitar o frescor dos ingredientes!'],
    });

    setAddedCustomRecipe(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Motor de IA Zero Desperdício
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 uppercase tracking-wide">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Cruze os alimentos da sua despensa em tempo real para cozinhar sem sobrar nada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {!result ? (
            /* CONFIGURATION & PANTRY SELECTION VIEW */
            <div className="space-y-6">
              {/* Expiring Alert Banner */}
              {expiringCount > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-900">
                      Atenção: {expiringCount} {expiringCount === 1 ? 'item está' : 'itens estão'} perto da data de validade!
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      A IA dará prioridade total a esses itens para evitar o descarte de comida e economizar seu dinheiro.
                    </p>
                  </div>
                </div>
              )}

              {/* Pantry Item Selector Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-gray-900">
                      Alimentos disponíveis na sua despensa ({selectedPantryIds.length} selecionados)
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedPantryIds.length === pantryItems.length) {
                        setSelectedPantryIds([]);
                      } else {
                        setSelectedPantryIds(pantryItems.map((i) => i.id));
                      }
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
                  >
                    {selectedPantryIds.length === pantryItems.length
                      ? 'Desmarcar todos'
                      : 'Marcar todos'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 border border-gray-100 rounded-2xl bg-gray-50/50">
                  {pantryItems.map((item) => {
                    const isSelected = selectedPantryIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => togglePantryItem(item.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-emerald-400 shadow-xs'
                            : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-gray-900 truncate">{item.name}</span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-emerald-600 text-white' : 'border border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[10px]">
                          <span className="text-gray-500">
                            {item.quantity} {item.unit}
                          </span>
                          {item.isExpiringSoon && (
                            <span className="px-1.5 py-0.2 rounded-sm bg-red-100 text-red-700 font-bold">
                              {item.daysUntilExp}d
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preferences: Time & Dietary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/70">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Tempo máximo que você tem para cozinhar:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setMaxTime(mins)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          maxTime === mins
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-teal-600" />
                    Restrição alimentar ou foco:
                  </label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Nenhuma restrição">Nenhuma restrição (Qualquer refeição)</option>
                    <option value="Sem lactose">Sem lactose / Tolerância</option>
                    <option value="Sem glúten">Sem glúten</option>
                    <option value="Vegetariano">Vegetariano (Sem carnes)</option>
                    <option value="Low-carb & Fit">Low-carb &amp; Proteico</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleRunAiMatch}
                disabled={isLoading || selectedPantryIds.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A IA está cruzando a despensa e calculando combinações...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>O que cozinhar hoje? Cruzar com IA</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* RESULTS VIEW: CATALOG MATCHES + AI CUSTOM RECIPE */
            <div className="space-y-6 animate-in fade-in">
              {/* Executive Summary */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Diagnóstico da IA ChefPantry
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  {result.pantryAnalysisSummary}
                </p>
              </div>

              {/* SECTION 1: Catalog Matches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Receitas do Catálogo Oficial Compatíveis
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    Ordenado por maior % de compatibilidade
                  </span>
                </div>

                <div className="space-y-3">
                  {result.catalogMatches?.map((match: any, idx: number) => {
                    const originalRecipe = recipes.find((r) => r.id === match.recipeId);
                    if (!originalRecipe) return null;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-emerald-300 transition-all shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={originalRecipe.imageUrl}
                              alt={originalRecipe.title}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-100"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900">
                                  {originalRecipe.title}
                                </span>
                                {originalRecipe.isOfficial && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                    Oficial
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {originalRecipe.prepTime + originalRecipe.cookTime} min
                                </span>
                                <span>•</span>
                                <span>{originalRecipe.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Match badge & action */}
                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <span
                                className={`text-base font-extrabold ${
                                  match.matchPercentage === 100
                                    ? 'text-emerald-600'
                                    : match.matchPercentage >= 70
                                    ? 'text-teal-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {match.matchPercentage}%
                              </span>
                              <span className="block text-[10px] text-gray-400 font-semibold">
                                Match Despensa
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                onClose();
                                onOpenRecipe(originalRecipe);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                            >
                              Ver Receita
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Ingredients breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                          <div className="bg-emerald-50/60 p-2 rounded-xl">
                            <span className="font-bold text-emerald-900 block mb-1">
                              ✓ Você tem ({match.availableIngredients?.length || 0}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {match.availableIngredients?.map((item: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-white text-emerald-800 text-[11px] font-medium border border-emerald-200"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="bg-rose-50/60 p-2 rounded-xl flex flex-col justify-between">
                            <div>
                              <span className="font-bold text-rose-900 block mb-1">
                                ✗ Falta na despensa ({match.missingIngredients?.length || 0}):
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {match.missingIngredients?.length === 0 ? (
                                  <span className="text-[11px] text-emerald-700 font-semibold">
                                    Nenhum! Tudo pronto na sua casa.
                                  </span>
                                ) : (
                                  match.missingIngredients?.map((item: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded-md bg-white text-rose-800 text-[11px] font-medium border border-rose-200"
                                    >
                                      {item}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {match.missingIngredients?.length > 0 && (
                              addedMissingForRecipeId === match.recipeId ? (
                                <span className="mt-2 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Adicionados à Lista de Compras!
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    addToShoppingList(
                                      match.missingIngredients.map((item: string) => ({
                                        name: item,
                                        quantity: '1',
                                        unit: 'un',
                                        category: 'Mercearia & Grãos',
                                        recipeOrigin: originalRecipe.title,
                                      }))
                                    );
                                    setAddedMissingForRecipeId(match.recipeId);
                                    setTimeout(() => setAddedMissingForRecipeId(null), 3000);
                                  }}
                                  className="mt-2 text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Adicionar faltantes à lista de compras
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {match.zeroWasteTip && (
                          <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                            💡 {match.zeroWasteTip}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: AI Tailored Custom Recipe */}
              {result.aiCustomRecipe && (
                <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent p-5 rounded-3xl border-2 border-emerald-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <ChefHat className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Criada Exclusivamente Para Você
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 mt-0.5">
                          {result.aiCustomRecipe.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={handleAddCustomRecipeToNotebook}
                      disabled={addedCustomRecipe}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      {addedCustomRecipe ? (
                        <>
                          <Check className="w-4 h-4" />
                          Salva no Caderno de Receitas!
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          Salvar no Meu Caderno
                        </>
                      )}
                    </button>
                  </div>

                  {/* Dish Visual Banner & AI Image Generation Button */}
                  <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden shadow-md border border-emerald-200 bg-gray-900 group">
                    <img
                      src={customDishImage}
                      alt={result.aiCustomRecipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        Imagem Ilustrativa do Prato
                      </span>

                      <button
                        type="button"
                        onClick={handleGenerateCustomImage}
                        disabled={isGeneratingDishImage}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        {isGeneratingDishImage ? 'Gerando Imagem...' : '🎨 Gerar Nova Foto com IA'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">
                    {result.aiCustomRecipe.description}
                  </p>

                  {/* Saved expiring items badges */}
                  {result.aiCustomRecipe.savedExpiringItems?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-emerald-800">Itens salvos do lixo:</span>
                      <div className="flex flex-wrap gap-1">
                        {result.aiCustomRecipe.savedExpiringItems.map((item: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ingredients & Steps preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-emerald-100">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Ingredientes Necessários:</h4>
                      <ul className="space-y-1">
                        {result.aiCustomRecipe.ingredients?.map((ing: any, i: number) => (
                          <li key={i} className="flex items-center justify-between text-gray-700">
                            <span>
                              • {ing.quantity} {ing.unit} de {ing.name}
                            </span>
                            {ing.isFromPantry && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 rounded font-bold">
                                Na despensa
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Preparo Rápido:</h4>
                      <div className="space-y-1.5">
                        {result.aiCustomRecipe.instructions?.map((ins: any) => (
                          <div key={ins.step} className="text-gray-700">
                            <span className="font-bold text-emerald-700">{ins.step}. {ins.title}:</span>{' '}
                            <span>{ins.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {result.aiCustomRecipe.chefTip && (
                    <p className="text-xs text-emerald-900 font-medium bg-emerald-100/70 p-2.5 rounded-xl">
                      💡 <span className="font-bold">Dica Zero Desperdício:</span>{' '}
                      {result.aiCustomRecipe.chefTip}
                    </p>
                  )}
                </div>
              )}

              {/* Reset to search again */}
              <button
                onClick={() => setResult(null)}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors"
              >
                Refazer Cruzamento com Outros Ingredientes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
