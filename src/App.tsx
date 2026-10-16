import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { UserHome } from './components/user/UserHome';
import { SmartPantry } from './components/user/SmartPantry';
import { ShoppingListView } from './components/user/ShoppingListView';
import { ShopeeRewardsView } from './components/user/ShopeeRewardsView';
import { RecipeDetailModal } from './components/user/RecipeDetailModal';
import { ZeroWasteFlowModal } from './components/user/ZeroWasteFlowModal';
import { OnboardingModal } from './components/user/OnboardingModal';
import { WelcomeIntroModal } from './components/user/WelcomeIntroModal';
import { UnifiedAuthModal } from './components/auth/UnifiedAuthModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Recipe } from './types';

const MainLayout: React.FC = () => {
  const { role, setRole, activeTab, selectedRecipeForModal, setSelectedRecipeForModal } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [showZeroWasteModal, setShowZeroWasteModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Initial Onboarding Flow:
  // 1. Welcome Splash & Slides (Shown ONLY on first launch for normal users)
  // 2. Day 1 Pantry Onboarding ("O que tem na sua geladeira agora?") - ONLY APÓS CADASTRO!
  useEffect(() => {
    const hasSeenSlides = localStorage.getItem('chefpantry_welcome_slides_seen');

    if (!hasSeenSlides) {
      // First-time visit: Start with the App Logo splash screen and onboarding slides
      const timer = setTimeout(() => {
        setShowWelcomeIntro(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFinishIntroSlides = () => {
    setShowWelcomeIntro(false);
    // After the intro slides, present the Unified Login screen
    setShowAuthModal(true);
  };

  const handleFinishAuth = (isNewRegistration?: boolean) => {
    setShowAuthModal(false);
    // Modal "O que tem na sua geladeira agora?" aparece APENAS APÓS CADASTRO
    if (isNewRegistration) {
      const hasOnboarded = localStorage.getItem('chefpantry_onboarded');
      if (!hasOnboarded) {
        setTimeout(() => {
          setShowOnboardingModal(true);
        }, 500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header with PWA Install, Coins, and Login / Identity Indicator */}
      <Header onOpenIntroSlides={() => setShowWelcomeIntro(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {role === 'admin' ? (
          /* ADMIN PORTAL */
          <AdminDashboard />
        ) : (
          /* USER APP VIEWS (accessible to normal users AND admin in user mode) */
          <>
            {activeTab === 'home' && (
              <UserHome
                onOpenZeroWaste={() => setShowZeroWasteModal(true)}
                onOpenRecipe={(recipe: Recipe) => setSelectedRecipeForModal(recipe)}
                onOpenOnboarding={() => setShowOnboardingModal(true)}
                onOpenIntroSlides={() => setShowWelcomeIntro(true)}
              />
            )}
            {activeTab === 'pantry' && (
              <SmartPantry onOpenZeroWaste={() => setShowZeroWasteModal(true)} />
            )}
            {activeTab === 'shopping' && <ShoppingListView />}
            {activeTab === 'shopee' && <ShopeeRewardsView />}
          </>
        )}
      </main>

      {/* Bottom Nav on Mobile for User Mode */}
      {role === 'user' && (
        <BottomNav onOpenZeroWaste={() => setShowZeroWasteModal(true)} />
      )}

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Step 1: Welcome Splash with Logo + Explanatory Slides Deck (First-time only) */}
      <WelcomeIntroModal
        isOpen={showWelcomeIntro}
        onClose={() => setShowWelcomeIntro(false)}
        onFinishIntro={handleFinishIntroSlides}
      />

      {/* Step 2: Unified Auth Modal (Admin and Normal User Login) */}
      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(isNewRegistration) => handleFinishAuth(isNewRegistration)}
        onOpenIntroSlides={() => setShowWelcomeIntro(true)}
      />

      {/* Step 3: Day 1 Pantry Onboarding Modal ("O que tem na sua geladeira agora?") */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onOpenZeroWaste={() => setShowZeroWasteModal(true)}
      />

      {/* Recipe Detail Modal */}
      {selectedRecipeForModal && (
        <RecipeDetailModal
          recipe={selectedRecipeForModal}
          onClose={() => setSelectedRecipeForModal(null)}
        />
      )}

      {/* Zero Waste AI Cooking Flow Modal */}
      {showZeroWasteModal && (
        <ZeroWasteFlowModal
          onClose={() => setShowZeroWasteModal(false)}
          onOpenRecipe={(recipe: Recipe) => setSelectedRecipeForModal(recipe)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}
