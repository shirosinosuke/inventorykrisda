import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import {
  InventoryItem,
  CategorySetting,
  ConditionSetting,
  UserAccount,
  DEFAULT_CATEGORIES,
  DEFAULT_CONDITIONS,
  DEFAULT_USERS
} from './types.ts';
import { INITIAL_ITEMS } from './mockData.ts';

// User's provided Firebase configuration
export const firebaseConfig = {
  apiKey: 'AIzaSyAUGkGOa0q8BImEoDBFnJVrBe4-uT_eLFM',
  authDomain: 'inventorykrisda.firebaseapp.com',
  projectId: 'inventorykrisda',
  storageBucket: 'inventorykrisda.firebasestorage.app',
  messagingSenderId: '754777655364',
  appId: '1:754777655364:web:657820cdde068f69539411',
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const FIREBASE_CONSOLE_RULES_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  isPermissionDenied: boolean;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isPermissionDenied = errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient');

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    operationType,
    path,
    isPermissionDenied,
  };

  if (isPermissionDenied) {
    console.warn(`[Firestore Info] Akses '${operationType}' ke '${path}' memerlukan pembaruan rules di Firebase Console.`);
  } else {
    console.warn('[Firestore Info]:', JSON.stringify(errInfo));
  }

  return errInfo;
}

// Collections references
const ITEMS_COLLECTION = 'items';
const CATEGORIES_COLLECTION = 'categories';
const CONDITIONS_COLLECTION = 'conditions';
const USERS_COLLECTION = 'users';

// Real-time listener for Inventory Items
export function subscribeToItems(
  onData: (items: InventoryItem[]) => void,
  onError?: (errInfo: FirestoreErrorInfo) => void
) {
  const colRef = collection(db, ITEMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const result: InventoryItem[] = [];
      snapshot.forEach((d) => {
        result.push(d.data() as InventoryItem);
      });
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onData(result);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.GET, ITEMS_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
}

// Real-time listener for Categories
export function subscribeToCategories(
  onData: (categories: CategorySetting[]) => void,
  onError?: (errInfo: FirestoreErrorInfo) => void
) {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const result: CategorySetting[] = [];
      snapshot.forEach((d) => {
        result.push(d.data() as CategorySetting);
      });
      onData(result);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.GET, CATEGORIES_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
}

// Real-time listener for Conditions
export function subscribeToConditions(
  onData: (conditions: ConditionSetting[]) => void,
  onError?: (errInfo: FirestoreErrorInfo) => void
) {
  const colRef = collection(db, CONDITIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const result: ConditionSetting[] = [];
      snapshot.forEach((d) => {
        result.push(d.data() as ConditionSetting);
      });
      onData(result);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.GET, CONDITIONS_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
}

// Real-time listener for Users
export function subscribeToUsers(
  onData: (users: UserAccount[]) => void,
  onError?: (errInfo: FirestoreErrorInfo) => void
) {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const result: UserAccount[] = [];
      snapshot.forEach((d) => {
        result.push(d.data() as UserAccount);
      });
      onData(result);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.GET, USERS_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
}

// Save or Update an item in Firestore
export async function saveItemToFirestore(item: InventoryItem): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, ITEMS_COLLECTION, item.id);
    await setDoc(docRef, item, { merge: true });
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ITEMS_COLLECTION}/${item.id}`);
    return { success: true, isCloud: false };
  }
}

// Delete item from Firestore
export async function deleteItemFromFirestore(id: string): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, ITEMS_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ITEMS_COLLECTION}/${id}`);
    return { success: true, isCloud: false };
  }
}

// Save category to Firestore
export async function saveCategoryToFirestore(category: CategorySetting): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, category.id);
    await setDoc(docRef, category, { merge: true });
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CATEGORIES_COLLECTION}/${category.id}`);
    return { success: true, isCloud: false };
  }
}

// Delete category from Firestore
export async function deleteCategoryFromFirestore(id: string): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CATEGORIES_COLLECTION}/${id}`);
    return { success: true, isCloud: false };
  }
}

// Save condition to Firestore
export async function saveConditionToFirestore(condition: ConditionSetting): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, CONDITIONS_COLLECTION, condition.id);
    await setDoc(docRef, condition, { merge: true });
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CONDITIONS_COLLECTION}/${condition.id}`);
    return { success: true, isCloud: false };
  }
}

// Delete condition from Firestore
export async function deleteConditionFromFirestore(id: string): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, CONDITIONS_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CONDITIONS_COLLECTION}/${id}`);
    return { success: true, isCloud: false };
  }
}

// Save user to Firestore
export async function saveUserToFirestore(user: UserAccount): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(docRef, user, { merge: true });
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${user.id}`);
    return { success: true, isCloud: false };
  }
}

// Delete user from Firestore
export async function deleteUserFromFirestore(id: string): Promise<{ success: boolean; isCloud: boolean }> {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COLLECTION}/${id}`);
    return { success: true, isCloud: false };
  }
}

// Initialize Firestore database & seed initial data safely
export async function initializeFirestoreDatabase(): Promise<{
  connected: boolean;
  seeded: boolean;
  permissionDenied: boolean;
  error?: string;
}> {
  try {
    // Check if Firestore items collection is empty; if so, populate initial seed data
    const itemsSnapshot = await getDocs(collection(db, ITEMS_COLLECTION));
    let seeded = false;

    if (itemsSnapshot.empty) {
      const batch = writeBatch(db);

      INITIAL_ITEMS.forEach((it) => {
        const itemRef = doc(db, ITEMS_COLLECTION, it.id);
        batch.set(itemRef, it);
      });

      DEFAULT_CATEGORIES.forEach((cat) => {
        const catRef = doc(db, CATEGORIES_COLLECTION, cat.id);
        batch.set(catRef, cat);
      });

      DEFAULT_CONDITIONS.forEach((cond) => {
        const condRef = doc(db, CONDITIONS_COLLECTION, cond.id);
        batch.set(condRef, cond);
      });

      DEFAULT_USERS.forEach((usr) => {
        const usrRef = doc(db, USERS_COLLECTION, usr.id);
        batch.set(usrRef, usr);
      });

      await batch.commit();
      seeded = true;
    }

    return { connected: true, seeded, permissionDenied: false };
  } catch (err: any) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isPermission = errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient');

    if (isPermission) {
      console.warn(`[Firestore Notice] Proyek '${firebaseConfig.projectId}' memerlukan update Security Rules di Firebase Console.`);
    }

    return {
      connected: false,
      seeded: false,
      permissionDenied: isPermission,
      error: errMsg,
    };
  }
}
