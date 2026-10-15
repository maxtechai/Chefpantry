import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
  updateDoc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { PantryItem, ShoppingItem } from '../types';

/**
 * Migrates local guest pantry items to the authenticated user's Firestore collection.
 * Follows the user specification:
 * users/{userId}/pantry/{itemId}
 */
export async function migrateGuestDataToUser(userId: string): Promise<number> {
  try {
    const guestPantryRaw =
      localStorage.getItem('guest_pantry') || localStorage.getItem('chefpantry_pantry') || '[]';
    const localPantry: PantryItem[] = JSON.parse(guestPantryRaw);

    if (Array.isArray(localPantry) && localPantry.length > 0) {
      const batch = writeBatch(db);
      localPantry.forEach((item) => {
        const itemRef = doc(collection(db, `users/${userId}/pantry`));
        batch.set(itemRef, {
          name: item.name,
          quantity: item.quantity || '1',
          unit: item.unit || 'un',
          location: item.location || 'Geladeira',
          category: item.category || 'Hortifrúti',
          expiryDate: item.expiryDate || '',
          addedAt: item.addedAt || new Date().toISOString().split('T')[0],
          migratedFromGuest: true,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
      // Remove temporary guest storage once persisted to Firestore
      localStorage.removeItem('guest_pantry');
      console.log(`[ChefPantry] Migrados ${localPantry.length} itens de visitante para Firestore.`);
      return localPantry.length;
    }
  } catch (error) {
    console.warn('[ChefPantry] Falha na migração de itens do convidado:', error);
  }
  return 0;
}

/**
 * Non-blocking background registration of Shopee affiliate click in Firestore
 */
export async function recordShopeeClickBackground(productId: string): Promise<void> {
  try {
    // 1. Update product click count in background
    if (productId) {
      const prodRef = doc(db, 'store_products', productId);
      updateDoc(prodRef, {
        clicksCount: increment(1),
        lastClickAt: serverTimestamp(),
      }).catch(() => {
        // Fallback: document might not exist yet in cloud, create it with merge
        setDoc(
          prodRef,
          {
            id: productId,
            clicksCount: increment(1),
            lastClickAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      });
    }

    // 2. Increment global metrics in background
    const metricsRef = doc(db, 'metrics', 'overview');
    setDoc(
      metricsRef,
      {
        shopeeClicks: increment(1),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  } catch (e) {
    // Non-blocking, fails gracefully
  }
}
