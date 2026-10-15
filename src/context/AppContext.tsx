import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserRole,
  Recipe,
  ShopeeProduct,
  PantryItem,
  ShoppingItem,
  Mission,
  RewardCoupon,
  AdminMetrics,
  RecipeIngredient,
} from '../types';
import {
  initialUser,
  initialRecipes,
  initialShopeeProducts,
  initialPantryItems,
  initialShoppingList,
  initialMissions,
  initialRewardCoupons,
  initialAdminMetrics,
} from '../data/initialData';
import confetti from 'canvas-confetti';
import { recordShopeeClickBackground } from '../lib/guestMigration';
import { useAuth } from './AuthContext';
import {
  testDatabaseConnectivity,
  fetchOrInitUserProfile,
  syncUserProfileToCloud,
  subscribeUserPantry,
  savePantryItemCloud,
  deletePantryItemCloud,
  subscribeUserShoppingList,
  saveShoppingItemCloud,
  deleteShoppingItemCloud,
  subscribeOfficialRecipes,
  saveOfficialRecipeCloud,
  deleteOfficialRecipeCloud,
  subscribeStoreProducts,
  saveStoreProductCloud,
  deleteStoreProductCloud,
  subscribeAdminMetrics,
  updateAdminMetricsCloud,
} from '../lib/firestoreService';

interface AppContextType {
  user: UserProfile;
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'views' | 'cookedCount' | 'createdAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  cookRecipe: (recipe: Recipe) => { coinsEarned: number; ingredientsUsed: string[] };
  incrementRecipeViews: (id: string) => void;
  toggleSaveRecipe: (recipeId: string) => void;

  shopeeProducts: ShopeeProduct[];
  addShopeeProduct: (prod: Omit<ShopeeProduct, 'id' | 'clicksCount'>) => void;
  updateShopeeProduct: (id: string, prod: Partial<ShopeeProduct>) => void;
  deleteShopeeProduct: (id: string) => void;
  recordShopeeClick: (id: string) => void;

  pantryItems: PantryItem[];
  addPantryItem: (item: Omit<PantryItem, 'id' | 'addedAt' | 'daysUntilExp' | 'isExpiringSoon'>) => void;
  addPantryItemsBatch: (items: Array<Omit<PantryItem, 'id' | 'addedAt' | 'daysUntilExp' | 'isExpiringSoon'>>) => void;
  updatePantryItem: (id: string, item: Partial<PantryItem>) => void;
  deletePantryItem: (id: string) => void;

  shoppingList: ShoppingItem[];
  addToShoppingList: (items: Array<Omit<ShoppingItem, 'id' | 'checked'>>) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  movePurchasedToPantry: () => number;
  clearCompletedShopping: () => void;

  missions: Mission[];
  claimMissionReward: (missionId: string) => void;

  rewardCoupons: RewardCoupon[];
  redeemCoupon: (couponId: string) => boolean;

  adminMetrics: AdminMetrics;
  selectedRecipeForModal: Recipe | null;
  setSelectedRecipeForModal: (recipe: Recipe | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Cloud Database Connection State
  isCloudConnected: boolean;
  cloudLatencyMs: number | null;
  testCloudConnection: () => Promise<{ connected: boolean; latencyMs: number; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function calculateDaysUntilExp(expiryDate: string): number {
  if (!expiryDate) return 999;
  const target = new Date(expiryDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();

  // Cloud connection monitoring
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [cloudLatencyMs, setCloudLatencyMs] = useState<number | null>(null);

  // 1. User Profile & Role
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('chefpantry_user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('chefpantry_role') as UserRole | null;
    return saved || 'user';
  });

  // 2. Recipes
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('chefpantry_recipes');
    return saved ? JSON.parse(saved) : initialRecipes;
  });

  // 3. Shopee Products
  const [shopeeProducts, setShopeeProducts] = useState<ShopeeProduct[]>(() => {
    const saved = localStorage.getItem('chefpantry_shopee');
    return saved ? JSON.parse(saved) : initialShopeeProducts;
  });

  // 4. Pantry Items
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => {
    const saved = localStorage.getItem('chefpantry_pantry');
    if (saved) {
      const parsed: PantryItem[] = JSON.parse(saved);
      return parsed.map((item) => {
        const days = calculateDaysUntilExp(item.expiryDate);
        return {
          ...item,
          daysUntilExp: days,
          isExpiringSoon: days <= 3 && days >= 0,
        };
      });
    }
    return initialPantryItems;
  });

  // 5. Shopping List
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('chefpantry_shopping');
    return saved ? JSON.parse(saved) : initialShoppingList;
  });

  // 6. Missions & Rewards
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('chefpantry_missions');
    return saved ? JSON.parse(saved) : initialMissions;
  });

  const [rewardCoupons, setRewardCoupons] = useState<RewardCoupon[]>(() => {
    const saved = localStorage.getItem('chefpantry_coupons');
    return saved ? JSON.parse(saved) : initialRewardCoupons;
  });

  // 7. Metrics
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>(() => {
    const saved = localStorage.getItem('chefpantry_metrics');
    return saved ? JSON.parse(saved) : initialAdminMetrics;
  });

  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');

  // Test Cloud Connectivity
  const testCloudConnection = async () => {
    const result = await testDatabaseConnectivity();
    setIsCloudConnected(result.connected);
    setCloudLatencyMs(result.latencyMs);
    return result;
  };

  // Perform initial healthcheck once on boot
  useEffect(() => {
    testCloudConnection().catch(() => {});
  }, []);

  // Save state snapshots to localStorage for offline cache & guest fallback
  useEffect(() => {
    localStorage.setItem('chefpantry_user', JSON.stringify({ ...user, role }));
  }, [user, role]);

  useEffect(() => {
    localStorage.setItem('chefpantry_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('chefpantry_shopee', JSON.stringify(shopeeProducts));
  }, [shopeeProducts]);

  useEffect(() => {
    localStorage.setItem('chefpantry_pantry', JSON.stringify(pantryItems));
    localStorage.setItem('guest_pantry', JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem('chefpantry_shopping', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('chefpantry_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem('chefpantry_coupons', JSON.stringify(rewardCoupons));
  }, [rewardCoupons]);

  useEffect(() => {
    localStorage.setItem('chefpantry_metrics', JSON.stringify(adminMetrics));
  }, [adminMetrics]);

  // ========================================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION
  // ========================================================

  // 1. Listen to Global Official Recipes & Store Products & Metrics
  useEffect(() => {
    const unsubRecipes = subscribeOfficialRecipes((cloudRecipes) => {
      if (cloudRecipes && cloudRecipes.length > 0) {
        setRecipes(cloudRecipes);
      }
    });

    const unsubProducts = subscribeStoreProducts((cloudProds) => {
      if (cloudProds && cloudProds.length > 0) {
        setShopeeProducts(cloudProds);
      }
    });

    const unsubMetrics = subscribeAdminMetrics((cloudMetrics) => {
      setAdminMetrics((prev) => ({ ...prev, ...cloudMetrics }));
    });

    return () => {
      unsubRecipes();
      unsubProducts();
      unsubMetrics();
    };
  }, []);

  // 2. Listen to Authenticated User's Profile, Private Pantry & Shopping List
  useEffect(() => {
    if (!currentUser) return;

    // A. Sync / Init User Profile
    fetchOrInitUserProfile(currentUser.uid, {
      name: currentUser.displayName || user.name,
      email: currentUser.email || user.email,
      coins: user.coins,
      xp: user.xp,
      level: user.level,
      savedRecipeIds: user.savedRecipeIds,
      role: isAdmin ? 'admin' : 'user',
    }).then((cloudProf) => {
      if (cloudProf) {
        setUser((prev) => ({
          ...prev,
          coins: cloudProf.coins ?? prev.coins,
          xp: cloudProf.xp ?? prev.xp,
          level: cloudProf.level ?? prev.level,
          savedRecipeIds: cloudProf.savedRecipeIds ?? prev.savedRecipeIds,
          name: currentUser.displayName || prev.name,
          email: currentUser.email || prev.email,
        }));
      }
    });

    // B. Real-time Pantry Listener
    const unsubPantry = subscribeUserPantry(currentUser.uid, (cloudItems) => {
      if (cloudItems) {
        const enriched = cloudItems.map((item) => {
          const days = calculateDaysUntilExp(item.expiryDate);
          return {
            ...item,
            daysUntilExp: days,
            isExpiringSoon: days <= 3 && days >= 0,
          };
        });
        setPantryItems(enriched);
      }
    });

    // C. Real-time Shopping List Listener
    const unsubShopping = subscribeUserShoppingList(currentUser.uid, (cloudShopping) => {
      if (cloudShopping) {
        setShoppingList(cloudShopping);
      }
    });

    return () => {
      unsubPantry();
      unsubShopping();
    };
  }, [currentUser?.uid]);

  // Actions
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('chefpantry_role', newRole);
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  const toggleRole = () => {
    setRole(role === 'admin' ? 'user' : 'admin');
  };

  // Recipe Operations
  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'views' | 'cookedCount' | 'createdAt'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `rec_${Date.now()}`,
      views: 1,
      cookedCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRecipes((prev) => [newRecipe, ...prev]);

    // Save to Firestore Official Recipes
    saveOfficialRecipeCloud(newRecipe).catch((err) =>
      console.warn('Erro ao salvar receita no Firestore:', err)
    );
  };

  const updateRecipe = (id: string, partial: Partial<Recipe>) => {
    let updatedRecipe: Recipe | null = null;
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          updatedRecipe = { ...r, ...partial };
          return updatedRecipe;
        }
        return r;
      })
    );
    if (updatedRecipe) {
      saveOfficialRecipeCloud(updatedRecipe).catch((err) =>
        console.warn('Erro ao atualizar receita no Firestore:', err)
      );
    }
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    deleteOfficialRecipeCloud(id).catch((err) =>
      console.warn('Erro ao excluir receita no Firestore:', err)
    );
  };

  const incrementRecipeViews = (id: string) => {
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, views: r.views + 1 };
          saveOfficialRecipeCloud(updated).catch(() => {});
          return updated;
        }
        return r;
      })
    );
    setAdminMetrics((prev) => ({ ...prev, totalViews: prev.totalViews + 1 }));
  };

  const toggleSaveRecipe = (recipeId: string) => {
    setUser((prev) => {
      const exists = prev.savedRecipeIds.includes(recipeId);
      const updated = exists
        ? prev.savedRecipeIds.filter((id) => id !== recipeId)
        : [...prev.savedRecipeIds, recipeId];

      if (currentUser?.uid) {
        syncUserProfileToCloud(currentUser.uid, { savedRecipeIds: updated });
      }

      return { ...prev, savedRecipeIds: updated };
    });
  };

  const cookRecipe = (recipe: Recipe) => {
    // 1. Give XP & Coins
    const coinsEarned = 25;
    const xpEarned = 50;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
    });

    setUser((prev) => {
      const nextXp = prev.xp + xpEarned;
      const nextCoins = prev.coins + coinsEarned;
      const nextLevel = Math.floor(nextXp / 200) + 1;

      if (currentUser?.uid) {
        syncUserProfileToCloud(currentUser.uid, {
          coins: nextCoins,
          xp: nextXp,
          level: nextLevel,
        });
      }

      return {
        ...prev,
        coins: nextCoins,
        xp: nextXp,
        level: nextLevel,
      };
    });

    // 2. Increment cooked count
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id === recipe.id) {
          const updated = { ...r, cookedCount: r.cookedCount + 1 };
          saveOfficialRecipeCloud(updated).catch(() => {});
          return updated;
        }
        return r;
      })
    );

    // 3. Mark missions
    setMissions((prev) =>
      prev.map((m) => {
        if (m.iconType === 'cook') {
          const nextProg = m.progress + 1;
          return {
            ...m,
            progress: nextProg,
            completed: nextProg >= m.target,
          };
        }
        return m;
      })
    );

    // 4. Update metrics (food saved estimated 0.4kg per meal)
    setAdminMetrics((prev) => {
      const updated = {
        ...prev,
        totalCooked: prev.totalCooked + 1,
        foodSavedKg: Number((prev.foodSavedKg + 0.4).toFixed(1)),
      };
      updateAdminMetricsCloud({
        totalCooked: updated.totalCooked,
        foodSavedKg: updated.foodSavedKg,
      }).catch(() => {});
      return updated;
    });

    // 5. Cross-check pantry to deduct matching items
    const usedNames: string[] = [];
    setPantryItems((prev) => {
      return prev.filter((pItem) => {
        const matches = recipe.ingredients.some(
          (rIng) =>
            rIng.name.toLowerCase().includes(pItem.name.toLowerCase()) ||
            pItem.name.toLowerCase().includes(rIng.name.toLowerCase())
        );
        if (matches) {
          usedNames.push(pItem.name);
          if (currentUser?.uid) {
            deletePantryItemCloud(currentUser.uid, pItem.id);
          }
          return false; // consumed
        }
        return true;
      });
    });

    return { coinsEarned, ingredientsUsed: usedNames };
  };

  // Shopee Products Operations
  const addShopeeProduct = (prod: Omit<ShopeeProduct, 'id' | 'clicksCount'>) => {
    const newProd: ShopeeProduct = {
      ...prod,
      id: `shp_${Date.now()}`,
      clicksCount: 0,
    };
    setShopeeProducts((prev) => [newProd, ...prev]);
    saveStoreProductCloud(newProd).catch((err) =>
      console.warn('Erro ao salvar produto Shopee no Firestore:', err)
    );
  };

  const updateShopeeProduct = (id: string, prod: Partial<ShopeeProduct>) => {
    let updatedProd: ShopeeProduct | null = null;
    setShopeeProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedProd = { ...p, ...prod };
          return updatedProd;
        }
        return p;
      })
    );
    if (updatedProd) {
      saveStoreProductCloud(updatedProd).catch((err) =>
        console.warn('Erro ao atualizar produto Shopee no Firestore:', err)
      );
    }
  };

  const deleteShopeeProduct = (id: string) => {
    setShopeeProducts((prev) => prev.filter((p) => p.id !== id));
    deleteStoreProductCloud(id).catch((err) =>
      console.warn('Erro ao excluir produto Shopee no Firestore:', err)
    );
  };

  const recordShopeeClick = (id: string) => {
    // 1. Non-blocking cloud update
    recordShopeeClickBackground(id);

    // 2. Local state update
    setShopeeProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, clicksCount: p.clicksCount + 1 } : p))
    );
    setAdminMetrics((prev) => ({
      ...prev,
      shopeeClicks: prev.shopeeClicks + 1,
      affiliateRevenueEstimate: Number((prev.affiliateRevenueEstimate + 3.5).toFixed(2)),
    }));
  };

  // Pantry Items Operations
  const addPantryItem = (
    item: Omit<PantryItem, 'id' | 'addedAt' | 'daysUntilExp' | 'isExpiringSoon'>
  ) => {
    const days = calculateDaysUntilExp(item.expiryDate);
    const newItem: PantryItem = {
      ...item,
      id: `pan_${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0],
      daysUntilExp: days,
      isExpiringSoon: days <= 3 && days >= 0,
    };
    setPantryItems((prev) => [newItem, ...prev]);

    if (currentUser?.uid) {
      savePantryItemCloud(currentUser.uid, newItem);
    }

    // Check pantry missions
    setMissions((prev) =>
      prev.map((m) => {
        if (m.iconType === 'pantry') {
          const nextProg = pantryItems.length + 1;
          return {
            ...m,
            progress: nextProg,
            completed: nextProg >= m.target,
          };
        }
        return m;
      })
    );
  };

  const addPantryItemsBatch = (
    items: Array<Omit<PantryItem, 'id' | 'addedAt' | 'daysUntilExp' | 'isExpiringSoon'>>
  ) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const newItems: PantryItem[] = items.map((it, idx) => {
      const days = calculateDaysUntilExp(it.expiryDate);
      return {
        ...it,
        id: `pan_${Date.now()}_${idx}`,
        addedAt: nowStr,
        daysUntilExp: days,
        isExpiringSoon: days <= 3 && days >= 0,
      };
    });
    setPantryItems((prev) => [...newItems, ...prev]);

    if (currentUser?.uid) {
      newItems.forEach((it) => savePantryItemCloud(currentUser.uid, it));
    }
  };

  const updatePantryItem = (id: string, partial: Partial<PantryItem>) => {
    let updatedItem: PantryItem | null = null;
    setPantryItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...partial };
          const days = calculateDaysUntilExp(updated.expiryDate);
          updatedItem = {
            ...updated,
            daysUntilExp: days,
            isExpiringSoon: days <= 3 && days >= 0,
          };
          return updatedItem;
        }
        return item;
      })
    );

    if (currentUser?.uid && updatedItem) {
      savePantryItemCloud(currentUser.uid, updatedItem);
    }
  };

  const deletePantryItem = (id: string) => {
    setPantryItems((prev) => prev.filter((it) => it.id !== id));
    if (currentUser?.uid) {
      deletePantryItemCloud(currentUser.uid, id);
    }
  };

  // Shopping List Operations
  const addToShoppingList = (items: Array<Omit<ShoppingItem, 'id' | 'checked'>>) => {
    const newItems: ShoppingItem[] = items.map((item, idx) => ({
      ...item,
      id: `shop_${Date.now()}_${idx}`,
      checked: false,
    }));
    setShoppingList((prev) => [...newItems, ...prev]);

    if (currentUser?.uid) {
      newItems.forEach((it) => saveShoppingItemCloud(currentUser.uid, it));
    }
  };

  const toggleShoppingItem = (id: string) => {
    let updatedItem: ShoppingItem | null = null;
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, checked: !item.checked };
          return updatedItem;
        }
        return item;
      })
    );

    if (currentUser?.uid && updatedItem) {
      saveShoppingItemCloud(currentUser.uid, updatedItem);
    }
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
    if (currentUser?.uid) {
      deleteShoppingItemCloud(currentUser.uid, id);
    }
  };

  const movePurchasedToPantry = (): number => {
    const purchased = shoppingList.filter((item) => item.checked);
    if (purchased.length === 0) return 0;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const expiryStr = futureDate.toISOString().split('T')[0];

    const toPantry: Array<Omit<PantryItem, 'id' | 'addedAt' | 'daysUntilExp' | 'isExpiringSoon'>> =
      purchased.map((it) => {
        let loc: 'Geladeira' | 'Freezer' | 'Armário' = 'Armário';
        if (it.category === 'Laticínios & Ovos' || it.category === 'Hortifrúti') {
          loc = 'Geladeira';
        } else if (it.category === 'Carnes & Proteínas' || it.category === 'Congelados') {
          loc = 'Freezer';
        }
        return {
          name: it.name,
          quantity: it.quantity,
          unit: it.unit || 'unidade',
          location: loc,
          category: it.category,
          expiryDate: expiryStr,
        };
      });

    addPantryItemsBatch(toPantry);

    if (currentUser?.uid) {
      purchased.forEach((it) => deleteShoppingItemCloud(currentUser.uid, it.id));
    }

    setShoppingList((prev) => prev.filter((it) => !it.checked));
    return purchased.length;
  };

  const clearCompletedShopping = () => {
    const completed = shoppingList.filter((it) => it.checked);
    if (currentUser?.uid) {
      completed.forEach((it) => deleteShoppingItemCloud(currentUser.uid, it.id));
    }
    setShoppingList((prev) => prev.filter((item) => !item.checked));
  };

  const claimMissionReward = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    setUser((prev) => {
      const nextCoins = prev.coins + mission.rewardCoins;
      const nextXp = prev.xp + mission.rewardXp;
      const nextCompleted = [...prev.completedMissions, missionId];

      if (currentUser?.uid) {
        syncUserProfileToCloud(currentUser.uid, {
          coins: nextCoins,
          xp: nextXp,
        });
      }

      return {
        ...prev,
        coins: nextCoins,
        xp: nextXp,
        completedMissions: nextCompleted,
      };
    });

    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m))
    );

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981'],
    });
  };

  const redeemCoupon = (couponId: string): boolean => {
    const coupon = rewardCoupons.find((c) => c.id === couponId);
    if (!coupon || coupon.redeemed) return false;
    if (user.coins < coupon.costCoins) return false;

    setUser((prev) => {
      const nextCoins = prev.coins - coupon.costCoins;
      if (currentUser?.uid) {
        syncUserProfileToCloud(currentUser.uid, { coins: nextCoins });
      }
      return {
        ...prev,
        coins: nextCoins,
      };
    });

    setRewardCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, redeemed: true } : c))
    );

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#ec4899', '#8b5cf6', '#10b981'],
    });

    return true;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        setRole,
        toggleRole,
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        cookRecipe,
        incrementRecipeViews,
        toggleSaveRecipe,
        shopeeProducts,
        addShopeeProduct,
        updateShopeeProduct,
        deleteShopeeProduct,
        recordShopeeClick,
        pantryItems,
        addPantryItem,
        addPantryItemsBatch,
        updatePantryItem,
        deletePantryItem,
        shoppingList,
        addToShoppingList,
        toggleShoppingItem,
        removeShoppingItem,
        movePurchasedToPantry,
        clearCompletedShopping,
        missions,
        claimMissionReward,
        rewardCoupons,
        redeemCoupon,
        adminMetrics,
        selectedRecipeForModal,
        setSelectedRecipeForModal,
        activeTab,
        setActiveTab,
        isCloudConnected,
        cloudLatencyMs,
        testCloudConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
