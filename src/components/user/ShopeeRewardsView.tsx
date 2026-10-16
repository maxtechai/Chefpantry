import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Trophy,
  Gift,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Tag,
  Flame,
  Award,
  Video,
  Play,
  X,
  Info,
  Plus,
  Check,
  ChevronRight,
  Film,
  Layers,
  Percent,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { ShopeeProduct } from '../../types';

export const ShopeeRewardsView: React.FC = () => {
  const {
    user,
    shopeeProducts,
    addShopeeProduct,
    recordShopeeClick,
    missions,
    claimMissionReward,
    rewardCoupons,
    redeemCoupon,
  } = useApp();

  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'shopee' | 'rewards'>('shopee');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [couponNotice, setCouponNotice] = useState<string | null>(null);

  // Link Extractor / Add Affiliate Modal State
  const [showImporter, setShowImporter] = useState<boolean>(false);
  const [affiliateLinkInput, setAffiliateLinkInput] = useState<string>('');
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullError, setPullError] = useState<string | null>(null);
  const [pullSuccess, setPullSuccess] = useState<string | null>(null);

  // Unfurled product draft
  const [draftProduct, setDraftProduct] = useState<{
    title: string;
    description: string;
    category: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    imageUrl: string;
    images: string[];
    videoUrl?: string;
    badge: string;
    commissionEstimate?: string;
    rating: number;
    reviewsCount: number;
    salesCount: string;
    affiliateLink: string;
  } | null>(null);

  // Detail Modal State (Viewing video, gallery and full description)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<ShopeeProduct | null>(null);
  const [activeMediaView, setActiveMediaView] = useState<'photo' | 'video'>('photo');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Unique categories
  const categories = [
    'Todos',
    ...Array.from(new Set(shopeeProducts.map((p) => p.category).filter(Boolean))),
  ];

  const filteredProducts = shopeeProducts.filter(
    (p) => selectedCategory === 'Todos' || p.category === selectedCategory
  );

  // Handle Unfurl Link without API
  const handleUnfurlLink = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || affiliateLinkInput).trim();
    if (!targetUrl) {
      setPullError('Por favor, cole o link do produto ou link de afiliado Shopee primeiro.');
      return;
    }

    setIsPulling(true);
    setPullError(null);
    setPullSuccess(null);

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
      const p = Number(data.price) || 29.9;
      const op = Number(data.originalPrice) || Number((p * 1.45).toFixed(2));
      const disc =
        data.discountPercent || (op > p ? Math.round(((op - p) / op) * 100) : 0);

      const gallery =
        Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : [data.imageUrl || 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=800&q=80'];

      setDraftProduct({
        title: data.title || 'Acessório Gourmet Shopee',
        description:
          data.description ||
          'Produto oficial selecionado para sua cozinha prática com alta durabilidade, facilidade de limpeza e ótimo acabamento.',
        category: data.category || 'Acessórios de Cozinha',
        price: p,
        originalPrice: op,
        discountPercent: disc,
        imageUrl: data.imageUrl || gallery[0],
        images: gallery,
        videoUrl: data.videoUrl || '',
        badge: data.badge || 'Destaque Shopee',
        commissionEstimate: data.commissionEstimate || `R$ ${(p * 0.12).toFixed(2)}`,
        rating: Number(data.rating) || 4.9,
        reviewsCount: Number(data.reviewsCount) || 1200,
        salesCount: data.salesCount || '5k+ vendidos',
        affiliateLink: data.affiliateLink || targetUrl,
      });

      setPullSuccess(
        `✨ Dados puxados com sucesso! Título, preços, galeria de fotos${
          data.videoUrl ? ' e vídeo demonstrativo' : ''
        } prontos.`
      );
    } catch (err: any) {
      console.error('Error unfurling link:', err);
      setPullError(
        err.message || 'Erro ao puxar dados do produto Shopee. Verifique o link e tente novamente.'
      );
    } finally {
      setIsPulling(false);
    }
  };

  // Save product to catalog
  const handleSaveDraft = () => {
    if (!draftProduct) return;

    addShopeeProduct({
      title: draftProduct.title,
      category: draftProduct.category,
      price: draftProduct.price,
      originalPrice: draftProduct.originalPrice,
      discountPercent: draftProduct.discountPercent,
      affiliateLink: draftProduct.affiliateLink,
      imageUrl: draftProduct.imageUrl,
      images: draftProduct.images,
      videoUrl: draftProduct.videoUrl,
      rating: draftProduct.rating,
      reviewsCount: draftProduct.reviewsCount,
      salesCount: draftProduct.salesCount,
      badge: draftProduct.badge,
      commissionEstimate: draftProduct.commissionEstimate,
      description: draftProduct.description,
    });

    setDraftProduct(null);
    setAffiliateLinkInput('');
    setShowImporter(false);
    setPullSuccess(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Banner: Wallet & Gamification Status */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Shopee Oficial + Gamificação
              </span>
              <span className="text-xs text-orange-100 font-semibold">Moedas do Chef</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                Extrator de Afiliado Sem API Ativo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Achadinhos da Cozinha &amp; Prêmios
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-xl">
              Cozinhe receitas, reduza o desperdício na sua casa e ganhe moedas para resgatar cupons de desconto exclusivos e produtos na Shopee!
            </p>
          </div>

          {/* User Coin Balance Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100 block">
                Seu Saldo
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white">{user.coins} moedas</div>
              <div className="text-[11px] text-amber-200 flex items-center gap-1 mt-0.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nível {user.level} Chef ({user.xp} XP acumulados)</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs & Quick Importer Trigger */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('shopee')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'shopee'
                  ? 'bg-white text-orange-700 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Vitrine de Achados Shopee</span>
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'rewards'
                  ? 'bg-white text-orange-700 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Missões &amp; Resgate de Cupons ({user.coins} moedas)</span>
            </button>
          </div>

          {/* Quick Button to Open Extractor */}
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            <span>{showImporter ? 'Fechar Extrator' : '+ Puxar Produto por Link (Sem API)'}</span>
          </button>
        </div>
      </div>

      {/* EXTRACTOR DRAWER / BANNER (SEM API) */}
      {showImporter && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 rounded-3xl p-5 border border-amber-200 shadow-lg space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/30">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900 text-base">
                    Extrator Inteligente de Afiliado Shopee (Sem API)
                  </h3>
                  <span className="text-[10px] font-bold bg-orange-200/80 text-orange-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Modo Direto
                  </span>
                </div>
                <p className="text-xs text-orange-950/80 mt-0.5">
                  Cole seu link de afiliado abaixo. Nosso extrator segue os redirecionamentos, raspa a página e puxa <strong>título, descrição, preços com desconto, galeria de fotos e vídeos</strong> sem precisar de chaves de API!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowImporter(false)}
              className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* URL Input Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={affiliateLinkInput}
                onChange={(e) => setAffiliateLinkInput(e.target.value)}
                placeholder="Cole aqui seu link de afiliado Shopee (ex: https://s.shopee.com.br/... ou link direto)..."
                className="w-full bg-white border border-amber-300 rounded-2xl px-4 py-3 text-xs text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono shadow-xs"
              />
            </div>
            <button
              onClick={() => handleUnfurlLink()}
              disabled={isPulling || !affiliateLinkInput.trim()}
              className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all shrink-0 cursor-pointer"
            >
              {isPulling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Puxando Dados...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Puxar Dados (Sem API)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
            <span className="text-[11px] font-bold text-orange-950">Exemplos rápidos para testar:</span>
            <button
              type="button"
              onClick={() => {
                const u = 'https://shopee.com.br/Balan%C3%A7a-Digital-De-Cozinha-Alta-Precis%C3%A3o-10kg-i.31342123.12345678';
                setAffiliateLinkInput(u);
                handleUnfurlLink(u);
              }}
              className="px-2.5 py-1 bg-white hover:bg-orange-100 border border-amber-200 rounded-xl text-[11px] font-semibold text-orange-950 transition-colors cursor-pointer"
            >
              ⚖️ Balança Digital
            </button>
            <button
              type="button"
              onClick={() => {
                const u = 'https://shopee.com.br/Fritadeira-Eletrica-Air-Fryer-Sem-Oleo-4L-i.123456.987654';
                setAffiliateLinkInput(u);
                handleUnfurlLink(u);
              }}
              className="px-2.5 py-1 bg-white hover:bg-orange-100 border border-amber-200 rounded-xl text-[11px] font-semibold text-orange-950 transition-colors cursor-pointer"
            >
              🍟 Airfryer 4L
            </button>
            <button
              type="button"
              onClick={() => {
                const u = 'https://shopee.com.br/Jogo-De-Panelas-Antiaderente-Ceramica-5-Pecas-i.98765.43210';
                setAffiliateLinkInput(u);
                handleUnfurlLink(u);
              }}
              className="px-2.5 py-1 bg-white hover:bg-orange-100 border border-amber-200 rounded-xl text-[11px] font-semibold text-orange-950 transition-colors cursor-pointer"
            >
              🍳 Jogo de Panelas
            </button>
          </div>

          {/* Messages */}
          {pullSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pullSuccess}</span>
            </div>
          )}

          {pullError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pullError}</span>
            </div>
          )}

          {/* DRAFT PREVIEW CARD (WHEN DATA HAS BEEN EXTRACTED) */}
          {draftProduct && (
            <div className="bg-white rounded-2xl p-5 border border-orange-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pré-visualização do Produto Extraído
                </span>
                <span className="text-[11px] text-gray-400">
                  Depois você poderá plugar as chaves da API Shopee Open Platform no backend se desejar.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Image & Video Media Box */}
                <div className="space-y-2">
                  <div className="relative aspect-4/3 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                    <img
                      src={draftProduct.imageUrl}
                      alt={draftProduct.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white shadow-xs">
                        {draftProduct.badge}
                      </span>
                      {draftProduct.discountPercent && draftProduct.discountPercent > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          -{draftProduct.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    {draftProduct.videoUrl && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                        <Video className="w-3 h-3 text-amber-300" />
                        <span>Vídeo Extraído</span>
                      </div>
                    )}
                  </div>

                  {/* Extracted Images Thumbnails */}
                  {draftProduct.images && draftProduct.images.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {draftProduct.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Thumbnail"
                          onClick={() => setDraftProduct({ ...draftProduct, imageUrl: img })}
                          className={`w-11 h-11 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                            draftProduct.imageUrl === img
                              ? 'border-orange-500 scale-105'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Video Player Preview if extracted */}
                  {draftProduct.videoUrl && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-gray-700 block mb-1 flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-orange-600" />
                        Vídeo Demonstrativo Detectado:
                      </span>
                      <video
                        src={draftProduct.videoUrl}
                        controls
                        className="w-full rounded-xl max-h-36 bg-black"
                      />
                    </div>
                  )}
                </div>

                {/* Product Info & Form fields */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Título do Produto:
                    </label>
                    <input
                      type="text"
                      value={draftProduct.title}
                      onChange={(e) => setDraftProduct({ ...draftProduct, title: e.target.value })}
                      className="w-full font-bold text-gray-900 text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                        Preço Atual (R$):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={draftProduct.price}
                        onChange={(e) =>
                          setDraftProduct({
                            ...draftProduct,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full font-black text-orange-600 text-sm border border-gray-200 rounded-xl px-3 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                        Preço Original (R$):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={draftProduct.originalPrice || ''}
                        onChange={(e) =>
                          setDraftProduct({
                            ...draftProduct,
                            originalPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-gray-500 text-sm border border-gray-200 rounded-xl px-3 py-1.5"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                        Categoria:
                      </label>
                      <select
                        value={draftProduct.category}
                        onChange={(e) =>
                          setDraftProduct({ ...draftProduct, category: e.target.value })
                        }
                        className="w-full text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl px-2 py-1.5"
                      >
                        <option value="Utensílios de Medição">Utensílios de Medição</option>
                        <option value="Airfryer & Formas">Airfryer &amp; Formas</option>
                        <option value="Panelas & Frigideiras">Panelas &amp; Frigideiras</option>
                        <option value="Processadores Manuais">Processadores Manuais</option>
                        <option value="Armazenamento & Despensa">Armazenamento &amp; Despensa</option>
                        <option value="Espátulas & Acessórios">Espátulas &amp; Acessórios</option>
                        <option value="Temperos & Utensílios">Temperos &amp; Utensílios</option>
                        <option value="Acessórios de Cozinha">Acessórios de Cozinha</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Descrição Culinária Extraída:
                    </label>
                    <textarea
                      rows={3}
                      value={draftProduct.description}
                      onChange={(e) =>
                        setDraftProduct({ ...draftProduct, description: e.target.value })
                      }
                      className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-semibold text-emerald-700">
                        Comissão Estimada: {draftProduct.commissionEstimate}
                      </span>
                      <span>•</span>
                      <span>{draftProduct.salesCount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDraftProduct(null)}
                        className="px-3.5 py-2 rounded-xl text-gray-500 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleSaveDraft}
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Salvar no Catálogo de Achadinhos</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB 1: SHOPEE STOREFRONT */}
      {activeTab === 'shopee' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Subcategory Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div
                    onClick={() => {
                      setSelectedProductForDetail(prod);
                      setActiveMediaView(prod.videoUrl ? 'video' : 'photo');
                      setActivePhotoIndex(0);
                    }}
                    className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {prod.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white shadow-xs">
                          {prod.badge}
                        </span>
                      )}
                      {prod.discountPercent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          -{prod.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Video badge if present */}
                    {prod.videoUrl && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-black flex items-center gap-1.5 shadow-md">
                        <Play className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span>Vídeo Demonstrativo</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {prod.category}
                    </span>
                    <h3
                      onClick={() => {
                        setSelectedProductForDetail(prod);
                        setActiveMediaView(prod.videoUrl ? 'video' : 'photo');
                        setActivePhotoIndex(0);
                      }}
                      className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {prod.title}
                    </h3>

                    {prod.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {prod.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{prod.rating.toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{prod.salesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-xl text-orange-600">
                          R$ {prod.price.toFixed(2)}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            R$ {prod.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        Link Oficial de Afiliado
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedProductForDetail(prod);
                          setActiveMediaView(prod.videoUrl ? 'video' : 'photo');
                          setActivePhotoIndex(0);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                        title="Ver detalhes, fotos e vídeo"
                      >
                        Detalhes
                      </button>

                      <a
                        href={prod.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => recordShopeeClick(prod.id)}
                        className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Ver na Shopee</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: GAMIFICATION MISSIONS & COUPONS */}
      {activeTab === 'rewards' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Section: Active Missions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Missões da Semana
                </h2>
                <p className="text-xs text-gray-500">
                  Complete ações culinárias sustentáveis para acumular moedas e subir de nível
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missions.map((m) => {
                const percent = Math.min(100, Math.round((m.progress / m.target) * 100));

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-gray-200/80 bg-white shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">{m.title}</span>
                          {m.completed && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                              Concluída!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{m.description}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>+{m.rewardCoins}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1 font-semibold">
                        <span>
                          Progresso: {m.progress} de {m.target}
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-400">+{m.rewardXp} XP do Chef</span>

                      {m.claimed ? (
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Recompensa Resgatada
                        </span>
                      ) : m.completed ? (
                        <button
                          onClick={() => claimMissionReward(m.id)}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Resgatar +{m.rewardCoins} Moedas!
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">Em andamento</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Redeemable Reward Coupons */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <h2 className="font-black text-lg text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-rose-500" />
                Catálogo de Prêmios &amp; Cupons para Resgate
              </h2>
              <p className="text-xs text-gray-500">
                Troque suas moedas por vantagens financeiras e cupons válidos na Shopee
              </p>
            </div>

            {couponNotice && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-in fade-in">
                ⚠️ {couponNotice}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rewardCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-4 rounded-3xl border flex flex-col justify-between transition-all ${
                    coupon.redeemed
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-gray-200/80 shadow-xs hover:border-orange-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                        {coupon.badge}
                      </span>
                      <span className="text-xs font-black text-orange-600">
                        {coupon.discountValue}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                      {coupon.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    {coupon.redeemed ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center">
                          <span className="text-[10px] text-emerald-800 font-bold block">
                            CÓDIGO DE RESGATE:
                          </span>
                          <span className="text-xs font-black font-mono text-emerald-950">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.shopeeLink && (
                          <a
                            href={coupon.shopeeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-xs text-orange-600 font-bold hover:underline"
                          >
                            Usar na Shopee →
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-xs font-black text-amber-800">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{coupon.costCoins} moedas</span>
                        </div>

                        <button
                          onClick={() => {
                            const success = redeemCoupon(coupon.id);
                            if (!success) {
                              setCouponNotice('Moedas insuficientes para este resgate.');
                              setTimeout(() => setCouponNotice(null), 3500);
                            }
                          }}
                          disabled={user.coins < coupon.costCoins}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Resgatar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: SHOWS VIDEO, HIGH-RES GALLERY, AND RICH DESCRIPTION */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl border border-gray-100 space-y-4 max-h-[92vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    {selectedProductForDetail.category}
                  </span>
                  {selectedProductForDetail.badge && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      {selectedProductForDetail.badge}
                    </span>
                  )}
                </div>
                <h2 className="font-extrabold text-base sm:text-lg text-gray-900 leading-snug">
                  {selectedProductForDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Selector Tabs (Photo vs Video) */}
            {selectedProductForDetail.videoUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMediaView('video')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaView === 'video'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Vídeo Demonstrativo</span>
                </button>
                <button
                  onClick={() => setActiveMediaView('photo')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaView === 'photo'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Fotos do Produto ({selectedProductForDetail.images?.length || 1})</span>
                </button>
              </div>
            )}

            {/* Media Display Viewport */}
            <div className="relative aspect-16/9 rounded-2xl bg-black overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
              {activeMediaView === 'video' && selectedProductForDetail.videoUrl ? (
                <video
                  src={selectedProductForDetail.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={
                    selectedProductForDetail.images && selectedProductForDetail.images.length > 0
                      ? selectedProductForDetail.images[activePhotoIndex] || selectedProductForDetail.imageUrl
                      : selectedProductForDetail.imageUrl
                  }
                  alt={selectedProductForDetail.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Photo Gallery Thumbnails (if in photo mode and has multiple images) */}
            {activeMediaView === 'photo' &&
              selectedProductForDetail.images &&
              selectedProductForDetail.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedProductForDetail.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-14 h-14 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        activePhotoIndex === idx
                          ? 'border-orange-500 scale-105 shadow-xs'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              )}

            {/* Price & Discount Bar */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Preço Exclusivo de Afiliado Shopee:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-black text-2xl text-orange-600">
                    R$ {selectedProductForDetail.price.toFixed(2)}
                  </span>
                  {selectedProductForDetail.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      R$ {selectedProductForDetail.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {selectedProductForDetail.discountPercent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                      -{selectedProductForDetail.discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end text-amber-500 font-bold text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{selectedProductForDetail.rating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">
                    ({selectedProductForDetail.reviewsCount || 1200} avaliações)
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">
                  {selectedProductForDetail.salesCount}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                Sobre este Achadinho:
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                {selectedProductForDetail.description ||
                  'Utensílio culinário selecionado pelo ChefPantry para agilizar o preparo de receitas, reduzir desperdício e trazer praticidade à sua bancada.'}
              </p>
            </div>

            {/* Gamification Tip */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3 text-xs text-amber-950 font-medium">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <strong>Dica das Moedas do Chef:</strong> Comprando através do nosso link oficial, você apoia o ChefPantry e pode resgatar cupons de desconto Shopee com suas moedas acumuladas!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-bold text-xs cursor-pointer"
              >
                Voltar aos Achadinhos
              </button>

              <a
                href={selectedProductForDetail.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordShopeeClick(selectedProductForDetail.id)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs shadow-lg shadow-orange-600/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Comprar na Shopee com Desconto</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
