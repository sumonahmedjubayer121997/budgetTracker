"use client";

import { useMemo } from "react";
import { type Expense, type UserProfile } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseChartsProps {
  expenses: Expense[];
  roommates: UserProfile[];
}

const COLORS = ["#64B5F6", "#9575CD", "#4DB6AC", "#FFB74D", "#F06292", "#A1887F"];

export function ExpenseCharts({ expenses, roommates }: ExpenseChartsProps) {
  const roommateMap = useMemo(() => {
    return roommates.reduce((acc, user) => {
      acc[user.userId] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [roommates]);

  const expensesByUser = useMemo(() => {
    const userTotals: { [key: string]: { name: string; total: number } } = {};
    
    expenses.forEach(expense => {
      const name = roommateMap[expense.userId] || `User...${expense.userId.slice(-4)}`;
      if (!userTotals[expense.userId]) {
        userTotals[expense.userId] = { name: name, total: 0 };
      }
      userTotals[expense.userId].total += expense.cost;
    });

    return Object.values(userTotals).filter(u => u.total > 0);
  }, [expenses, roommateMap]);

  const expensesByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach((expense) => {
      const category = expense.category || "Uncategorized";
      if (categoryMap[category]) {
        categoryMap[category] += expense.cost;
      } else {
        categoryMap[category] = expense.cost;
      }
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{`${label}`}</p>
          <p className="text-sm text-muted-foreground">{`Total: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };
  
  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{`${payload[0].name}`}</p>
          <p className="text-sm text-muted-foreground">{`Total: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Spending per Person</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={expensesByUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Tooltip content={<PieCustomTooltip />} />
              <Legend/>
              <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
