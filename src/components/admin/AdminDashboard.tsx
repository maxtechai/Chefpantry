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
  MessageSquare,
  Send,
  Bot,
  RotateCcw,
  Check,
  Video,
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
  const [aiAssistantTab, setAiAssistantTab] = useState<'chat' | 'quick'>('chat');
  const [aiRecipePrompt, setAiRecipePrompt] = useState<string>('');
  const [isAiStructuring, setIsAiStructuring] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageAlternatives, setImageAlternatives] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Agnes Interactive Chat State
  const [agnesChatMessages, setAgnesChatMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      structuredRecipe?: any;
      timestamp: string;
    }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá, Administrador! Sou a **Agnes AI**, sua chef consultora executiva do ChefPantry. 👩‍🍳✨\n\nPeça qualquer sugestão ou receita (ex: *"Crie um Escondidinho de Carne-Seca cremoso"*, *"Me sugira uma receita fit para airfryer"*, *"Bolo fofinho de cenoura com brigadeiro"*). Eu monto a receita completa e você poderá **importá-la com 1 clique para o formulário**!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [agnesChatInput, setAgnesChatInput] = useState<string>('');
  const [isAgnesChatLoading, setIsAgnesChatLoading] = useState<boolean>(false);
  const [agnesChatError, setAgnesChatError] = useState<string | null>(null);
  const [appliedRecipeSuccess, setAppliedRecipeSuccess] = useState<string | null>(null);

  const handleGenerateDishImage = async (customTitle?: string, customCategory?: RecipeCategory) => {
    const titleToUse = customTitle || rTitle || aiRecipePrompt || 'Prato gourmet';
    const categoryToUse = customCategory || rCategory;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishTitle: titleToUse,
          prompt: `${titleToUse}, comida apetitosa bem servida`,
          category: categoryToUse,
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
  const [shpDescription, setShpDescription] = useState<string>('');
  const [shpVideoUrl, setShpVideoUrl] = useState<string>('');
  const [shpImages, setShpImages] = useState<string[]>([]);
  const [isPullingShopee, setIsPullingShopee] = useState<boolean>(false);
  const [shopeePullError, setShopeePullError] = useState<string | null>(null);
  const [shopeePullSuccess, setShopeePullSuccess] = useState<string | null>(null);

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

      const newTitle = structured.title || rTitle;
      const newCat = (structured.category as RecipeCategory) || rCategory;

      setRTitle(newTitle);
      setRDesc(structured.description || rDesc);
      if (structured.category) setRCategory(newCat);
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

      // Also automatically fetch the matching culinary photo and options for this newly structured dish!
      handleGenerateDishImage(newTitle, newCat);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erro ao processar receita com IA.');
    } finally {
      setIsAiStructuring(false);
    }
  };

  const handleSendAgnesChat = async (customPrompt?: string) => {
    const textToSend = (customPrompt || agnesChatInput).trim();
    if (!textToSend || isAgnesChatLoading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user' as const,
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...agnesChatMessages, userMsg];
    setAgnesChatMessages(updatedHistory);
    setAgnesChatInput('');
    setIsAgnesChatLoading(true);
    setAgnesChatError(null);

    try {
      const res = await fetch('/api/agnes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao comunicar com a Agnes AI.');
      }

      const data = await res.json();
      const botMsg = {
        id: `bot_${Date.now()}`,
        role: 'assistant' as const,
        content: data.reply || 'Receita preparada com sucesso!',
        structuredRecipe: data.structuredRecipe,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setAgnesChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error in Agnes Chat:', err);
      setAgnesChatError(err.message || 'Erro ao conversar com a Agnes. Tente novamente.');
    } finally {
      setIsAgnesChatLoading(false);
    }
  };

  const handleApplyRecipeFromChat = (structured: any) => {
    if (!structured) return;

    const newTitle = structured.title || rTitle;
    const newCat = (structured.category as RecipeCategory) || rCategory;

    setRTitle(newTitle);
    setRDesc(structured.description || rDesc);
    if (structured.category) setRCategory(newCat);
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

    if (structured.suggestedShopeeProducts?.length) {
      const matchedIds: string[] = [];
      structured.suggestedShopeeProducts.forEach((sug: any) => {
        const found = (shopeeProducts || []).find(
          (p: ShopeeProduct) =>
            p.title.toLowerCase().includes(sug.searchKeywords?.toLowerCase() || '') ||
            p.title.toLowerCase().includes(sug.name?.toLowerCase() || '')
        );
        if (found && !matchedIds.includes(found.id)) {
          matchedIds.push(found.id);
        }
      });
      if (matchedIds.length > 0) {
        setRShopeeIds((prev) => Array.from(new Set([...prev, ...matchedIds])));
      }
    }

    if (structured.tips?.length) {
      setRTips(Array.isArray(structured.tips) ? structured.tips.join('\n') : String(structured.tips));
    }

    // Automatically trigger Agnes Image Generation for the new recipe!
    handleGenerateDishImage(newTitle, newCat);

    setAppliedRecipeSuccess(`Receita "${newTitle}" importada com sucesso para o formulário!`);
    setTimeout(() => setAppliedRecipeSuccess(null), 6000);
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

  // Shopee Product Modal Handlers & Automatic Link Scraper
  const handleOpenShopeeModal = () => {
    setShpTitle('');
    setShpCategory('Utensílios de Medição');
    setShpPrice('29.90');
    setShpOrigPrice('49.90');
    setShpAffiliateLink('');
    setShpImageUrl('https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=600&q=80');
    setShpBadge('Destaque Shopee');
    setShpDescription('');
    setShpVideoUrl('');
    setShpImages([]);
    setShopeePullError(null);
    setShopeePullSuccess(null);
    setShowShopeeModal(true);
  };

  const handleUnfurlShopeeProduct = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || shpAffiliateLink).trim();
    if (!targetUrl) {
      setShopeePullError('Cole o seu link de afiliado ou link do produto Shopee primeiro.');
      return;
    }

    setIsPullingShopee(true);
    setShopeePullError(null);
    setShopeePullSuccess(null);

    try {
      const res = await fetch('/api/shopee/unfurl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao buscar dados do link Shopee.');
      }

      const data = await res.json();

      if (data.title) setShpTitle(data.title);
      if (data.price) setShpPrice(String(data.price));
      if (data.originalPrice) setShpOrigPrice(String(data.originalPrice));
      if (data.category) setShpCategory(data.category);
      if (data.imageUrl) setShpImageUrl(data.imageUrl);
      if (data.badge) setShpBadge(data.badge);
      if (data.description) setShpDescription(data.description);
      if (data.videoUrl) setShpVideoUrl(data.videoUrl);
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        setShpImages(data.images);
      }
      if (data.affiliateLink) setShpAffiliateLink(data.affiliateLink);

      setShopeePullSuccess(`✨ Sucesso! Título, preços, imagens e descrição foram puxados.`);
      setTimeout(() => setShopeePullSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error unfurling Shopee product:', err);
      setShopeePullError(err.message || 'Erro ao puxar dados da Shopee. Tente novamente.');
    } finally {
      setIsPullingShopee(false);
    }
  };

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
      description: shpDescription.trim() || undefined,
      videoUrl: shpVideoUrl.trim() || undefined,
      images: shpImages.length > 0 ? shpImages : [shpImageUrl],
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
              onClick={handleOpenShopeeModal}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
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
              {/* EMBEDDED AGNES AI CHAT & RECIPE ASSISTANT */}
              <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-4 rounded-2xl border border-purple-200 space-y-3 shadow-xs">
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-purple-950">Agnes AI</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online • Agnes 3.0 Flash
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Chef Consultora Executiva do Catálogo Oficial
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center bg-purple-100/80 p-0.5 rounded-xl border border-purple-200 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAiAssistantTab('chat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        aiAssistantTab === 'chat'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat com Agnes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiAssistantTab('quick')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        aiAssistantTab === 'quick'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      1-Clique Rápido
                    </button>
                  </div>
                </div>

                {/* Feedback Banner if Recipe was applied */}
                {appliedRecipeSuccess && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 font-bold animate-fade-in shadow-xs">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{appliedRecipeSuccess}</span>
                  </div>
                )}

                {/* TAB 1: INTERACTIVE CHAT WITH AGNES */}
                {aiAssistantTab === 'chat' && (
                  <div className="space-y-3">
                    {/* Chat Messages Scroll Container */}
                    <div className="bg-white/90 border border-purple-100 rounded-2xl p-3 max-h-72 min-h-48 overflow-y-auto space-y-3 shadow-inner">
                      {agnesChatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 px-1">
                            {msg.role === 'user' ? (
                              <span>Você • {msg.timestamp}</span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold text-purple-700">
                                <Bot className="w-3 h-3 text-purple-600" />
                                Agnes AI • {msg.timestamp}
                              </span>
                            )}
                          </div>

                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-xs max-w-[92%] leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-xs font-medium'
                                : 'bg-purple-50/80 border border-purple-100 text-gray-800 rounded-tl-xs shadow-xs whitespace-pre-wrap'
                            }`}
                          >
                            {msg.content}

                            {/* STRUCTURED RECIPE ACTION CARD */}
                            {msg.structuredRecipe && (
                              <div className="mt-3 p-3 bg-white rounded-xl border-2 border-purple-200 text-gray-800 shadow-sm space-y-2">
                                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                      {msg.structuredRecipe.category || 'Receita Oficial'}
                                    </span>
                                    <h4 className="font-black text-sm text-gray-900 mt-1">
                                      {msg.structuredRecipe.title}
                                    </h4>
                                    <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                                      {msg.structuredRecipe.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-gray-600 bg-gray-50 p-2 rounded-lg">
                                  <div>
                                    <span className="font-semibold text-gray-800 block">Preparo:</span>
                                    {msg.structuredRecipe.prepTime || 15} min
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-800 block">Cozimento:</span>
                                    {msg.structuredRecipe.cookTime || 20} min
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-800 block">Rendimento:</span>
                                    {msg.structuredRecipe.servings || 4} porções
                                  </div>
                                </div>

                                {msg.structuredRecipe.ingredients?.length && (
                                  <div className="text-[11px] text-gray-700">
                                    <span className="font-bold text-purple-900">
                                      Ingredientes ({msg.structuredRecipe.ingredients.length}):
                                    </span>{' '}
                                    {msg.structuredRecipe.ingredients
                                      .slice(0, 4)
                                      .map((i: any) => i.name)
                                      .join(', ')}
                                    {msg.structuredRecipe.ingredients.length > 4 && '...'}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleApplyRecipeFromChat(msg.structuredRecipe)}
                                  className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 text-emerald-200" />
                                  <span>Preencher Formulário com Esta Receita</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {isAgnesChatLoading && (
                        <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-200 animate-pulse">
                          <Bot className="w-4 h-4 text-purple-600 animate-spin" />
                          <span>Agnes está criando e estruturando sua receita com IA...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Error Notice */}
                    {agnesChatError && (
                      <p className="text-xs text-rose-600 font-semibold">{agnesChatError}</p>
                    )}

                    {/* EXAMPLES: QUICK RECIPE PROMPT PILLS */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-purple-800 font-semibold">
                        <span>💡 Exemplos rápidos para pedir à Agnes:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAgnesChatMessages([
                              {
                                id: 'welcome_reset',
                                role: 'assistant',
                                content:
                                  'Histórico limpo! O que você gostaria que eu crie hoje para o catálogo do ChefPantry? 👩‍🍳',
                                timestamp: new Date().toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }),
                              },
                            ])
                          }
                          className="text-[10px] text-purple-600 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Limpar Chat
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleSendAgnesChat(
                              'Crie uma receita especial de Escondidinho de Carne-Seca desfiada com purê de mandioca e queijo coalho gratinado'
                            )
                          }
                          disabled={isAgnesChatLoading}
                          className="text-[11px] bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100/60 text-purple-800 px-2.5 py-1 rounded-lg font-medium transition-colors"
                        >
                          🥘 Escondidinho de Carne-Seca
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendAgnesChat(
                              'Crie uma receita de Bolo de Cenoura de liquidificador bem fofinho com cobertura de brigadeiro'
                            )
                          }
                          disabled={isAgnesChatLoading}
                          className="text-[11px] bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100/60 text-purple-800 px-2.5 py-1 rounded-lg font-medium transition-colors"
                        >
                          🍰 Bolo de Cenoura com Brigadeiro
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendAgnesChat(
                              'Crie uma receita de Frango Crocante na Airfryer com tempero de páprica e ervas finas'
                            )
                          }
                          disabled={isAgnesChatLoading}
                          className="text-[11px] bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100/60 text-purple-800 px-2.5 py-1 rounded-lg font-medium transition-colors"
                        >
                          🍗 Frango Crocante Airfryer
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendAgnesChat(
                              'Crie uma receita de Risoto de Camarão cremoso com limão siciliano e queijo parmesão'
                            )
                          }
                          disabled={isAgnesChatLoading}
                          className="text-[11px] bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100/60 text-purple-800 px-2.5 py-1 rounded-lg font-medium transition-colors"
                        >
                          🍤 Risoto de Camarão
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendAgnesChat(
                              'Crie uma receita de Salada Caesar clássica com croutons crocantes e molho caseiro'
                            )
                          }
                          disabled={isAgnesChatLoading}
                          className="text-[11px] bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100/60 text-purple-800 px-2.5 py-1 rounded-lg font-medium transition-colors"
                        >
                          🥗 Salada Caesar Artesanal
                        </button>
                      </div>
                    </div>

                    {/* Chat Input & Send Button */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={agnesChatInput}
                        onChange={(e) => setAgnesChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendAgnesChat();
                          }
                        }}
                        placeholder="Converse com a Agnes... Ex: Crie uma receita de sobremesa rápida com morangos"
                        disabled={isAgnesChatLoading}
                        className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendAgnesChat()}
                        disabled={isAgnesChatLoading || !agnesChatInput.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: FAST 1-CLICK FORMATTING */}
                {aiAssistantTab === 'quick' && (
                  <div className="space-y-2">
                    <p className="text-purple-800 text-xs">
                      Digite o nome do prato ou cole um texto bruto. A IA estrutura a <strong>receita oficial completa</strong> com ingredientes gastronômicos autênticos, modo de preparo e foto correspondente.
                    </p>

                    <textarea
                      rows={2}
                      placeholder="Ex: Bolo de cenoura de liquidificador fofinho com cobertura de brigadeiro crocante..."
                      value={aiRecipePrompt}
                      onChange={(e) => setAiRecipePrompt(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setAiRecipePrompt(
                              'Escondidinho cremoso de mandioca com carne-seca desfiada e queijo coalho gratinado'
                            )
                          }
                          className="text-[11px] text-purple-700 hover:underline font-semibold bg-white px-2 py-0.5 rounded-md border border-purple-200"
                        >
                          Ex: Escondidinho
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAiRecipePrompt('Bolo de Cenoura de liquidificador com calda de chocolate')
                          }
                          className="text-[11px] text-purple-700 hover:underline font-semibold bg-white px-2 py-0.5 rounded-md border border-purple-200"
                        >
                          Ex: Bolo de Cenoura
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleAiFormatRecipe}
                        disabled={isAiStructuring || !aiRecipePrompt.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        {isAiStructuring ? (
                          <>Formatando com Agnes...</>
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
                )}
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
                    <div>
                      <label className="block font-bold text-gray-800">Foto Gastronômica da Receita:</label>
                      <span className="text-[10px] text-purple-700">Fotos de alta definição específicas para este prato</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateDishImage()}
                      disabled={isGeneratingImage}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      {isGeneratingImage ? 'Buscando foto...' : '✨ Gerar / Alternar Foto'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-purple-200 shadow-inner">
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
                        Você pode colar um link personalizado ou clicar em "Gerar / Alternar Foto" para ver mais opções.
                      </span>
                    </div>
                  </div>

                  {imageAlternatives.length > 0 && (
                    <div className="pt-2 border-t border-purple-100/80">
                      <div className="text-[11px] font-bold text-purple-900 mb-1.5 flex items-center justify-between">
                        <span>Opções de fotos culinárias para este prato:</span>
                        <span className="text-[10px] text-purple-600 font-medium">Clique para escolher</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {imageAlternatives.map((altUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setRImageUrl(altUrl)}
                            className={`relative rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                              rImageUrl === altUrl
                                ? 'border-purple-600 ring-2 ring-purple-400 scale-105 shadow-sm'
                                : 'border-purple-200 opacity-70 hover:opacity-100 hover:border-purple-400'
                            }`}
                            style={{ width: '68px', height: '50px' }}
                          >
                            <img
                              src={altUrl}
                              alt={`Opção ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {rImageUrl === altUrl && (
                              <div className="absolute inset-0 bg-purple-900/30 flex items-center justify-center text-white font-black text-xs">
                                ✓
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* MODAL: ADD SHOPEE AFFILIATE PRODUCT WITH AUTOMATIC LINK EXTRACTOR */}
      {showShopeeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl border border-gray-100 space-y-4 text-xs max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Cadastrar Produto de Afiliado Shopee
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Insira seu link de afiliado para puxar automaticamente ou preencha manualmente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShopeeModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* AUTOMATIC LINK EXTRACTOR (SEM API) */}
            <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100/70 p-4 rounded-2xl border border-orange-200 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-orange-950 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Puxar Dados Automáticos pelo Link (Sem API)</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-orange-200/80 text-orange-900 px-2 py-0.5 rounded-full">
                  Extrator Ativo
                </span>
              </div>

              <p className="text-[11px] text-orange-800 leading-relaxed">
                Cole abaixo o seu link de afiliado Shopee (ex: <code className="bg-white/80 px-1 py-0.5 rounded text-orange-900 font-mono">https://s.shopee.com.br/...</code> ou link direto da loja). A inteligência do ChefPantry segue o redirecionamento, raspa a página e extrai <strong>título limpo, preços com desconto, galeria de fotos, vídeos e descrição completa</strong>!
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Cole aqui seu link de afiliado Shopee..."
                  value={shpAffiliateLink}
                  onChange={(e) => setShpAffiliateLink(e.target.value)}
                  className="flex-1 bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleUnfurlShopeeProduct()}
                  disabled={isPullingShopee || !shpAffiliateLink.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-all shrink-0 cursor-pointer"
                >
                  {isPullingShopee ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Puxando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Puxar Dados</span>
                    </>
                  )}
                </button>
              </div>

              {shopeePullSuccess && (
                <div className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-1.5 animate-in fade-in shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{shopeePullSuccess}</span>
                </div>
              )}

              {shopeePullError && (
                <div className="text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {shopeePullError}
                </div>
              )}

              {/* Quick Test Links */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-orange-900 font-bold">Exemplos rápidos para testar o extrator:</span>
                <button
                  type="button"
                  onClick={() => {
                    const u = 'https://shopee.com.br/Balan%C3%A7a-Digital-De-Cozinha-Alta-Precis%C3%A3o-10kg-i.31342123.12345678';
                    setShpAffiliateLink(u);
                    handleUnfurlShopeeProduct(u);
                  }}
                  className="text-[10px] bg-white border border-orange-200 text-orange-900 px-2 py-0.5 rounded-md hover:bg-orange-100 font-medium"
                >
                  ⚖️ Balança Digital
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const u = 'https://shopee.com.br/Fritadeira-Eletrica-Air-Fryer-Sem-Oleo-4L-i.123456.987654';
                    setShpAffiliateLink(u);
                    handleUnfurlShopeeProduct(u);
                  }}
                  className="text-[10px] bg-white border border-orange-200 text-orange-900 px-2 py-0.5 rounded-md hover:bg-orange-100 font-medium"
                >
                  🍟 Airfryer 4L
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const u = 'https://shopee.com.br/Jogo-De-Panelas-Antiaderente-Ceramica-5-Pecas-i.98765.43210';
                    setShpAffiliateLink(u);
                    handleUnfurlShopeeProduct(u);
                  }}
                  className="text-[10px] bg-white border border-orange-200 text-orange-900 px-2 py-0.5 rounded-md hover:bg-orange-100 font-medium"
                >
                  🍳 Jogo de Panelas
                </button>
              </div>
            </div>

            {/* PRODUCT EDIT FORM */}
            <form onSubmit={handleSaveShopeeProduct} className="space-y-3.5">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Título do Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Balança de Precisão Digital Cozinha 10kg..."
                  value={shpTitle}
                  onChange={(e) => setShpTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Categoria:</label>
                  <select
                    value={shpCategory}
                    onChange={(e) => setShpCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Utensílios de Medição">Utensílios de Medição</option>
                    <option value="Formas & Assadeiras">Formas &amp; Assadeiras</option>
                    <option value="Panelas & Frigideiras">Panelas &amp; Frigideiras</option>
                    <option value="Airfryer & Acessórios">Airfryer &amp; Acessórios</option>
                    <option value="Eletroportáteis">Eletroportáteis</option>
                    <option value="Organizadores & Potes">Organizadores &amp; Potes</option>
                    <option value="Facas & Tábuas">Facas &amp; Tábuas</option>
                    <option value="Acessórios de Cozinha">Acessórios de Cozinha</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Selo / Destaque:</label>
                  <select
                    value={shpBadge}
                    onChange={(e) => setShpBadge(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Destaque Shopee">Destaque Shopee</option>
                    <option value="Mais Vendido">Mais Vendido</option>
                    <option value="Frete Grátis">Frete Grátis</option>
                    <option value="Super Oferta">Super Oferta</option>
                    <option value="Escolha do Chef">Escolha do Chef</option>
                  </select>
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preço Atual (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={shpPrice}
                    onChange={(e) => setShpPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-orange-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preço Original (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={shpOrigPrice}
                    onChange={(e) => setShpOrigPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 bg-white"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-500 font-semibold">Desconto Calculado:</span>
                  <span className="font-black text-sm text-rose-600 mt-0.5">
                    {parseFloat(shpOrigPrice) > parseFloat(shpPrice)
                      ? `-${Math.round(((parseFloat(shpOrigPrice) - parseFloat(shpPrice)) / parseFloat(shpOrigPrice)) * 100)}% OFF`
                      : 'Sem desconto'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Descrição do Produto:</label>
                <textarea
                  rows={3}
                  placeholder="Descrição vendedora com especificações, materiais e vantagens na cozinha..."
                  value={shpDescription}
                  onChange={(e) => setShpDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Image URL & Gallery */}
              <div className="space-y-2">
                <label className="block font-bold text-gray-700">URL da Imagem Principal:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={shpImageUrl}
                    onChange={(e) => setShpImageUrl(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  {shpImageUrl && (
                    <img
                      src={shpImageUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                  )}
                </div>

                {/* Gallery Thumbnails if multiple images extracted */}
                {shpImages.length > 1 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-gray-500 font-bold block mb-1">
                      Fotos extraídas ({shpImages.length}) • Clique para definir como imagem de capa:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {shpImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          onClick={() => setShpImageUrl(img)}
                          className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition-all ${
                            shpImageUrl === img
                              ? 'border-orange-500 scale-105 shadow-xs'
                              : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Video URL (if available) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-orange-600" />
                    <span>URL do Vídeo do Produto (Opcional):</span>
                  </label>
                  {shpVideoUrl && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ▶ Vídeo Ativo
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://... (Vídeo mp4 da Shopee ou demonstrativo)"
                  value={shpVideoUrl}
                  onChange={(e) => setShpVideoUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
                {shpVideoUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-black max-h-40 flex items-center justify-center">
                    <video src={shpVideoUrl} controls className="max-h-40 w-full object-contain" />
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-400">
                  Depois você poderá plugar as chaves da API Shopee Open Platform no backend se desejar.
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowShopeeModal(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-600/20 cursor-pointer"
                  >
                    Salvar Produto Shopee
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
