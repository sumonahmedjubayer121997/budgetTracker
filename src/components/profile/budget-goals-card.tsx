
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/firebase/firestore";
import type { UserProfile, Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, PiggyBank, Edit3, PlusCircle, Trash2 } from "lucide-react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import React from "react";
import { getMonth, getYear } from "date-fns";

const formSchema = z.object({
    monthlyBudget: z.coerce.number().min(0, "Budget must be a positive number.").optional(),
});

interface BudgetGoalsCardProps {
  user: UserProfile;
}

export function BudgetGoalsCard({ user }: BudgetGoalsCardProps) {
    const { refreshUserData } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            monthlyBudget: user.monthlyBudget || 0,
        },
    });

    React.useEffect(() => {
        if (!user || !user.roomId) return;
    
        const currentDate = new Date();
        const startOfMonth = new Date(getYear(currentDate), getMonth(currentDate), 1);
        
        const expensesQuery = query(
            collection(db, "expenses"), 
            where("roomId", "==", user.roomId),
            where("date", ">=", Timestamp.fromDate(startOfMonth))
        );
    
        const unsubscribe = onSnapshot(expensesQuery, (querySnapshot) => {
            const expensesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: (doc.data().date as Timestamp).toDate(),
            })) as Expense[];
            setExpenses(expensesData);
        });
    
        return () => unsubscribe();
      }, [user]);

    const totalSpentThisMonth = useMemo(() => {
        return expenses.reduce((acc, expense) => acc + expense.cost, 0);
    }, [expenses]);
    
    const budgetProgress = useMemo(() => {
        if (!user.monthlyBudget || user.monthlyBudget === 0) return 0;
        return (totalSpentThisMonth / user.monthlyBudget) * 100;
    }, [totalSpentThisMonth, user.monthlyBudget]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await updateUserProfile(user.userId, { monthlyBudget: values.monthlyBudget });
            await refreshUserData();
            toast({ title: "Success", description: "Your budget has been updated." });
            setIsEditing(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update budget." });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleEditToggle = () => {
        if (!isEditing) {
            form.reset({ monthlyBudget: user.monthlyBudget || 0 });
        }
        setIsEditing(!isEditing);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Monthly Budget
                </CardTitle>
                <CardDescription>Set and track your spending goals for the month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditing ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="monthlyBudget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Limit (£)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="10" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Budget"}</Button>
                                <Button variant="outline" onClick={handleEditToggle}>Cancel</Button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Spent this month</span>
                                <span className="font-semibold text-2xl">£{totalSpentThisMonth.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Monthly budget</span>
                                <span>of £{(user.monthlyBudget || 0).toFixed(2)}</span>
                            </div>
                            <Progress value={budgetProgress} className="h-3" />
                            <div className="text-right text-xs text-muted-foreground">
                                {budgetProgress.toFixed(0)}% of budget used
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleEditToggle}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit Budget
                        </Button>
                    </>
                )}
                
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground">
                Note: This budget goal is personal and not shared with your roommates.
             </CardFooter>
        </Card>
    );
}
