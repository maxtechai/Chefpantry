import React, { useState } from 'react';
import {
  Utensils,
  Sparkles,
  Refrigerator,
  Flame,
  Coins,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Zap,
} from 'lucide-react';

interface WelcomeIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishIntro: () => void;
}

const SLIDES = [
  {
    step: 'Passo 1 de 4',
    badge: 'Despensa Inteligente',
    title: 'Sua Despensa Organizada & Sem Desperdício',
    description:
      'Cadastre alimentos na geladeira, freezer e armário em segundos. O app monitora validades e avisa com antecedência para você nunca mais perder comida nem dinheiro.',
    icon: Refrigerator,
    gradient: 'from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50 border-emerald-200',
    previewItems: [
      { name: 'Ovos caipiras', days: 'Vence em 5 dias', ok: true },
      { name: 'Tomates maduros', days: 'Vence em 2 dias', warning: true },
      { name: 'Queijo mussarela', days: 'Vence em 4 dias', ok: true },
    ],
  },
  {
    step: 'Passo 2 de 4',
    badge: 'Chef IA Anti-Desperdício',
    title: 'Receitas Incríveis com o que Você Já Tem',
    description:
      'Não sabe o que cozinhar? A IA cruza os ingredientes da sua despensa e sugere receitas práticas e deliciosas com até 100% de match, sem precisar sair de casa.',
    icon: Flame,
    gradient: 'from-orange-500 to-amber-600',
    accentColor: 'text-orange-600',
    accentBg: 'bg-orange-50 border-orange-200',
    previewItems: [
      { name: 'Omelete Cremosa de Forno', days: '100% dos ingredientes em casa', ok: true },
      { name: 'Arroz Frito Especial', days: 'Aproveita sobra de arroz e legumes', ok: true },
    ],
  },
  {
    step: 'Passo 3 de 4',
    badge: 'Gamificação & Recompensas',
    title: 'Ganhe Moedas & Economize na Shopee',
    description:
      'Cada receita preparada sem desperdício rende Moedas de Chef e pontos de experiência. Suba de nível e troque suas moedas por cupons e achadinhos exclusivos na Shopee.',
    icon: Coins,
    gradient: 'from-amber-500 to-yellow-600',
    accentColor: 'text-amber-600',
    accentBg: 'bg-amber-50 border-amber-200',
    previewItems: [
      { name: '+50 Moedas ao cozinhar 1 receita', days: 'Missão do dia', ok: true },
      { name: 'Cupom R$ 15 OFF na Shopee', days: 'Desbloqueável com moedas', ok: true },
    ],
  },
  {
    step: 'Passo 4 de 4',
    badge: 'Acesso Unificado',
    title: 'Login Seguro: Admin & Chef de Casa',
    description:
      'Faça login com Google ou e-mail. Se for o administrador, o app libera o painel de controle; se for usuário, salva seus pratos e moedas. O admin também pode usar o app como cozinheiro normal a qualquer momento!',
    icon: ShieldCheck,
    gradient: 'from-purple-600 to-indigo-600',
    accentColor: 'text-purple-600',
    accentBg: 'bg-purple-50 border-purple-200',
    previewItems: [
      { name: 'Entrar com Conta Google (1 clique)', days: 'Rápido e seguro', ok: true },
      { name: 'Login ou Cadastro com E-mail', days: 'Disponível para todos', ok: true },
    ],
  },
];

export const WelcomeIntroModal: React.FC<WelcomeIntroModalProps> = ({
  isOpen,
  onClose,
  onFinishIntro,
}) => {
  // 0: Splash Screen with Logo, 1..4: Slide Deck
  const [currentScreen, setCurrentScreen] = useState<'splash' | number>('splash');

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentScreen === 'splash') {
      setCurrentScreen(0);
    } else if (typeof currentScreen === 'number') {
      if (currentScreen < SLIDES.length - 1) {
        setCurrentScreen(currentScreen + 1);
      } else {
        // Finished all slides
        localStorage.setItem('chefpantry_welcome_slides_seen', 'true');
        onFinishIntro();
      }
    }
  };

  const handlePrev = () => {
    if (typeof currentScreen === 'number') {
      if (currentScreen > 0) {
        setCurrentScreen(currentScreen - 1);
      } else {
        setCurrentScreen('splash');
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('chefpantry_welcome_slides_seen', 'true');
    onFinishIntro();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* ================= SCREEN 1: SPLASH WITH LOGO ================= */}
        {currentScreen === 'splash' && (
          <div className="p-8 sm:p-10 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/40 to-slate-50">
            {/* Top Skip Button */}
            <button
              onClick={handleSkip}
              className="absolute top-5 right-5 text-xs font-semibold text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all"
            >
              Pular
            </button>

            {/* Glowing Logo Icon */}
            <div className="relative my-4">
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/25 blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/30 border-2 border-white/80">
                <Utensils className="w-12 h-12" />
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-amber-950 shadow-sm">
                  <Sparkles className="w-4 h-4 fill-amber-950" />
                </div>
              </div>
            </div>

            {/* Brand Title & Tagline */}
            <div className="space-y-2 mt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                Despensa Inteligente PWA
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                Chef<span className="text-emerald-600">Pantry</span>
              </h1>
              <p className="text-sm font-semibold text-gray-700 max-w-sm mx-auto">
                Cozinha Inteligente, Zero Desperdício &amp; Receitas Oficiais
              </p>
            </div>

            {/* Key Value Bullets */}
            <div className="w-full bg-white/90 rounded-2xl p-4 border border-emerald-100/80 shadow-xs my-6 text-left space-y-2.5 text-xs text-gray-600">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Saiba o que tem em casa e não jogue comida fora</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Receitas sugeridas por IA com seus ingredientes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Moedas de Chef para economizar na Shopee</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="w-full space-y-2.5">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <span>Conhecer o Funcionamento</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleSkip}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors"
              >
                Ir direto para o Login / App →
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: SLIDE CAROUSEL ================= */}
        {typeof currentScreen === 'number' && (
          <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[500px]">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Voltar"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {SLIDES[currentScreen].step}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentScreen(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentScreen ? 'w-6 bg-emerald-600' : 'w-2 bg-gray-200 hover:bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
              >
                Pular
              </button>
            </div>

            {/* Slide Body */}
            <div className="py-6 space-y-5 animate-in fade-in duration-200">
              {/* Badge & Icon Banner */}
              <div className="flex items-center gap-3.5">
                {(() => {
                  const Icon = SLIDES[currentScreen].icon;
                  return (
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${SLIDES[currentScreen].gradient} text-white flex items-center justify-center shadow-lg shadow-black/10 shrink-0`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                  );
                })()}
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${SLIDES[currentScreen].accentBg} ${SLIDES[currentScreen].accentColor}`}>
                    {SLIDES[currentScreen].badge}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1 leading-snug">
                    {SLIDES[currentScreen].title}
                  </h2>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {SLIDES[currentScreen].description}
              </p>

              {/* Interactive Preview Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Exemplo na prática:
                </span>
                {SLIDES[currentScreen].previewItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">{item.days}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                {currentScreen === SLIDES.length - 1 ? (
                  <>
                    <span>Ir para o Login</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Próximo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
