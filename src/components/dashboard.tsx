"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { type Expense, type UserProfile } from "@/lib/types";
import { UserNav } from "./user-nav";
import { AddExpenseDialog } from "./add-expense-dialog";
import { ExpenseTable } from "./expense-table";
import { ExpenseCharts } from "./expense-charts";
import { Skeleton } from "./ui/skeleton";
import { Logo } from "./icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { signOutUser } from "@/lib/firebase/auth";
import { Badge } from "./ui/badge";

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-[420px] lg:col-span-4" />
        <Skeleton className="h-[420px] lg:col-span-3" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}


export default function Dashboard() {
  const { userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [roommates, setRoommates] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!userData || !userData.roomId) {
      if(!authLoading) {
          setLoadingData(false);
      }
      return;
    }

    // Fetch roommates
    const fetchRoommates = async () => {
      try {
        const usersQuery = query(collection(db, "users"), where("roomId", "==", userData.roomId));
        const querySnapshot = await getDocs(usersQuery);
        const roommatesData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        setRoommates(roommatesData);
      } catch (error) {
        console.error("Error fetching roommates:", error);
        toast({
          variant: "destructive",
          title: "Error Fetching Roommates",
          description: "Could not load roommate data. This is likely due to your Firestore security rules. Please ensure they allow users to read profiles of other users in the same room.",
          duration: 10000,
        });
      }
    };

    fetchRoommates();

    // Subscribe to expenses
    const expensesQuery = query(collection(db, "expenses"), where("roomId", "==", userData.roomId));
    const unsubscribe = onSnapshot(expensesQuery, 
      (querySnapshot) => {
        const expensesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[];
        setExpenses(expensesData);
        setLoadingData(false);
      },
      (error) => {
        console.error("Error fetching expenses:", error);
        toast({
          variant: "destructive",
          title: "Error Fetching Data",
          description: "Could not load expenses. This might be a network issue or misconfigured Firestore security rules.",
        });
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [userData, authLoading, toast]);

  if (authLoading || loadingData) {
    return <DashboardSkeleton />;
  }

  if (!userData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Profile Error</CardTitle>
            <CardDescription>
              We couldn&apos;t find a user profile for your account. This can happen if
              account creation was interrupted. Please sign out and try signing
              up again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signOutUser()}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <a href="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">Roommate Expenses</span>
          </a>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </nav>
        <div className="ml-auto flex items-center gap-4">
            {userData?.roomId && (
              <Badge variant="outline" className="hidden sm:block">
                Room ID: {userData.roomId}
              </Badge>
            )}
           <AddExpenseDialog />
           <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <ExpenseCharts expenses={expenses} roommates={roommates} />
        <Card>
            <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>All expenses for your room are listed here.</CardDescription>
            </CardHeader>
            <CardContent>
                <ExpenseTable expenses={expenses} roommates={roommates} />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
