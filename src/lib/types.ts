import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  roomId: string | null;
  avatarUrl?: string;
}

export interface Room {
  id: string;
  name:string;
  members: string[];
}

export interface Expense {
  id: string;
  userId: string;
  roomId: string;
  date: Timestamp;
  shop: string;
  items: string;
  cost: number;
  category: string;
}
