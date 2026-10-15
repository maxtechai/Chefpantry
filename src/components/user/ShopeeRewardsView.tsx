import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';

export const ShopeeRewardsView: React.FC = () => {
  const {
    user,
    shopeeProducts,
    recordShopeeClick,
    missions,
    claimMissionReward,
    rewardCoupons,
    redeemCoupon,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'shopee' | 'rewards'>('shopee');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [couponNotice, setCouponNotice] = useState<string | null>(null);

  const categories = ['Todos', 'Utensílios de Medição', 'Airfryer & Formas', 'Processadores Manuais', 'Armazenamento & Despensa'];

  const filteredProducts = shopeeProducts.filter(
    (p) => selectedCategory === 'Todos' || p.category === selectedCategory
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Banner: Wallet & Gamification Status */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Shopee Oficial + Gamificação
              </span>
              <span className="text-xs text-orange-100">Moedas do Chef</span>
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

        {/* View Switcher Tabs */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-white/20">
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
      </div>

      {/* CONTENT TAB 1: SHOPEE STOREFRONT */}
      {activeTab === 'shopee' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Subcategory Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
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
                  <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
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
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {prod.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {prod.title}
                    </h3>

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

                    <a
                      href={prod.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordShopeeClick(prod.id)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all shrink-0"
                    >
                      <span>Ver na Shopee</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs shadow-xs transition-colors"
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
                          className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs"
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
    </div>
  );
};
