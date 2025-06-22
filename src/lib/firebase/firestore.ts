import { doc, setDoc, getDoc, collection, addDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";
import type { UserProfile, Expense } from "../types";
import { categorizeExpense } from "@/ai/flows/categorize-expense";

export async function addUser(user: UserProfile) {
  const userRef = doc(db, "users", user.userId);
  await setDoc(userRef, user);
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUserRoom(userId: string, roomId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { roomId });
}

interface AddExpenseData {
  userId: string;
  roomId: string;
  shop: string;
  items: string;
  cost: number;
  date: Date;
}

export async function addExpense(data: AddExpenseData) {
  const { shop, items } = data;
  let category = "Uncategorized";
  try {
    const result = await categorizeExpense({ shopName: shop, itemDescription: items });
    if (result && result.category) {
        category = result.category;
    }
  } catch (error: any) {
    console.error("AI categorization failed:", error);
    // Re-throw a more specific error to be caught by the calling component
    if (error.message && error.message.includes('API key')) {
        throw new Error("AI categorization failed. Please ensure your Gemini API key is set correctly in the .env file.");
    }
     throw new Error("AI categorization failed. There might be an issue with the AI service.");
  }
  
  const expenseData = {
    ...data,
    category: category,
  };

  try {
    await addDoc(collection(db, "expenses"), expenseData);
  } catch(error) {
    console.error("Error writing to Firestore:", error);
    // Re-throw a more specific error
    throw new Error("Failed to save expense. This is likely a Firestore security rule issue. Please check your rules in the Firebase console.");
  }
}
