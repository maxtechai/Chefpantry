import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  PantryItem,
  ShoppingItem,
  Recipe,
  ShopeeProduct,
  AdminMetrics,
  UserProfile,
} from '../types';

/**
 * Health check for Firestore connection and latency test
 */
export async function testDatabaseConnectivity(): Promise<{
  connected: boolean;
  latencyMs: number;
  databaseId: string;
  error?: string;
}> {
  const start = Date.now();
  const dbId = firebaseConfig.firestoreDatabaseId || 'ai-studio-chefpantrydespen-847d07e4-ec5e-41a7-a7f9-dcbe1ed7cb90';
  try {
    const testRef = doc(db, 'test', 'healthcheck');
    await setDoc(testRef, {
      ping: 'pong',
      timestamp: serverTimestamp(),
      platform: 'ChefPantry v2.0',
    });
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latencyMs,
      databaseId: dbId,
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      databaseId: dbId,
      error: err?.message || 'Erro de conexão com o Firestore',
    };
  }
}

// ==========================================
// 1. USER PROFILE & STATS (users/{userId})
// ==========================================

export async function fetchOrInitUserProfile(
  userId: string,
  fallbackProfile: Partial<UserProfile>
): Promise<Partial<UserProfile>> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        coins: typeof data.coins === 'number' ? data.coins : fallbackProfile.coins || 100,
        xp: typeof data.xp === 'number' ? data.xp : fallbackProfile.xp || 0,
        level: typeof data.level === 'number' ? data.level : fallbackProfile.level || 1,
        savedRecipeIds: Array.isArray(data.savedRecipeIds) ? data.savedRecipeIds : [],
        name: data.name || fallbackProfile.name || 'Chef Usuário',
        email: data.email || fallbackProfile.email || '',
        role: data.role || fallbackProfile.role || 'user',
      };
    } else {
      // First time user login: initialize document in Firestore
      const initialDoc = {
        name: fallbackProfile.name || 'Chef Usuário',
        email: fallbackProfile.email || '',
        coins: fallbackProfile.coins ?? 100,
        xp: fallbackProfile.xp ?? 0,
        level: fallbackProfile.level ?? 1,
        savedRecipeIds: fallbackProfile.savedRecipeIds ?? [],
        role: fallbackProfile.role || 'user',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };
      await setDoc(userRef, initialDoc, { merge: true });
      return initialDoc;
    }
  } catch (err) {
    console.warn('[Firestore] Falha ao carregar perfil de usuário:', err);
    return fallbackProfile;
  }
}

export async function syncUserProfileToCloud(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        coins: profile.coins,
        xp: profile.xp,
        level: profile.level,
        savedRecipeIds: profile.savedRecipeIds,
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao sincronizar dados do usuário:', err);
  }
}

// ==========================================
// 2. USER PANTRY (users/{userId}/pantry/{itemId})
// ==========================================

export function subscribeUserPantry(
  userId: string,
  onUpdate: (items: PantryItem[]) => void
): Unsubscribe {
  const pantryCol = collection(db, `users/${userId}/pantry`);
  return onSnapshot(
    pantryCol,
    (snapshot) => {
      const items: PantryItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || '',
          quantity: d.quantity || '1',
          unit: d.unit || 'un',
          location: d.location || 'Geladeira',
          category: d.category || 'Hortifrúti',
          expiryDate: d.expiryDate || '',
          addedAt: d.addedAt || '',
          daysUntilExp: 999,
          isExpiringSoon: false,
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Erro ao escutar despensa remota:', err);
    }
  );
}

export async function savePantryItemCloud(userId: string, item: PantryItem): Promise<void> {
  if (!userId) return;
  try {
    const docRef = doc(db, `users/${userId}/pantry`, item.id);
    await setDoc(
      docRef,
      {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        category: item.category,
        expiryDate: item.expiryDate,
        addedAt: item.addedAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao salvar item da despensa no cloud:', err);
  }
}

export async function deletePantryItemCloud(userId: string, itemId: string): Promise<void> {
  if (!userId || !itemId) return;
  try {
    const docRef = doc(db, `users/${userId}/pantry`, itemId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Falha ao remover item da despensa no cloud:', err);
  }
}

// ==========================================
// 3. USER SHOPPING LIST (users/{userId}/shoppingList/{itemId})
// ==========================================

export function subscribeUserShoppingList(
  userId: string,
  onUpdate: (items: ShoppingItem[]) => void
): Unsubscribe {
  const shopCol = collection(db, `users/${userId}/shoppingList`);
  return onSnapshot(
    shopCol,
    (snapshot) => {
      const items: ShoppingItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || '',
          quantity: d.quantity || '1',
          unit: d.unit || 'un',
          category: d.category || 'Hortifrúti',
          checked: Boolean(d.checked),
          recipeOrigin: d.recipeOrigin || undefined,
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Erro ao escutar lista de compras:', err);
    }
  );
}

export async function saveShoppingItemCloud(userId: string, item: ShoppingItem): Promise<void> {
  if (!userId) return;
  try {
    const docRef = doc(db, `users/${userId}/shoppingList`, item.id);
    await setDoc(
      docRef,
      {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: item.checked,
        recipeOrigin: item.recipeOrigin || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao salvar item de compras no cloud:', err);
  }
}

export async function deleteShoppingItemCloud(userId: string, itemId: string): Promise<void> {
  if (!userId || !itemId) return;
  try {
    const docRef = doc(db, `users/${userId}/shoppingList`, itemId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Falha ao excluir item de compras no cloud:', err);
  }
}

// ==========================================
// 4. OFFICIAL RECIPES (official_recipes & recipes)
// ==========================================

export function subscribeOfficialRecipes(
  onUpdate: (recipes: Recipe[]) => void
): Unsubscribe {
  const recipesCol = collection(db, 'official_recipes');
  return onSnapshot(
    recipesCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudRecipes: Recipe[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || 'Receita',
            description: d.description || '',
            category: d.category || 'Almoço rápido',
            prepTime: d.prepTime || 15,
            cookTime: d.cookTime || 20,
            servings: d.servings || 2,
            difficulty: d.difficulty || 'Fácil',
            estimatedCalories: d.estimatedCalories || 300,
            isOfficial: true,
            isVerified: true,
            author: d.author || 'Chef Administrador',
            imageUrl: d.imageUrl || '',
            ingredients: d.ingredients || [],
            instructions: d.instructions || [],
            shopeeProductIds: d.shopeeProductIds || [],
            tips: d.tips || [],
            views: d.views || 0,
            cookedCount: d.cookedCount || 0,
            createdAt: d.createdAt || new Date().toISOString().split('T')[0],
          };
        });
        onUpdate(cloudRecipes);
      }
    },
    (err) => {
      console.warn('[Firestore] Erro ao carregar receitas oficiais:', err);
    }
  );
}

export async function saveOfficialRecipeCloud(recipe: Recipe): Promise<void> {
  try {
    const refOfficial = doc(db, 'official_recipes', recipe.id);
    const refPublic = doc(db, 'recipes', recipe.id);

    const recipePayload = {
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      estimatedCalories: recipe.estimatedCalories || 300,
      isOfficial: true,
      isVerified: true,
      author: recipe.author || 'Chef Administrador',
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      shopeeProductIds: recipe.shopeeProductIds || [],
      tips: recipe.tips || [],
      views: recipe.views || 1,
      cookedCount: recipe.cookedCount || 0,
      createdAt: recipe.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
    };

    // Save to both official_recipes and recipes collections
    await setDoc(refOfficial, recipePayload, { merge: true });
    await setDoc(refPublic, recipePayload, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Falha ao publicar receita oficial:', err);
    throw err;
  }
}

export async function deleteOfficialRecipeCloud(recipeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'official_recipes', recipeId));
    await deleteDoc(doc(db, 'recipes', recipeId));
  } catch (err) {
    console.warn('[Firestore] Falha ao excluir receita:', err);
  }
}

// ==========================================
// 5. STORE PRODUCTS & SHOPEE (store_products)
// ==========================================

export function subscribeStoreProducts(
  onUpdate: (products: ShopeeProduct[]) => void
): Unsubscribe {
  const storeCol = collection(db, 'store_products');
  return onSnapshot(
    storeCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudProducts: ShopeeProduct[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || 'Produto Shopee',
            category: d.category || 'Utensílios',
            price: d.price || 29.9,
            originalPrice: d.originalPrice || 49.9,
            discountPercent: d.discountPercent || 0,
            affiliateLink: d.affiliateLink || d.affiliateUrl || 'https://shopee.com.br',
            imageUrl: d.imageUrl || '',
            rating: d.rating || 4.8,
            reviewsCount: d.reviewsCount || 50,
            salesCount: d.salesCount || '10k+ vendidos',
            badge: d.badge,
            clicksCount: d.clicksCount || 0,
          };
        });
        onUpdate(cloudProducts);
      }
    },
    (err) => {
      console.warn('[Firestore] Erro ao carregar produtos da loja:', err);
    }
  );
}

export async function saveStoreProductCloud(product: ShopeeProduct): Promise<void> {
  try {
    const docRef = doc(db, 'store_products', product.id);
    await setDoc(
      docRef,
      {
        title: product.title,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        affiliateLink: product.affiliateLink || 'https://shopee.com.br',
        imageUrl: product.imageUrl,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        salesCount: product.salesCount || '10k+ vendidos',
        badge: product.badge || null,
        clicksCount: product.clicksCount || 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao salvar produto na loja:', err);
    throw err;
  }
}

export async function deleteStoreProductCloud(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'store_products', productId));
  } catch (err) {
    console.warn('[Firestore] Falha ao remover produto da loja:', err);
  }
}

// ==========================================
// 6. METRICS (metrics/overview)
// ==========================================

export function subscribeAdminMetrics(
  onUpdate: (metrics: Partial<AdminMetrics>) => void
): Unsubscribe {
  const metricsRef = doc(db, 'metrics', 'overview');
  return onSnapshot(
    metricsRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onUpdate({
          activeUsersCount: d.activeUsersCount ?? 1,
          totalCooked: d.totalCooked ?? 0,
          foodSavedKg: d.foodSavedKg ?? 0,
          shopeeClicks: d.shopeeClicks ?? 0,
          affiliateRevenueEstimate: d.affiliateRevenueEstimate ?? 0,
          totalViews: d.totalViews ?? 0,
        });
      }
    },
    (err) => {
      console.warn('[Firestore] Erro ao escutar métricas:', err);
    }
  );
}

export async function updateAdminMetricsCloud(metrics: Partial<AdminMetrics>): Promise<void> {
  try {
    const metricsRef = doc(db, 'metrics', 'overview');
    await setDoc(
      metricsRef,
      {
        ...metrics,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao atualizar métricas:', err);
  }
}
