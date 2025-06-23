
"use client";

import { useAuth } from "@/hooks/use-auth";
import { UserInfoCard } from "@/components/profile/user-info-card";
import { AccountSettingsCard } from "@/components/profile/account-settings-card";
import { BudgetGoalsCard } from "@/components/profile/budget-goals-card";
import { RoomInfoCard } from "@/components/profile/room-info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/icons";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function ProfilePageSkeleton() {
    return (
        <div className="p-4 md:p-8 space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg md:col-span-2 lg:col-span-1" />
                <Skeleton className="h-72 rounded-lg lg:col-span-2" />
            </div>
        </div>
    )
}


export default function ProfilePage() {
    const { userData, loading } = useAuth();

    if (loading || !userData) {
        return <ProfilePageSkeleton />;
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
                 <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                        <Logo className="h-6 w-6 text-primary" />
                        <span className="sr-only">Roommate Expenses</span>
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Profile & Settings</h1>
                </nav>
                <div className="ml-auto flex items-center gap-4">
                   <Button variant="outline" size="sm" asChild>
                       <Link href="/">
                           <ArrowLeft className="mr-2 h-4 w-4" />
                           Back to Dashboard
                       </Link>
                   </Button>
                   <UserNav />
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UserInfoCard user={userData} />
                    <BudgetGoalsCard user={userData} />
                    <RoomInfoCard user={userData} />
                    <AccountSettingsCard />
                </div>
            </main>
        </div>
    );
}
