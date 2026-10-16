export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  coins: number;
  xp: number;
  level: number;
  completedMissions: string[];
  savedRecipeIds: string[];
}

export type StorageLocation = 'Geladeira' | 'Freezer' | 'Armário';

export type FoodCategory =
  | 'Hortifrúti'
  | 'Laticínios & Ovos'
  | 'Mercearia & Grãos'
  | 'Carnes & Proteínas'
  | 'Temperos & Óleos'
  | 'Congelados'
  | 'Bebidas & Outros';

export type RecipeCategory =
  | 'Todos'
  | 'Café da manhã'
  | 'Almoço rápido'
  | 'Jantar'
  | 'Doces & Sobremesas'
  | 'Airfryer & Prático'
  | 'Fit & Saudável';

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category?: FoodCategory;
}

export interface RecipeInstruction {
  step: number;
  title: string;
  text: string;
  timeMinutes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  prepTime: number; // in mins
  cookTime: number; // in mins
  servings: number;
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  estimatedCalories?: number;
  isOfficial: boolean;
  isVerified?: boolean;
  author: string;
  imageUrl: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  shopeeProductIds: string[];
  tips?: string[];
  views: number;
  cookedCount: number;
  createdAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  location: StorageLocation;
  category: FoodCategory;
  expiryDate: string; // YYYY-MM-DD
  daysUntilExp: number;
  isExpiringSoon: boolean;
  addedAt: string;
}

export interface ShopeeProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  affiliateLink: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  salesCount: string;
  badge?: string;
  commissionEstimate?: string;
  clicksCount: number;
  description?: string;
  videoUrl?: string;
  images?: string[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  iconType: 'cook' | 'pantry' | 'zerowaste' | 'explore';
}

export interface RewardCoupon {
  id: string;
  title: string;
  description: string;
  code: string;
  costCoins: number;
  discountValue: string;
  badge: string;
  redeemed: boolean;
  shopeeLink?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: FoodCategory;
  checked: boolean;
  recipeOrigin?: string;
}

export interface AdminMetrics {
  totalViews: number;
  totalCooked: number;
  shopeeClicks: number;
  affiliateRevenueEstimate: number;
  foodSavedKg: number;
  activeUsersCount: number;
}
