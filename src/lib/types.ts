
import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  roomId: string | null;
  avatarUrl?: string;
  monthlyBudget?: number;
  categoryBudgets?: { [key: string]: number };
}

export interface Room {
  id: string;
  name:string;
  members: string[];
}

export interface Expense {
  id:string;
  userId: string;
  roomId: string;
  date: Date;
  shop: string;
  items: string;
  cost: number;
  category: string;
  imageUrl?: string;
  imagePath?: string;
}
