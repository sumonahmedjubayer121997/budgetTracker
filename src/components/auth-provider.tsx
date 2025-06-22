
"use client";

import React, { createContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser } from "@/lib/firebase/firestore";
import { type UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const profile = await getUser(user.uid);
      if (profile) {
        setUserData(profile);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const profile = await getUser(user.uid);
          if (profile) {
            setUserData(profile);
          } else {
            console.warn(`Could not fetch user profile for UID: ${user.uid}. It might not exist or rules are blocking access.`);
            setUserData(null);
          }
        } catch (error: any) {
          console.error("Failed to get user profile:", error);
          if (error.code === 'permission-denied' || (error.message && error.message.includes('offline'))) {
             toast({
                variant: "destructive",
                title: "Error Loading User Data",
                description: "Could not fetch user profile. This is likely due to Firestore security rules. Please ensure you have configured them to allow reads on the 'users' collection.",
                duration: 10000,
              });
          } else {
              toast({
                variant: "destructive",
                title: "Could not load user data",
                description: "An unexpected error occurred while fetching your profile.",
              });
          }
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isRoomPage = pathname === "/room";

    if (!user && !isAuthPage) {
      router.push("/login");
    } else if (user && isAuthPage) {
      router.push("/");
    } else if (user && userData && !userData.roomId && !isRoomPage) {
      router.push("/room");
    } else if (user && userData && userData.roomId && isRoomPage) {
      router.push("/");
    }
  }, [user, userData, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
