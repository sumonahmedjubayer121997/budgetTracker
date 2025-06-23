
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { type Expense, type UserProfile } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowUpDown, ListFilter, MoreHorizontal, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { DeleteExpenseAlert } from "./delete-expense-alert";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";

interface ExpenseTableProps {
  expenses: Expense[];
  roommates: UserProfile[];
}

type SortKey = "date" | "cost" | "shop" | "user";
type SortDirection = "asc" | "desc";

export function ExpenseTable({ expenses, roommates }: ExpenseTableProps) {
  const { userData } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {

    if (roommates.length > 0) {
        setSelectedUsers(roommates.map(r => r.userId));

    }
  }, [roommates, selectedUsers]);

  const roommateMap = useMemo(() => {
    return roommates.reduce((acc, user) => {
      acc[user.userId] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [roommates]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter((expense) => selectedUsers.includes(expense.userId));

    return filtered.sort((a, b) => {
      let valA, valB;

      switch (sortKey) {
        case "cost":
          valA = a.cost;
          valB = b.cost;
          break;
        case "shop":
          valA = a.shop.toLowerCase();
          valB = b.shop.toLowerCase();
          break;
        case "user":
          valA = (roommateMap[a.userId] || "").toLowerCase();
          valB = (roommateMap[b.userId] || "").toLowerCase();
          break;
        default: // date
          valA = a.date.getTime();
          valB = b.date.getTime();
      }

      if (valA < valB) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [expenses, selectedUsers, sortKey, sortDirection, roommateMap]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const totalCost = useMemo(() => {
    return filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.cost, 0);
  }, [filteredAndSortedExpenses]);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const forceUpdate = () => {
    // This is a dummy function to trigger re-renders if needed,
    // but onSnapshot should handle most updates.
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <ListFilter className="mr-2 h-4 w-4" /> Filter by Person
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">

          {roommates.map((user) => (
  <DropdownMenuCheckboxItem
    key={user.userId}
    checked={selectedUsers.includes(user.userId)}
    onCheckedChange={() => toggleUser(user.userId)}
  >
    {user.name}
  </DropdownMenuCheckboxItem>
))}

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                Date <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead onClick={() => handleSort("shop")} className="cursor-pointer">
                Shop <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead onClick={() => handleSort("user")} className="cursor-pointer">
                Person <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
              </TableHead>
              <TableHead onClick={() => handleSort("cost")} className="text-right cursor-pointer">
                Cost <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
              </TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedExpenses.length > 0 ? (
              filteredAndSortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {expense.date ? format(expense.date, "MMM d, yyyy") : 'N/A'}
                  </TableCell>
                  <TableCell>{expense.items}</TableCell>
                  <TableCell>{expense.shop}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{expense.category || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>{roommateMap[expense.userId] || `User...${expense.userId.slice(-4)}`}</TableCell>
                  <TableCell className="text-right">${expense.cost.toFixed(2)}</TableCell>
                  <TableCell>
                    {expense.imageUrl && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <Image
                            src={expense.imageUrl}
                            alt="Receipt"
                            width={300}
                            height={400}
                            className="rounded-md"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableCell>
                  <TableCell>
                    {userData?.userId === expense.userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(expense)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(expense)}
                            className="text-red-600 focus:text-red-500"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No expenses found for the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Total: ${totalCost.toFixed(2)}
        </div>
      </div>

      {selectedExpense && (
        <>
          <EditExpenseDialog
            expense={selectedExpense}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdated={forceUpdate}
          />
          <DeleteExpenseAlert
            expenseId={selectedExpense.id}
            imagePath={selectedExpense.imagePath}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onDeleted={forceUpdate}
          />
        </>
      )}
    </div>
  );
}
