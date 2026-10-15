import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Plus,
  Sparkles,
  Utensils,
  ShoppingBag,
  Trophy,
  BarChart3,
  Edit3,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  Coins,
  TrendingUp,
  Flame,
  ArrowRight,
  Package,
  Layers,
  Percent,
  LogOut,
  Database,
  RefreshCw,
  Server,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Recipe, RecipeCategory, RecipeIngredient, RecipeInstruction, ShopeeProduct, FoodCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AdminLogin } from './AdminLogin';
import {
  testDatabaseConnectivity,
  saveOfficialRecipeCloud,
  saveStoreProductCloud,
  updateAdminMetricsCloud,
} from '../../lib/firestoreService';
import { initialRecipes, initialShopeeProducts } from '../../data/initialData';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, isLoading: isAuthLoading, logout } = useAuth();
  const {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    shopeeProducts,
    addShopeeProduct,
    deleteShopeeProduct,
    missions,
    rewardCoupons,
    adminMetrics,
    toggleRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'recipes' | 'shopee' | 'missions' | 'metrics' | 'database'>('recipes');

  // Database Diagnostic & Test State
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<{
    connected: boolean;
    latencyMs: number;
    databaseId: string;
    testedAt: string;
    details?: string;
  } | null>(null);
  const [isSeedingDb, setIsSeedingDb] = useState<boolean>(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const handleRunDbDiagnostic = async () => {
    setIsTestingDb(true);
    setSeedStatus(null);
    try {
      const res = await testDatabaseConnectivity();
      setDbTestResult({
        connected: res.connected,
        latencyMs: res.latencyMs,
        databaseId: res.databaseId,
        testedAt: new Date().toLocaleTimeString('pt-BR'),
        details: res.error || 'Conexão validada com sucesso via /test/healthcheck.',
      });
    } catch (e: any) {
      setDbTestResult({
        connected: false,
        latencyMs: 999,
        databaseId: 'ai-studio-chefpantrydespen-847d07e4-ec5e-41a7-a7f9-dcbe1ed7cb90',
        testedAt: new Date().toLocaleTimeString('pt-BR'),
        details: e.message || 'Erro ao conectar.',
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSeedProductionCatalog = async () => {
    setIsSeedingDb(true);
    setSeedStatus('Sincronizando receitas e produtos oficiais com o Firestore...');
    try {
      let recCount = 0;
      for (const rec of initialRecipes) {
        await saveOfficialRecipeCloud(rec);
        recCount++;
      }
      let shpCount = 0;
      for (const prod of initialShopeeProducts) {
        await saveStoreProductCloud(prod);
        shpCount++;
      }
      await updateAdminMetricsCloud({
        shopeeClicks: 142 + 289 + 120,
        totalCooked: 340,
        foodSavedKg: 136.0,
      });
      setSeedStatus(`Sucesso! ${recCount} receitas oficiais e ${shpCount} produtos Shopee gravados no Firestore.`);
    } catch (err: any) {
      setSeedStatus(`Falha na sincronização: ${err.message || 'Verifique as regras do Firestore.'}`);
    } finally {
      setIsSeedingDb(false);
    }
  };

  // Modal State for Recipe Form
  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  // Modal State for Shopee Product Form
  const [showShopeeModal, setShowShopeeModal] = useState<boolean>(false);

  // Recipe Form State
  const [rTitle, setRTitle] = useState<string>('');
  const [rDesc, setRDesc] = useState<string>('');
  const [rCategory, setRCategory] = useState<RecipeCategory>('Almoço rápido');
  const [rPrepTime, setRPrepTime] = useState<number>(15);
  const [rCookTime, setRCookTime] = useState<number>(20);
  const [rServings, setRServings] = useState<number>(4);
  const [rDifficulty, setRDifficulty] = useState<'Fácil' | 'Médio' | 'Avançado'>('Fácil');
  const [rCalories, setRCalories] = useState<number>(320);
  const [rImageUrl, setRImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'
  );
  const [rIngredients, setRIngredients] = useState<RecipeIngredient[]>([
    { id: '1', name: 'Arroz', quantity: '2', unit: 'xícara', category: 'Mercearia & Grãos' },
  ]);
  const [rInstructions, setRInstructions] = useState<RecipeInstruction[]>([
    { step: 1, title: 'Preparo Inicial', text: 'Separe e higienize todos os ingredientes.', timeMinutes: 5 },
  ]);
  const [rShopeeIds, setRShopeeIds] = useState<string[]>([]);
  const [rTips, setRTips] = useState<string>('');

  // Embedded AI Recipe Assistant State
  const [aiRecipePrompt, setAiRecipePrompt] = useState<string>('');
  const [isAiStructuring, setIsAiStructuring] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageAlternatives, setImageAlternatives] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateDishImage = async (customTitle?: string) => {
    const titleToUse = customTitle || rTitle || aiRecipePrompt || 'Prato gourmet';
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: titleToUse,
          prompt: `${titleToUse}, comida apetitosa bem servida`,
          category: rCategory,
          avoidUrl: rImageUrl,
        }),
      });
      if (!res.ok) throw new Error('Falha ao gerar imagem.');
      const data = await res.json();
      if (data?.imageUrl) {
        setRImageUrl(data.imageUrl);
      }
      if (data?.alternatives && Array.isArray(data.alternatives)) {
        setImageAlternatives(data.alternatives);
      }
    } catch (err: any) {
      console.error(err);
      setAiError('Não foi possível gerar a imagem no momento. Tente novamente.');
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Shopee Form State
  const [shpTitle, setShpTitle] = useState<string>('');
  const [shpCategory, setShpCategory] = useState<string>('Utensílios de Medição');
  const [shpPrice, setShpPrice] = useState<string>('29.90');
  const [shpOrigPrice, setShpOrigPrice] = useState<string>('49.90');
  const [shpAffiliateLink, setShpAffiliateLink] = useState<string>('https://shopee.com.br');
  const [shpImageUrl, setShpImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=600&q=80'
  );
  const [shpBadge, setShpBadge] = useState<string>('Destaque Shopee');

  // Handle open create recipe modal
  const handleOpenCreateRecipe = () => {
    setEditingRecipeId(null);
    setRTitle('');
    setRDesc('');
    setRCategory('Almoço rápido');
    setRPrepTime(15);
    setRCookTime(20);
    setRServings(4);
    setRDifficulty('Fácil');
    setRCalories(320);
    setRImageUrl(
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'
    );
    setRIngredients([
      { id: '1', name: 'Ingrediente principal', quantity: '500', unit: 'g', category: 'Carnes & Proteínas' },
    ]);
    setRInstructions([
      { step: 1, title: 'Preparo Inicial', text: 'Separe e organize todos os ingredientes da receita.', timeMinutes: 5 },
    ]);
    setRShopeeIds([]);
    setRTips('Sirva quente com acompanhamentos frescos.');
    setAiRecipePrompt('');
    setAiError(null);
    setImageAlternatives([]);
    setShowRecipeModal(true);
  };

  // Handle open edit recipe modal
  const handleOpenEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRTitle(recipe.title);
    setRDesc(recipe.description);
    setRCategory(recipe.category);
    setRPrepTime(recipe.prepTime);
    setRCookTime(recipe.cookTime);
    setRServings(recipe.servings);
    setRDifficulty(recipe.difficulty);
    setRCalories(recipe.estimatedCalories || 300);
    setRImageUrl(recipe.imageUrl);
    setRIngredients(recipe.ingredients);
    setRInstructions(recipe.instructions);
    setRShopeeIds(recipe.shopeeProductIds || []);
    setRTips(recipe.tips ? recipe.tips.join('\n') : '');
    setAiRecipePrompt('');
    setAiError(null);
    setImageAlternatives([]);
    setShowRecipeModal(true);
  };

  // AI Assistant for Admin Recipe Structuring
  const handleAiFormatRecipe = async () => {
    if (!aiRecipePrompt.trim()) return;
    setIsAiStructuring(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/format-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiRecipePrompt }),
      });

      if (!res.ok) {
        throw new Error('Falha ao comunicar com o servidor da IA Gemini.');
      }

      const structured = await res.json();

      setRTitle(structured.title || rTitle);
      setRDesc(structured.description || rDesc);
      if (structured.category) setRCategory(structured.category as RecipeCategory);
      if (structured.prepTime) setRPrepTime(structured.prepTime);
      if (structured.cookTime) setRCookTime(structured.cookTime);
      if (structured.servings) setRServings(structured.servings);
      if (structured.difficulty) setRDifficulty(structured.difficulty);
      if (structured.estimatedCalories) setRCalories(structured.estimatedCalories);

      if (structured.ingredients?.length) {
        setRIngredients(
          structured.ingredients.map((ing: any, idx: number) => ({
            id: `ing_${Date.now()}_${idx}`,
            name: ing.name,
            quantity: String(ing.quantity || '1'),
            unit: ing.unit || 'unidade',
            category: (ing.category as FoodCategory) || 'Mercearia & Grãos',
          }))
        );
      }

      if (structured.instructions?.length) {
        setRInstructions(
          structured.instructions.map((ins: any) => ({
            step: ins.step,
            title: ins.title,
            text: ins.text,
            timeMinutes: ins.timeMinutes || 5,
          }))
        );
      }

      if (structured.tips?.length) {
        setRTips(structured.tips.join('\n'));
      }

      // Automatically suggest and link Shopee product IDs based on search keywords
      if (structured.suggestedShopeeProducts?.length) {
        const matchingIds: string[] = [];
        structured.suggestedShopeeProducts.forEach((sug: any) => {
          const match = shopeeProducts.find(
            (p) =>
              p.title.toLowerCase().includes(sug.name.toLowerCase()) ||
              sug.name.toLowerCase().includes(p.title.toLowerCase())
          );
          if (match && !matchingIds.includes(match.id)) {
            matchingIds.push(match.id);
          }
        });
        if (matchingIds.length > 0) {
          setRShopeeIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
        }
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erro ao processar receita com IA.');
    } finally {
      setIsAiStructuring(false);
    }
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim()) return;

    const recipeData = {
      title: rTitle.trim(),
      description: rDesc.trim(),
      category: rCategory,
      prepTime: Number(rPrepTime),
      cookTime: Number(rCookTime),
      servings: Number(rServings),
      difficulty: rDifficulty,
      estimatedCalories: Number(rCalories),
      isOfficial: true,
      isVerified: true,
      author: 'Chef Administrador',
      imageUrl: rImageUrl,
      ingredients: rIngredients,
      instructions: rInstructions,
      shopeeProductIds: rShopeeIds,
      tips: rTips ? rTips.split('\n').filter((t) => t.trim().length > 0) : [],
    };

    if (editingRecipeId) {
      updateRecipe(editingRecipeId, recipeData);
    } else {
      addRecipe(recipeData);
    }

    setShowRecipeModal(false);
  };

  // Shopee Product Add
  const handleSaveShopeeProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shpTitle.trim()) return;

    const price = parseFloat(shpPrice) || 29.9;
    const origPrice = parseFloat(shpOrigPrice) || 49.9;
    const disc = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

    addShopeeProduct({
      title: shpTitle.trim(),
      category: shpCategory,
      price,
      originalPrice: origPrice,
      discountPercent: disc,
      affiliateLink: shpAffiliateLink,
      imageUrl: shpImageUrl,
      rating: 4.9,
      reviewsCount: 1500,
      salesCount: '10k+ vendidos',
      badge: shpBadge,
      commissionEstimate: `R$ ${(price * 0.12).toFixed(2)}`,
    });

    setShowShopeeModal(false);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Verificando credenciais de administrador...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Admin Top Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Painel do Administrador (/admin)
              </span>
              <span className="text-xs text-purple-200 font-semibold">Acesso Restrito</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gestão de Receitas &amp; Afiliados Shopee
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl">
              Cadastre receitas oficiais com ingredientes estruturados para cruzamento com a despensa, vincule produtos com seus links de afiliados Shopee e acompanhe o engajamento dos usuários.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-700/50 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-purple-200 font-mono text-[11px] truncate max-w-[150px]">{currentUser.email}</span>
              </div>
            )}
            <button
              onClick={handleOpenCreateRecipe}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Receita Oficial</span>
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
            <button
              onClick={toggleRole}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-colors cursor-pointer"
              title="Voltar para a visão do usuário"
            >
              Voltar ao App
            </button>
          </div>
        </div>

        {/* Real-time Admin Metrics Cards */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-purple-800/60 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-purple-300 block text-[11px] font-semibold">Visualizações</span>
            <span className="text-xl font-black text-white mt-0.5 block">{adminMetrics.totalViews}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-emerald-300 block text-[11px] font-semibold">Receitas Cozinhadas</span>
            <span className="text-xl font-black text-emerald-300 mt-0.5 block">{adminMetrics.totalCooked}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-orange-300 block text-[11px] font-semibold">Cliques Shopee</span>
            <span className="text-xl font-black text-orange-300 mt-0.5 block">{adminMetrics.shopeeClicks}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-amber-300 block text-[11px] font-semibold">Comissão Estimada</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block">
              R$ {adminMetrics.affiliateRevenueEstimate.toFixed(2)}
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-teal-300 block text-[11px] font-semibold">Comida Salva</span>
            <span className="text-xl font-black text-teal-300 mt-0.5 block">{adminMetrics.foodSavedKg} kg</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-purple-300 block text-[11px] font-semibold">Usuários Ativos</span>
            <span className="text-xl font-black text-white mt-0.5 block">{adminMetrics.activeUsersCount}</span>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'recipes'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Receitas Oficiais ({recipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shopee')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'shopee'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-orange-400" />
          <span>Afiliados Shopee ({shopeeProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'missions'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Missões &amp; Cupons</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-teal-500" />
          <span>Relatório de Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Banco Firestore &amp; Testes</span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL RECIPES MANAGER */}
      {activeTab === 'recipes' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-gray-900">
                Catálogo de Receitas Oficiais Cadastradas
              </h2>
              <p className="text-xs text-gray-500">
                Os ingredientes cadastrados aqui são cruzados com a despensa dos usuários
              </p>
            </div>
            <button
              onClick={handleOpenCreateRecipe}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Receita</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((r) => {
              const connectedProds = shopeeProducts.filter((p) =>
                r.shopeeProductIds?.includes(p.id)
              );

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <img
                        src={r.imageUrl}
                        alt={r.title}
                        className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.2 rounded-md">
                            {r.category}
                          </span>
                          {r.isOfficial && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                              Oficial
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 truncate mt-1">
                          {r.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{r.ingredients.length} ingredientes</span>
                          <span>•</span>
                          <span>{r.prepTime + r.cookTime} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Shopee Utensils Link preview */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs">
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Utensílios Shopee Vinculados ({connectedProds.length}):
                      </span>
                      {connectedProds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {connectedProds.map((prod) => (
                            <span
                              key={prod.id}
                              className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-medium truncate max-w-[200px]"
                            >
                              {prod.title.split(' ')[0]} {prod.title.split(' ')[1]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          Nenhum produto Shopee vinculado ainda
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {r.views} views
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {r.cookedCount} feitas
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditRecipe(r)}
                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar receita"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir a receita "${r.title}"?`)) {
                            deleteRecipe(r.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir receita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SHOPEE AFFILIATE PRODUCTS MANAGER */}
      {activeTab === 'shopee' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-gray-900">
                Gestão de Produtos de Afiliado Shopee
              </h2>
              <p className="text-xs text-gray-500">
                Cadastre seus links de afiliado com utensílios e ingredientes recomendados
              </p>
            </div>
            <button
              onClick={() => setShowShopeeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Produto Shopee</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopeeProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-orange-100 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      {prod.category}
                    </span>
                    <h3 className="font-bold text-xs text-gray-900 truncate mt-1">{prod.title}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-black text-sm text-orange-600">
                        R$ {prod.price.toFixed(2)}
                      </span>
                      {prod.originalPrice && (
                        <span className="text-[11px] text-gray-400 line-through">
                          R$ {prod.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-[11px]">
                    <span className="text-gray-400 font-medium">Cliques gerados:</span>{' '}
                    <span className="font-extrabold text-gray-900">{prod.clicksCount} cliques</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={prod.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                      title="Testar link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir ${prod.title}?`)) deleteShopeeProduct(prod.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MISSIONS & GAMIFICATION MANAGER */}
      {activeTab === 'missions' && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <h2 className="font-extrabold text-base text-gray-900">
              Missões Semanais de Engajamento
            </h2>
            <p className="text-xs text-gray-500">
              Metas que motivam os usuários a cozinhar, cadastrar a despensa e evitar o desperdício
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{m.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{m.description}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Meta: {m.target} ações • Recompensa: +{m.rewardCoins} moedas (+{m.rewardXp} XP)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Ativa no App
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h2 className="font-extrabold text-base text-gray-900 mb-1">
              Catálogo de Cupons Shopee Cadastrados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {rewardCoupons.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-white border border-gray-200 text-xs">
                  <div className="font-bold text-gray-900">{c.title}</div>
                  <div className="text-orange-600 font-extrabold mt-1">{c.discountValue}</div>
                  <div className="text-gray-400 text-[10px] mt-0.5 font-mono">CÓDIGO: {c.code}</div>
                  <div className="text-amber-800 font-semibold mt-2">Custo: {c.costCoins} moedas</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: METRICS & FOOD WASTE REPORT */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                Receitas Mais Populares e Executadas
              </h3>
              <div className="space-y-3">
                {recipes.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 truncate max-w-[240px]">{r.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{r.views} views</span>
                      <span className="font-bold text-emerald-600">{r.cookedCount} cozinhadas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                Produtos Shopee com Maior Conversão de Cliques
              </h3>
              <div className="space-y-3">
                {shopeeProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 truncate max-w-[240px]">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-orange-600">{p.clicksCount} cliques</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE FIRESTORE & PRODUCTION TESTS */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Status Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-gray-900">
                      Conexão com Banco de Dados Firestore
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Pronto para Produção
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ID do Banco:{' '}
                    <code className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px]">
                      ai-studio-chefpantrydespen-847d07e4-ec5e-41a7-a7f9-dcbe1ed7cb90
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunDbDiagnostic}
                  disabled={isTestingDb}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Testando Latência...' : 'Testar Conexão em Tempo Real'}</span>
                </button>
              </div>
            </div>

            {/* Test result output */}
            {dbTestResult && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
                  dbTestResult.connected
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {dbTestResult.connected ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>
                      {dbTestResult.connected
                        ? 'Banco de Dados Firestore Conectado com Sucesso!'
                        : 'Atenção ao Conectar com o Firestore'}
                    </span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700">
                      Latência: {dbTestResult.latencyMs}ms
                    </span>
                    <span className="text-gray-400 text-[10px]">({dbTestResult.testedAt})</span>
                  </div>
                  <p className="text-xs opacity-90">{dbTestResult.details}</p>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Collections Status Grid */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              Coleções Conectadas no Firestore (Produção)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 font-mono">users/{'{userId}'}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Sincronizado
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Perfil de usuário, saldo de moedas, nível, XP e receitas salvas. Criação automática no primeiro login.
                </p>
                <div className="text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  Regra: Cada usuário lê/grava apenas seus próprios dados.
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 font-mono">users/{'{userId}'}/pantry</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Tempo Real
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Despensa privada de cada usuário com validade, localização (Geladeira, Freezer) e categorias.
                </p>
                <div className="text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  Transição: Modo Convidado ➔ Conta Nuvem com migração em batch.
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 font-mono">official_recipes</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    {recipes.length} receitas
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Catálogo oficial de receitas estruturadas pelo admin com ingredientes, tempo e passos.
                </p>
                <div className="text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  Regra: Leitura pública, gravação exclusiva do admin ({currentUser?.email || 'Admin'}).
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 font-mono">store_products</span>
                  <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                    {shopeeProducts.length} produtos
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Vitrine de achadinhos Shopee com links de afiliados oficiais e cupons de desconto.
                </p>
                <div className="text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  Cliques: Contagem atômica sem latência via increment(1).
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 font-mono">metrics/overview</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    Métricas Globais
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Indicadores de comida economizada ({adminMetrics.foodSavedKg}kg), receitas preparadas ({adminMetrics.totalCooked}) e cliques Shopee ({adminMetrics.shopeeClicks}).
                </p>
                <div className="text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  Acesso: Exclusivo do Administrador.
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 font-mono">api/gemini/* (Backend)</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    Seguro (Server-side)
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Processamento de receitas, scan de alimentos e substituição gastronômica gerenciado via rotas seguras no Express.
                </p>
                <div className="text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  Chave GEMINI_API_KEY 100% protegida no servidor.
                </div>
              </div>
            </div>
          </div>

          {/* Production Catalog Seeder Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-sm text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Sincronização em Massa do Catálogo Oficial no Firestore
                </h4>
                <p className="text-xs text-purple-800 mt-1 max-w-xl">
                  Grave todas as receitas do chef e achadinhos da Shopee diretamente na coleção oficial do Firestore. Isso garante que novos usuários baixem imediatamente o catálogo direto da nuvem.
                </p>
              </div>

              <button
                onClick={handleSeedProductionCatalog}
                disabled={isSeedingDb}
                className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-900/20 transition-all cursor-pointer shrink-0"
              >
                <Database className="w-4 h-4 text-purple-300" />
                <span>{isSeedingDb ? 'Persistindo no Firestore...' : 'Sincronizar Catálogo no Firestore'}</span>
              </button>
            </div>

            {seedStatus && (
              <div className="p-3.5 rounded-2xl bg-white border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{seedStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: RECIPE BUILDER WITH EMBEDDED GEMINI AI ASSISTANT */}
      {showRecipeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {editingRecipeId ? 'Editar Receita Oficial' : 'Cadastrar Nova Receita Oficial'}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Os dados são padronizados para alimentar o motor de IA e cruzamento com a despensa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecipeModal(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs">
              {/* EMBEDDED GEMINI AI ASSISTANT BOX */}
              <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-4 rounded-2xl border border-purple-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Assistente de IA Embutido no Admin
                  </div>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                    1-Clique
                  </span>
                </div>
                <p className="text-purple-800 text-xs">
                  Digite apenas o nome do prato ou cole um texto bruto (de WhatsApp, anotações ou internet). A IA formata automaticamente todos os campos, ingredientes estruturados, etapas e sugere produtos da Shopee!
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Ex: Bolo de cenoura de liquidificador fofinho com cobertura de brigadeiro, ou texto completo..."
                    value={aiRecipePrompt}
                    onChange={(e) => setAiRecipePrompt(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setAiRecipePrompt(
                          'Escondidinho cremoso de mandioca com carne-seca desfiada e queijo coalho gratinado'
                        )
                      }
                      className="text-[11px] text-purple-700 hover:underline font-semibold"
                    >
                      Exemplo: Escondidinho de Carne-Seca
                    </button>

                    <button
                      type="button"
                      onClick={handleAiFormatRecipe}
                      disabled={isAiStructuring || !aiRecipePrompt.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                    >
                      {isAiStructuring ? (
                        <>Formatando com Gemini...</>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Preencher Campos com IA
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && <p className="text-xs text-rose-600 font-semibold">{aiError}</p>}
                </div>
              </div>

              {/* MANUAL FORM FIELDS */}
              <form onSubmit={handleSaveRecipe} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Título da Receita:</label>
                    <input
                      type="text"
                      required
                      value={rTitle}
                      onChange={(e) => setRTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Categoria:</label>
                    <select
                      value={rCategory}
                      onChange={(e) => setRCategory(e.target.value as RecipeCategory)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="Café da manhã">Café da manhã</option>
                      <option value="Almoço rápido">Almoço rápido</option>
                      <option value="Jantar">Jantar</option>
                      <option value="Doces & Sobremesas">Doces &amp; Sobremesas</option>
                      <option value="Airfryer & Prático">Airfryer &amp; Prático</option>
                      <option value="Fit & Saudável">Fit &amp; Saudável</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Breve Descrição:</label>
                  <textarea
                    rows={2}
                    value={rDesc}
                    onChange={(e) => setRDesc(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Preparo (min):</label>
                    <input
                      type="number"
                      value={rPrepTime}
                      onChange={(e) => setRPrepTime(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Cozimento (min):</label>
                    <input
                      type="number"
                      value={rCookTime}
                      onChange={(e) => setRCookTime(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Porções:</label>
                    <input
                      type="number"
                      value={rServings}
                      onChange={(e) => setRServings(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Dificuldade:</label>
                    <select
                      value={rDifficulty}
                      onChange={(e) => setRDifficulty(e.target.value as any)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-gray-800">Foto Gastronômica da Receita:</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateDishImage()}
                      disabled={isGeneratingImage}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      {isGeneratingImage ? 'Gerando Imagem...' : '✨ Gerar Imagem com IA'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-purple-200">
                      <img
                        src={rImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={rImageUrl}
                        onChange={(e) => setRImageUrl(e.target.value)}
                        placeholder="https://... ou clique em Gerar Imagem com IA"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Você pode colar um link personalizado ou clicar em "Gerar Imagem com IA" para criar a foto ideal do prato.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured Ingredients Editor */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-gray-900 block">
                      Ingredientes Estruturados (Para Cruzar com a Despensa):
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setRIngredients([
                          ...rIngredients,
                          {
                            id: `ing_${Date.now()}`,
                            name: '',
                            quantity: '1',
                            unit: 'unidade',
                            category: 'Mercearia & Grãos',
                          },
                        ])
                      }
                      className="text-purple-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Ingrediente
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {rIngredients.map((ing, idx) => (
                      <div key={ing.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nome (ex: Leite condensado)"
                          value={ing.name}
                          onChange={(e) => {
                            const copy = [...rIngredients];
                            copy[idx].name = e.target.value;
                            setRIngredients(copy);
                          }}
                          className="flex-2 border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Qtd"
                          value={ing.quantity}
                          onChange={(e) => {
                            const copy = [...rIngredients];
                            copy[idx].quantity = e.target.value;
                            setRIngredients(copy);
                          }}
                          className="w-16 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-center"
                        />
                        <input
                          type="text"
                          placeholder="Un (g, ml, un)"
                          value={ing.unit}
                          onChange={(e) => {
                            const copy = [...rIngredients];
                            copy[idx].unit = e.target.value;
                            setRIngredients(copy);
                          }}
                          className="w-20 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setRIngredients(rIngredients.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-gray-900 block">Modo de Preparo (Passos):</label>
                    <button
                      type="button"
                      onClick={() =>
                        setRInstructions([
                          ...rInstructions,
                          {
                            step: rInstructions.length + 1,
                            title: `Passo ${rInstructions.length + 1}`,
                            text: '',
                            timeMinutes: 5,
                          },
                        ])
                      }
                      className="text-purple-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Passo
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {rInstructions.map((ins, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Título do passo"
                            value={ins.title}
                            onChange={(e) => {
                              const copy = [...rInstructions];
                              copy[idx].title = e.target.value;
                              setRInstructions(copy);
                            }}
                            className="font-bold flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-gray-500">Tempo:</span>
                            <input
                              type="number"
                              value={ins.timeMinutes || 5}
                              onChange={(e) => {
                                const copy = [...rInstructions];
                                copy[idx].timeMinutes = Number(e.target.value);
                                setRInstructions(copy);
                              }}
                              className="w-12 bg-white border border-gray-200 rounded-lg px-1 py-1 text-xs text-center"
                            />
                            <span className="text-[11px] text-gray-500">min</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRInstructions(rInstructions.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Instrução detalhada..."
                          value={ins.text}
                          onChange={(e) => {
                            const copy = [...rInstructions];
                            copy[idx].text = e.target.value;
                            setRInstructions(copy);
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shopee Affiliate Products Multi-Select */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="font-extrabold text-gray-900 block flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    Vincular Utensílios Shopee (Links de Afiliado para Esta Receita):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {shopeeProducts.map((prod) => {
                      const isLinked = rShopeeIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setRShopeeIds((prev) =>
                              prev.includes(prod.id)
                                ? prev.filter((id) => id !== prod.id)
                                : [...prev, prod.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isLinked
                              ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold'
                              : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="truncate">{prod.title}</span>
                          <span className="text-orange-500 shrink-0 font-bold ml-1">
                            {isLinked ? '✓' : '+'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowRecipeModal(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25"
                  >
                    {editingRecipeId ? 'Salvar Alterações' : 'Publicar Receita Oficial'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHOPEE AFFILIATE PRODUCT */}
      {showShopeeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Novo Produto de Afiliado Shopee
              </h3>
              <button
                onClick={() => setShowShopeeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShopeeProduct} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Título do Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Balança de Precisão Digital Cozinha..."
                  value={shpTitle}
                  onChange={(e) => setShpTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Seu Link de Afiliado Shopee:</label>
                <input
                  type="url"
                  required
                  placeholder="https://shopee.com.br/universal-link/..."
                  value={shpAffiliateLink}
                  onChange={(e) => setShpAffiliateLink(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preço Atual (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={shpPrice}
                    onChange={(e) => setShpPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preço Original (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={shpOrigPrice}
                    onChange={(e) => setShpOrigPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">URL da Imagem:</label>
                <input
                  type="url"
                  required
                  value={shpImageUrl}
                  onChange={(e) => setShpImageUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShopeeModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs"
                >
                  Salvar Produto Shopee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
