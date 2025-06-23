
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, storage } from "./config";
import type { UserProfile } from "../types";
import { categorizeExpense } from "@/ai/flows/categorize-expense";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export async function addUser(user: UserProfile) {
  const userRef = doc(db, "users", user.userId);
  await setDoc(userRef, user);
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      userId: userSnap.id,
      ...data,
    } as UserProfile;
  }
  return null;
}

export async function updateUserRoom(userId: string, roomId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { roomId });
}

export async function leaveRoom(userId: string) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { roomId: null });
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data as DocumentData);
}

export async function updateUserAvatar(userId: string, file: File) {
    const imagePath = `avatars/${userId}/${file.name}`;
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, file);
    const avatarUrl = await getDownloadURL(storageRef);
    await updateUserProfile(userId, { avatarUrl });
    return avatarUrl;
}

// Helper for image uploads
async function handleImageUpload(userId: string, receipt: File) {
    const imagePath = `receipts/${userId}/${Date.now()}_${receipt.name}`;
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, receipt);
    const imageUrl = await getDownloadURL(storageRef);
    return { imageUrl, imagePath };
}

interface AddExpenseData {
  userId: string;
  roomId: string;
  shop: string;
  items: string;
  cost: number;
  date: Date;
  receipt?: File;
}

export async function addExpense(data: AddExpenseData) {
  const { shop, items, userId, receipt } = data;
  let category = "Uncategorized";
  try {
    const result = await categorizeExpense({ shopName: shop, itemDescription: items });
    if (result && result.category) {
        category = result.category;
    }
  } catch (error: any) {
    console.error("AI categorization failed:", error);
    if (error.message && error.message.includes('API key')) {
        throw new Error("AI categorization failed. Please ensure your Gemini API key is set correctly in the .env file.");
    }
     throw new Error("AI categorization failed. There might be an issue with the AI service.");
  }
  
  const expenseData: any = {
    userId: data.userId,
    roomId: data.roomId,
    shop: data.shop,
    items: data.items,
    cost: data.cost,
    date: Timestamp.fromDate(data.date),
    category: category,
  };

  if (receipt) {
    const { imageUrl, imagePath } = await handleImageUpload(userId, receipt);
    expenseData.imageUrl = imageUrl;
    expenseData.imagePath = imagePath;
  }

  try {
    await addDoc(collection(db, "expenses"), expenseData);
  } catch(error: any) {
    console.error("Error writing to Firestore:", error);
     throw new Error(`Failed to save expense. This is likely a Firestore security rule issue. Original error: ${error.message}`);
  }
}

interface UpdateExpenseData {
    id: string;
    userId: string;
    date: Date;
    shop: string;
    items: string;
    cost: number;
    receipt?: File;
    imagePath?: string;
    imageUrl?: string;
}

export async function updateExpense(data: UpdateExpenseData) {
    const { id, shop, items, userId, receipt, imagePath: oldImagePath } = data;
    const expenseRef = doc(db, "expenses", id);
    
    let category = "Uncategorized";
    try {
        const result = await categorizeExpense({ shopName: shop, itemDescription: items });
        if (result && result.category) {
            category = result.category;
        }
    } catch (error) {
        console.error("AI categorization failed:", error);
    }

    const expenseDataToUpdate: any = {
        shop,
        items,
        date: Timestamp.fromDate(data.date),
        cost: data.cost,
        category,
    };

    if (receipt) { // A new file is being uploaded
        if (oldImagePath) {
            const oldImageRef = ref(storage, oldImagePath);
            await deleteObject(oldImageRef).catch(err => console.error("Failed to delete old image", err));
        }
        const { imageUrl, imagePath } = await handleImageUpload(userId, receipt);
        expenseDataToUpdate.imageUrl = imageUrl;
        expenseDataToUpdate.imagePath = imagePath;
    } else if (data.imageUrl === null) { // Image is being removed
        if (oldImagePath) {
            const oldImageRef = ref(storage, oldImagePath);
            await deleteObject(oldImageRef).catch(err => console.error("Failed to delete old image", err));
        }
        expenseDataToUpdate.imageUrl = null;
        expenseDataToUpdate.imagePath = null;
    }


    await updateDoc(expenseRef, expenseDataToUpdate);
}

export async function deleteExpense(expenseId: string, imagePath?: string) {
  if (imagePath) {
    const imageRef = ref(storage, imagePath);
    try {
      await deleteObject(imageRef);
    } catch (error: any) {
      console.error("Error deleting image from storage:", error);
      if (error.code !== 'storage/object-not-found') {
        throw new Error("Could not delete receipt image. Please try again.");
      }
    }
  }

  const expenseRef = doc(db, "expenses", expenseId);
  try {
    await deleteDoc(expenseRef);
  } catch (error: any) {
    console.error("Error deleting expense from Firestore:", error);
    throw new Error(`Failed to delete expense data. This might be a Firestore security rule issue. Original error: ${error.message}`);
  }
}
